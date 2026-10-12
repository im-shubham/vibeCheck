"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PowerResult } from "@/lib/power-meter";

const LABEL_COLOR: Record<PowerResult["level"], string> = {
  "getting-started": "text-muted",
  "taking-shape": "text-warn",
  "good-detail": "text-brand",
  "epic-impact": "text-good",
};
const CONFETTI = ["#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#60a5fa"];

export function PowerMeter({ result }: { result: PowerResult }) {
  const reduce = useReducedMotion();
  const epic = result.level === "epic-impact";

  return (
    <div className="relative">
      <div className="mb-2 flex items-end justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Testimonial Power</p>
        <p aria-live="polite" className={cn("text-sm font-bold", LABEL_COLOR[result.level])}>
          {result.label}
          {epic && " 🌟"}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Testimonial power — a writing guide"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={result.score}
        aria-valuetext={`${result.label}, ${result.score} out of 100`}
        className="relative h-3 overflow-hidden rounded-full border border-line bg-surface-2"
      >
        <motion.div
          className="h-full overflow-hidden rounded-full"
          initial={false}
          animate={{ width: `${result.score}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
        >
          <div
            className="h-full"
            style={{
              width: `${(100 / Math.max(result.score, 1)) * 100}%`,
              backgroundImage: "linear-gradient(90deg,#f472b6,#a78bfa 45%,#34d399)",
            }}
          />
        </motion.div>
      </div>

      {epic && !reduce && (
        <div className="pointer-events-none absolute inset-x-0 -top-1 h-0" aria-hidden>
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              className="absolute block h-2 w-1 rounded-sm"
              style={{
                left: `${6 + i * 5.8}%`,
                top: 0,
                background: CONFETTI[i % CONFETTI.length],
                animation: `vc-confetti ${0.9 + (i % 4) * 0.2}s ease-out ${(i % 5) * 0.06}s 1 forwards`,
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-muted">{result.message}</p>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted/90">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          This is a writing guide, not an authenticity check. You don&apos;t need numbers — only share what&apos;s true for you.
        </span>
      </p>
    </div>
  );
}
