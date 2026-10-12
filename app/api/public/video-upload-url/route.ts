import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, limitOrResponse, readJson } from "@/lib/api";
import { slugSchema } from "@/lib/validation";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicCreator } from "@/lib/public-data";
import { MAX_VIDEO_BYTES, VIDEO_TYPES, createVideoUpload, videoConfigured } from "@/lib/storage/video";

const schema = z.object({
  slug: slugSchema,
  contentType: z.string().transform((s) => s.split(";")[0].trim().toLowerCase()),
  size: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (!videoConfigured()) {
    return jsonError("Video uploads aren't set up for this site yet. Please use a text review.", 501, { code: "video_not_configured" });
  }
  const limited = limitOrResponse(req, "video-url", 5, 60 * 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("Uploads aren't available right now.", 503);

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { slug, contentType, size } = parsed.data;
  if (!(contentType in VIDEO_TYPES)) return jsonError("Please use a WebM or MP4 video.", 415);
  if (size > MAX_VIDEO_BYTES) return jsonError("That video is too large (100 MB max).", 413);

  // only issue upload URLs for real collection pages
  if (!(await getPublicCreator(slug))) return jsonError("Not found.", 404);

  try {
    const { uploadUrl, publicUrl } = await createVideoUpload(contentType, size);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (e) {
    console.error("[video] presign failed", e instanceof Error ? e.name : "unknown");
    return jsonError("We couldn't prepare the upload. Please try again.", 500);
  }
}
