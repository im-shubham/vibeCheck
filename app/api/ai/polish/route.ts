import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicCreator } from "@/lib/public-data";
import { jsonError, limitOrResponse, readJson } from "@/lib/api";
import { polishSchema } from "@/lib/validation";
import { polishTestimonial } from "@/lib/ai/polish-testimonial";
import { metered } from "@/lib/ai/metered";

/**
 * Reviewers are anonymous, so usage is charged to the creator whose page they're on
 * (resolved server-side from the slug), plus a per-IP burst limit.
 */
export async function POST(req: Request) {
  const limited = limitOrResponse(req, "ai-polish", 10, 10 * 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("This feature isn't available right now.", 503);

  const parsed = polishSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { slug, text, tone } = parsed.data;

  const creator = await getPublicCreator(slug);
  if (!creator) return jsonError("Not found.", 404);

  const result = await metered(creator.id, creator.plan, "polish", () => polishTestimonial(text, tone));
  if (!result.ok) return result.response;
  return NextResponse.json({ rewritten: result.value });
}
