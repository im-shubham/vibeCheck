import { NextResponse } from "next/server";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { testimonialPatchSchema, uuidSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return jsonError("Not found.", 404);
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = testimonialPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { status, contentText } = parsed.data;

  // RLS scopes this to the signed-in creator: someone else's id simply returns nothing.
  const { data: existing } = await auth.supabase
    .from("testimonials")
    .select("id, creator_id, status, content_text, original_content_text, consent_to_publish")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return jsonError("Testimonial not found.", 404);

  const update: Record<string, unknown> = {};

  if (status && status !== existing.status) {
    if (status === "approved") {
      if (!existing.consent_to_publish) return jsonError("The reviewer didn't consent to publishing this testimonial.", 409);
      const { data: top } = await auth.supabase
        .from("testimonials")
        .select("sort_order")
        .eq("creator_id", existing.creator_id)
        .eq("status", "approved")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      update.sort_order = (top?.sort_order ?? 0) + 1; // new approvals go to the end of the wall
    }
    update.status = status;
  }

  if (contentText !== undefined && contentText !== existing.content_text) {
    update.content_text = contentText;
    // keep the reviewer's very first words so edits are reversible/auditable
    if (!existing.original_content_text) update.original_content_text = existing.content_text;
  }

  if (Object.keys(update).length === 0) {
    const { data } = await auth.supabase.from("testimonials").select("*").eq("id", id).single();
    return NextResponse.json({ testimonial: data });
  }

  const { data, error } = await auth.supabase.from("testimonials").update(update).eq("id", id).select("*").single();
  if (error) return jsonError("We couldn't save that change. Please try again.", 500);
  return NextResponse.json({ testimonial: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return jsonError("Not found.", 404);
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const { data, error } = await auth.supabase.from("testimonials").delete().eq("id", id).select("id");
  if (error) return jsonError("We couldn't delete that testimonial.", 500);
  if (!data?.length) return jsonError("Testimonial not found.", 404);
  return NextResponse.json({ ok: true });
}
