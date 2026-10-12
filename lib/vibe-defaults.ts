import type { VibeChip } from "./types";

/** Editable fallback chips used when AI generation is unavailable. */
export const FALLBACK_CHIPS: VibeChip[] = [
  { label: "Great Communication", prompt: "One thing I especially appreciated about the communication was..." },
  { label: "Quality Work", prompt: "The quality of the work stood out because..." },
  { label: "Reliable", prompt: "I could count on this work being..." },
  { label: "Easy to Work With", prompt: "Working together felt..." },
  { label: "Would Recommend", prompt: "I'd tell someone considering this service that..." },
];
