import { CheckCircle2, Clock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestimonialStatus } from "@/lib/types";

export function Badge({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}
      {...p}
    />
  );
}

const STATUS = {
  pending: { label: "Pending", cls: "border-warn/40 bg-warn/15 text-warn", Icon: Clock },
  approved: { label: "Approved", cls: "border-good/40 bg-good/15 text-good", Icon: CheckCircle2 },
  hidden: { label: "Hidden", cls: "border-line bg-surface-2 text-muted", Icon: EyeOff },
} as const;

/** Status is conveyed by icon + text as well as color. */
export function StatusBadge({ status }: { status: TestimonialStatus }) {
  const { label, cls, Icon } = STATUS[status];
  return (
    <Badge className={cls}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Badge>
  );
}
