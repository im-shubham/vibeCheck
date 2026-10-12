import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { profileSchema, vibeChipsSchema } from "@/lib/validation";
import { generateAndSaveChips } from "@/lib/ai/chips-service";
import { adminConfigured } from "@/lib/supabase/admin";
import { supabasePublicPrefix } from "@/lib/storage/images";
import type { Profile } from "@/lib/types";

const patchSchema = profileSchema.extend({ vibeChips: vibeChipsSchema.optional() });

function avatarAllowed(url: string | null, userId: string) {
  return url === null || url.startsWith(`${supabasePublicPrefix("avatars")}${userId}/`);
}

const toColumns = (v: z.infer<typeof profileSchema>) => ({
  display_name: v.displayName,
  business_name: v.businessName,
  brand_name: v.brandName,
  profession_niche: v.professionNiche,
  website_url: v.websiteUrl,
  avatar_url: v.avatarUrl,
  public_slug: v.publicSlug,
});

/** Onboarding: create the signed-in user's profile, a default widget, and Vibe Chips. */
export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = profileSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details.", 400, { field: parsed.error.issues[0]?.path[0] });
  const v = parsed.data;
  if (!avatarAllowed(v.avatarUrl, auth.user.id)) return jsonError("That profile photo isn't valid.", 400);

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .insert({ id: auth.user.id, ...toColumns(v) }) // id is the verified session user, not client input
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      const taken = error.message.includes("public_slug");
      return jsonError(taken ? "That URL is already taken — try another." : "You've already completed onboarding.", 409, {
        field: taken ? "publicSlug" : undefined,
      });
    }
    return jsonError("We couldn't create your profile. Please try again.", 500);
  }

  await auth.supabase.from("widgets").insert({ creator_id: auth.user.id, name: "My Wall of Love" });

  let chips: { source?: string; warning?: string } = {};
  if (adminConfigured()) {
    const out = await generateAndSaveChips(auth.supabase, auth.user.id, profile.plan, { profession: v.professionNiche, niche: v.professionNiche }, true);
    if (out.ok) chips = { source: out.source, warning: out.warning };
  }
  return NextResponse.json({ profile, ...chips }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid details.", 400, { field: parsed.error.issues[0]?.path[0] });
  const { vibeChips, ...v } = parsed.data;
  if (!avatarAllowed(v.avatarUrl, auth.user.id)) return jsonError("That profile photo isn't valid.", 400);

  const { data: before } = await auth.supabase.from("profiles").select("profession_niche, plan").eq("id", auth.user.id).maybeSingle();
  if (!before) return jsonError("Profile not found.", 404);

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .update({ ...toColumns(v), ...(vibeChips ? { custom_vibe_chips: vibeChips } : {}) })
    .eq("id", auth.user.id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("That URL is already taken — try another.", 409, { field: "publicSlug" });
    return jsonError("We couldn't save your changes.", 500);
  }

  // Profession changed (and chips weren't hand-edited): refresh the chips. Best effort — keep old ones on failure.
  let chipsRefreshed: boolean | undefined;
  let warning: string | undefined;
  if (!vibeChips && before.profession_niche !== v.professionNiche && adminConfigured()) {
    const out = await generateAndSaveChips(auth.supabase, auth.user.id, before.plan, { profession: v.professionNiche, niche: v.professionNiche }, false);
    chipsRefreshed = out.ok;
    if (!out.ok) warning = `Saved, but Vibe Chips weren't refreshed: ${out.message}`;
    else profile.custom_vibe_chips = out.chips;
  }
  return NextResponse.json({ profile: profile as Profile, chipsRefreshed, warning });
}
