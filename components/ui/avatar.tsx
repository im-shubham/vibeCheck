"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";

/** Image avatar with an initials fallback (no remote lookups, no scraping). */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const box = cn("grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-gradient text-sm font-semibold text-white", className);
  if (!src || failed) {
    return (
      <span className={box} aria-hidden>
        {initials(name)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={cn(box, "object-cover")} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
