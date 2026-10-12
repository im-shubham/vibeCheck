import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateVibeChips } from "./generate-vibe-chips";
import { metered } from "./metered";
import { FALLBACK_CHIPS } from "@/lib/vibe-defaults";
import type { VibeChip } from "@/lib/types";

export type ChipsOutcome =
  | { ok: true; chips: VibeChip[]; source: "ai" | "fallback"; warning?: string }
  | { ok: false; status: number; message: string };

/**
 * Generate chips with AI, validate, and persist them for the signed-in creator.
 * With allowFallback, a failure saves editable default chips so onboarding never blocks.
 */
export async function generateAndSaveChips(
  supabase: SupabaseClient,
  creatorId: string,
  plan: string,
  input: { profession: string; niche?: string; audience?: string },
  allowFallback: boolean,
): Promise<ChipsOutcome> {
  const result = await metered(creatorId, plan, "vibe_chips", () => generateVibeChips(input));

  if (result.ok) {
    const { error } = await supabase.from("profiles").update({ custom_vibe_chips: result.value }).eq("id", creatorId);
    if (!error) return { ok: true, chips: result.value, source: "ai" };
    return { ok: false, status: 500, message: "We couldn't save your Vibe Chips." };
  }

  if (!allowFallback) {
    const body = (await result.response.json()) as { error?: string };
    return { ok: false, status: result.response.status, message: body.error ?? "AI generation failed." };
  }
  const { error } = await supabase.from("profiles").update({ custom_vibe_chips: FALLBACK_CHIPS }).eq("id", creatorId);
  if (error) return { ok: false, status: 500, message: "We couldn't save your Vibe Chips." };
  return {
    ok: true,
    chips: FALLBACK_CHIPS,
    source: "fallback",
    warning: "AI suggestions weren't available, so we added starter chips. You can edit them in Settings.",
  };
}
