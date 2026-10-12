import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getAuth, jsonError, limitOrResponse } from "@/lib/api";
import { slugSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const limited = limitOrResponse(req, "slug-check", 40, 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("Unavailable", 503);

  const slug = slugSchema.safeParse(new URL(req.url).searchParams.get("slug") ?? "");
  if (!slug.success) return NextResponse.json({ available: false, reason: slug.error.issues[0]?.message });

  const { data } = await createAdminClient().from("profiles").select("id").eq("public_slug", slug.data).maybeSingle();
  const auth = await getAuth();
  const available = !data || data.id === auth?.user.id;
  return NextResponse.json({ available, reason: available ? undefined : "That URL is already taken." });
}
