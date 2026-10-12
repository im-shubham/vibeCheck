import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { planOf } from "@/lib/plans";

export type AIFeature = "polish" | "vibe_chips" | "mad_libs";

/**
 * Atomically reserve one AI request against the creator's monthly plan limit.
 * Enforcement lives in Postgres (advisory-locked), so concurrent or direct API
 * calls cannot exceed it.
 */
export async function consumeAiUsage(
  creatorId: string,
  feature: AIFeature,
  plan: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = planOf(plan).aiPerMonth;
  const { data, error } = await createAdminClient().rpc("consume_ai_usage", {
    p_creator: creatorId,
    p_feature: feature,
    p_limit: limit,
  });
  if (error) throw new Error("usage_check_failed");
  const row = Array.isArray(data) ? data[0] : data;
  return { allowed: Boolean(row?.allowed), used: Number(row?.used ?? 0), limit };
}

export async function refundAiUsage(creatorId: string, feature: AIFeature): Promise<void> {
  await createAdminClient().rpc("refund_ai_usage", { p_creator: creatorId, p_feature: feature });
}
