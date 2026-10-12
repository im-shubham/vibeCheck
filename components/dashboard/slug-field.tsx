"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { slugSchema } from "@/lib/validation";

/** Public-URL slug input with debounced server-side availability check. */
export function SlugField({ value, onChange, origin }: { value: string; onChange: (v: string) => void; origin: string }) {
  const [state, setState] = useState<{ status: "idle" | "checking" | "ok" | "bad"; message?: string }>({ status: "idle" });

  useEffect(() => {
    if (!value) return;
    const local = slugSchema.safeParse(value);
    if (!local.success) {
      const t = setTimeout(() => setState({ status: "bad", message: local.error.issues[0]?.message }), 0);
      return () => clearTimeout(t);
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setState({ status: "checking" });
      try {
        const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(local.data)}`, { signal: ctrl.signal });
        const body = (await res.json()) as { available?: boolean; reason?: string };
        setState(body.available ? { status: "ok" } : { status: "bad", message: body.reason ?? "Unavailable." });
      } catch {
        if (!ctrl.signal.aborted) setState({ status: "idle" });
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  return (
    <Field
      label="Your public page URL"
      htmlFor="slug"
      error={state.status === "bad" ? state.message : null}
      hint={`${origin.replace(/^https?:\/\//, "")}/submit/${value || "your-name"}`}
    >
      <div className="relative">
        <Input
          id="slug"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          aria-invalid={state.status === "bad"}
          aria-describedby="slug-error"
          maxLength={40}
          placeholder="designer-dan"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden>
          {state.status === "checking" && <Loader2 className="size-4 animate-spin text-muted" />}
          {state.status === "ok" && <CheckCircle2 className="size-4 text-good" />}
          {state.status === "bad" && <XCircle className="size-4 text-bad" />}
        </span>
      </div>
    </Field>
  );
}
