import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const VIDEO_TYPES: Record<string, string> = { "video/webm": "webm", "video/mp4": "mp4" };

/** Video uploads go browser → R2/S3 directly via a signed PUT URL, never through a Next.js route. */
export const videoConfigured = () =>
  Boolean(
    process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_PUBLIC_URL,
  );

export const videoPublicPrefix = () => `${(process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "")}/videos/`;

let s3: S3Client | null = null;
const client = () =>
  (s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  }));

export async function createVideoUpload(contentType: string, size: number) {
  const ext = VIDEO_TYPES[contentType];
  const key = `videos/${crypto.randomUUID()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  return { uploadUrl, publicUrl: `${videoPublicPrefix()}${key.slice("videos/".length)}`, key };
}
