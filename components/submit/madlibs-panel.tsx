"use client";

import { useState } from "react";
import { ChevronDown, Dices, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { MADLIB_PROMPTS, buildMadLibParagraph, type MadLibAnswers } from "@/lib/madlibs";
import { api, errMessage } from "@/lib/client-api";

const OTHER = "__other__";

export function MadLibsPanel({ slug, creatorName, onUse }: { slug: string; creatorName: string; onUse: (paragraph: string) => void }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [paragraph, setParagraph] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const answers = (): MadLibAnswers | null => {
    const get = (id: string) => (choice[id] === OTHER ? (custom[id] ?? "").trim() : (choice[id] ?? ""));
    const a = { need: get("need"), appreciated: get("appreciated"), changed: get("changed") };
    return a.need && a.appreciated && a.changed ? a : null;
  };
  const ready = answers() !== null;

  function build() {
    const a = answers();
    if (a) setParagraph(buildMadLibParagraph(a, creatorName)); // deterministic: works with no AI
  }

  async function smooth() {
    const a = answers();
    if (!a) return;
    setAiLoading(true);
    try {
      const res = await api<{ paragraph: string }>("/api/ai/mad-libs", { method: "POST", json: { slug, answers: a } });
      setParagraph(res.paragraph);
    } catch (e) {
      toast.error(`${errMessage(e)} Your fill-in-the-blanks version is still here.`);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface-2/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="madlibs-body"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          <Dices className="size-4 text-brand" aria-hidden />
          <span>
            <strong className="font-medium">Writer&apos;s block?</strong> <span className="text-muted">Fill in the blanks instead.</span>
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div id="madlibs-body" className="space-y-4 border-t border-line px-4 py-4">
          {MADLIB_PROMPTS.map((p, i) => (
            <div key={p.id}>
              <Label htmlFor={`ml-${p.id}`}>
                {i + 1}. {p.question}
              </Label>
              <Select id={`ml-${p.id}`} value={choice[p.id] ?? ""} onChange={(e) => setChoice((c) => ({ ...c, [p.id]: e.target.value }))}>
                <option value="">Choose one…</option>
                {p.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                <option value={OTHER}>Something else…</option>
              </Select>
              {choice[p.id] === OTHER && (
                <Input
                  className="mt-2"
                  aria-label={`${p.question} — your own words`}
                  placeholder="In your own words"
                  maxLength={120}
                  value={custom[p.id] ?? ""}
                  onChange={(e) => setCustom((c) => ({ ...c, [p.id]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <Button variant="secondary" onClick={build} disabled={!ready}>
            Build my paragraph
          </Button>

          {paragraph && (
            <div>
              <Label htmlFor="ml-paragraph">Edit it until it sounds like you</Label>
              <Textarea id="ml-paragraph" rows={4} value={paragraph} maxLength={1000} onChange={(e) => setParagraph(e.target.value)} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    onUse(paragraph.trim());
                    toast.success("Added to your review — feel free to keep editing.");
                  }}
                  disabled={paragraph.trim().length < 10}
                >
                  Use this paragraph
                </Button>
                <Button variant="ghost" onClick={smooth} loading={aiLoading}>
                  <Sparkles className="size-4" /> Smooth it with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
