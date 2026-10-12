"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VibeChip } from "@/lib/types";

const ACCENTS = [
  "border-pink-400/40 bg-pink-500/10 text-pink-300 [html[data-theme=light]_&]:text-pink-700",
  "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 [html[data-theme=light]_&]:text-emerald-700",
  "border-amber-400/40 bg-amber-500/10 text-amber-300 [html[data-theme=light]_&]:text-amber-700",
  "border-sky-400/40 bg-sky-500/10 text-sky-300 [html[data-theme=light]_&]:text-sky-700",
  "border-violet-400/40 bg-violet-500/10 text-violet-300 [html[data-theme=light]_&]:text-violet-700",
];

export function VibeChips({ chips, selected, onToggle }: { chips: VibeChip[]; selected: Set<string>; onToggle: (chip: VibeChip) => void }) {
  if (chips.length === 0) return null;
  return (
    <div>
      <p id="chips-label" className="text-xs font-medium uppercase tracking-wide text-muted">
        Need inspiration? Tap a topic (optional)
      </p>
      <div role="group" aria-labelledby="chips-label" className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip, i) => {
          const on = selected.has(chip.label);
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(chip)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:brightness-125",
                ACCENTS[i % ACCENTS.length],
                on && "ring-2 ring-current ring-offset-2 ring-offset-surface",
              )}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
