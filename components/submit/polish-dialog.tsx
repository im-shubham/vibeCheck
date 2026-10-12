"use client";

import { useState } from "react";
import { Briefcase, Flame, BookOpen, Sparkles, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, errMessage } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Tone = "professional" | "hype" | "storyteller";
const TONES: { id: Tone; label: string; hint: string; Icon: typeof Briefcase }[] = [
  { id: "professional", label: "Professional", hint: "Clear and polished", Icon: Briefcase },
  { id: "hype", label: "Hype Man", hint: "Upbeat and energetic", Icon: Flame },
  { id: "storyteller", label: "Storyteller", hint: "Warm, narrative flow", Icon: BookOpen },
];
const REELS = [
  ["✨", "💬", "🎯", "🌟"],
  ["Clear", "Warm", "Sharp", "Real"],
  ["📝", "💡", "🚀", "🤝"],
];

function SlotMachine() {
  return (
    <div className="flex justify-center gap-3 py-6" role="status" aria-label="Polishing your testimonial">
      {REELS.map((items, i) => (
        <div key={i} className="h-12 w-20 overflow-hidden rounded-xl border border-line bg-surface-2 text-center text-lg font-semibold">
          <div style={{ animation: `vc-reel ${0.5 + i * 0.18}s linear infinite` }}>
            {[...items, ...items].map((it, j) => (
              <div key={j} className="grid h-12 place-items-center">
                {it}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PolishDialog({
  open,
  onClose,
  slug,
  text,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  text: string;
  onAccept: (rewritten: string) => void;
}) {
  const [tone, setTone] = useState<Tone>("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // the draft we polished — shown as "original" even if the textarea changes underneath
  const [source, setSource] = useState(text);

  async function run() {
    setLoading(true);
    setError(null);
    setSource(text);
    try {
      const res = await api<{ rewritten: string }>("/api/ai/polish", { method: "POST", json: { slug, text, tone } });
      setResult(res.rewritten);
    } catch (e) {
      setError(errMessage(e)); // the original text is never touched on failure
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title="Magic Polish" description="Pick a style. Your original stays safe until you choose." className="max-w-2xl">
      {result === null ? (
        <>
          <fieldset disabled={loading}>
            <legend className="mb-2 text-sm font-medium">Select your style</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TONES.map(({ id, label, hint, Icon }) => (
                <label
                  key={id}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand",
                    tone === id ? "border-brand bg-brand/10" : "border-line hover:border-brand/50",
                  )}
                >
                  <input type="radio" name="tone" value={id} checked={tone === id} onChange={() => setTone(id)} className="sr-only" />
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4" aria-hidden /> {label}
                  </span>
                  <span className="text-xs text-muted">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {loading && <SlotMachine />}
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
              {error} Your original text is unchanged.
            </p>
          )}
          <p className="mt-4 text-xs text-muted">
            AI only rewrites what you wrote — it won&apos;t add numbers, results or claims you didn&apos;t make.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={run} loading={loading}>
              <Sparkles className="size-4" /> Polish it
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Your original</p>
              <p className="max-h-60 overflow-y-auto whitespace-pre-line text-sm">{source}</p>
            </div>
            <div className="rounded-xl border border-brand/60 bg-brand/5 p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand">Polished</p>
              <p className="max-h-60 overflow-y-auto whitespace-pre-line text-sm">{result}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setResult(null)}>
              <RotateCcw className="size-4" /> Try another style
            </Button>
            <Button variant="secondary" onClick={close}>
              Keep my original
            </Button>
            <Button
              onClick={() => {
                onAccept(result);
                close();
              }}
            >
              Use polished version
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
