import { NextResponse } from "next/server";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { vibeChipsRequestSchema } from "@/lib/validation";
import { generateAndSaveChips } from "@/lib/ai/chips-service";
import { adminConfigured } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);
  if (!adminConfigured()) return jsonError("This feature isn't available right now.", 503);

  const parsed = vibeChipsRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Tell us your profession first.", 400);

  // identity and plan come from the verified session, never from the request body
  const { data: profile } = await auth.supabase.from("profiles").select("plan").eq("id", auth.user.id).maybeSingle();
  if (!profile) return jsonError("Finish onboarding first.", 409);

  const { allowFallback, ...input } = parsed.data;
  const out = await generateAndSaveChips(auth.supabase, auth.user.id, profile.plan, input, allowFallback);
  if (!out.ok) return jsonError(out.message, out.status);
  return NextResponse.json({ chips: out.chips, source: out.source, warning: out.warning });
}
