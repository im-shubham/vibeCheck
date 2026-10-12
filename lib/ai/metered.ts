import "server-only";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { consumeAiUsage, refundAiUsage, type AIFeature } from "@/lib/ai-usage";
import { AIError } from "./types";
import { aiConfigured, mapError } from "./client";

type Metered<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

/**
 * Runs an AI call against the creator's server-side monthly quota.
 * The slot is reserved atomically BEFORE the call and refunded if the provider fails,
 * so failures don't cost quota and concurrent requests can't overshoot the limit.
 */
export async function metered<T>(creatorId: string, plan: string, feature: AIFeature, fn: () => Promise<T>): Promise<Metered<T>> {
  if (!aiConfigured()) {
    return { ok: false, response: jsonError("AI features aren't set up on this server yet.", 503, { code: "not_configured" }) };
  }
  let usage;
  try {
    usage = await consumeAiUsage(creatorId, feature, plan);
  } catch {
    return { ok: false, response: jsonError("We couldn't check AI usage right now. Please try again.", 503) };
  }
  if (!usage.allowed) {
    return {
      ok: false,
      response: jsonError("The monthly AI limit has been reached. You can keep writing in your own words.", 429, { code: "usage_limit" }),
    };
  }
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    const err: AIError = mapError(e);
    await refundAiUsage(creatorId, feature).catch(() => undefined);
    return { ok: false, response: jsonError(err.userMessage, err.status, { code: err.code }) };
  }
}
