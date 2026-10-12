import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient shadow-lg shadow-brand/30" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6l5 12 2-5 7-7" />
        </svg>
      </span>
      <span className="text-lg">
        Vibe<span className="font-normal text-muted">Check</span>
      </span>
    </Link>
  );
}
