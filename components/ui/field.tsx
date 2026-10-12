import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-line bg-surface-2/60 px-3.5 text-sm text-fg placeholder:text-muted/70 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60 aria-[invalid=true]:border-bad";

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-fg", className)} {...p} />;
}

export function Input({ className, ...p }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...p} />;
}

export function Textarea({ className, ...p }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-3 leading-relaxed", className)} {...p} />;
}

export function Select({ className, ...p }: React.ComponentProps<"select">) {
  return <select className={cn(control, "h-11 pr-8", className)} {...p} />;
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-bad">
      {children}
    </p>
  );
}

export function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1.5 text-xs text-muted", className)}>{children}</p>;
}

/** Label + control + hint/error wiring in one place. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError id={`${htmlFor}-error`}>{error}</FieldError> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}
