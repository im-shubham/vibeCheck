import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { jsonError, limitOrResponse } from "@/lib/api";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/storage/images";

/** Anonymous reviewer photo upload: strict size/type validation, random server-chosen names. */
export async function POST(req: Request) {
  const limited = limitOrResponse(req, "upload-image", 10, 60 * 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("Uploads aren't available right now.", 503);

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_IMAGE_BYTES + 4096) return jsonError("Please choose an image under 2 MB.", 413);

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return jsonError("Invalid upload.", 400);
  }
  if (!file) return jsonError("No file received.", 400);
  if (file.size > MAX_IMAGE_BYTES) return jsonError("Please choose an image under 2 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return jsonError("Please upload a JPG, PNG or WebP image.", 415);

  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await admin.storage.from("reviewer-images").upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (error) return jsonError("We couldn't upload that image. You can skip it and submit anyway.", 500);

  const { data } = admin.storage.from("reviewer-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
