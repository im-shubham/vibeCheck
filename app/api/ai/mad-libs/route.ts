import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicCreator } from "@/lib/public-data";
import { jsonError, limitOrResponse, readJson } from "@/lib/api";
import { madLibsAiSchema } from "@/lib/validation";
import { generateMadLibParagraph } from "@/lib/ai/generate-mad-libs";
import { metered } from "@/lib/ai/metered";

/** Optional AI smoothing of a Mad Libs paragraph. The deterministic version works without this route. */
export async function POST(req: Request) {
  const limited = limitOrResponse(req, "ai-madlibs", 10, 10 * 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("This feature isn't available right now.", 503);

  const parsed = madLibsAiSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Please fill in all three answers.", 400);

  const creator = await getPublicCreator(parsed.data.slug);
  if (!creator) return jsonError("Not found.", 404);

  const result = await metered(creator.id, creator.plan, "mad_libs", () =>
    generateMadLibParagraph(parsed.data.answers, creator.displayName),
  );
  if (!result.ok) return result.response;
  return NextResponse.json({ paragraph: result.value });
}
