"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PenLine, Sparkles, Star, Video } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PowerMeter } from "./power-meter";
import { VibeChips } from "./vibe-chips";
import { PolishDialog } from "./polish-dialog";
import { MadLibsPanel } from "./madlibs-panel";
import { VideoRecorder } from "./video-recorder";
import { ReviewerPhoto } from "./reviewer-photo";
import { evaluatePower } from "@/lib/power-meter";
import { api, ApiError, errMessage } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { MAX_TESTIMONIAL_CHARS } from "@/lib/validation";
import type { VibeChip } from "@/lib/types";

export interface PublicCreatorView {
  slug: string;
  displayName: string;
  brandName: string | null;
  businessName: string | null;
  profession: string;
  avatarUrl: string | null;
  chips: VibeChip[];
}

type Mode = "text" | "video";
type Errors = Partial<Record<"reviewerName" | "text" | "consent" | "videoUrl" | "reviewerImageUrl", string>>;

export function SubmitForm({ creator, videoEnabled }: { creator: PublicCreatorView; videoEnabled: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const firstName = creator.displayName.split(" ")[0];

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [aiPolished, setAiPolished] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [polishOpen, setPolishOpen] = useState(false);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const submissionKey = useRef(crypto.randomUUID()); // stable across retries → server de-duplicates
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Text the reviewer actually wrote — unfinished chip prompts don't count toward the meter, polish or validation.
  const authored = useMemo(
    () => creator.chips.filter((c) => selected.has(c.label)).reduce((t, c) => t.replace(c.prompt, ""), text).trim(),
    [creator.chips, selected, text],
  );
  const power = useMemo(() => evaluatePower(authored), [authored]);

  function toggleChip(chip: VibeChip) {
    const next = new Set(selected);
    if (next.has(chip.label)) {
      next.delete(chip.label);
      // remove the inserted prompt only if it's still there verbatim; never touch other text
      setText((t) => t.replace(chip.prompt, "").replace(/\n{3,}/g, "\n\n").trimStart());
    } else {
      next.add(chip.label);
      setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n\n${chip.prompt} ` : `${chip.prompt} `));
      requestAnimationFrame(() => {
        const el = textRef.current;
        el?.focus();
        el?.setSelectionRange(el.value.length, el.value.length);
      });
    }
    setSelected(next);
  }

  function acceptPolish(rewritten: string) {
    setOriginalText((o) => o ?? text); // keep the very first human draft
    setAiPolished(true);
    setText(rewritten);
    toast.success("Polished version applied. You can still edit it.");
  }

  function useMadLib(paragraph: string) {
    setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n\n${paragraph}` : paragraph));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.reviewerName = "Please enter your name.";
    if (mode === "text" && authored.length < 10) e.text = "Please write at least a sentence or two (10+ characters).";
    if (mode === "video" && !videoUrl) e.videoUrl = "Please record and upload your video first, or switch to a text review.";
    if (!consent) e.consent = "Please confirm you're happy for this to be published.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(first === "reviewerName" ? "name" : first === "consent" ? "consent" : "text")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ id: string }>("/api/public/submit", {
        method: "POST",
        json: {
          slug: creator.slug,
          submissionKey: submissionKey.current,
          reviewerName: name,
          reviewerTitle: title,
          reviewerCompany: company,
          reviewerImageUrl: photo,
          text,
          originalText,
          aiPolished,
          rating,
          videoUrl: mode === "video" ? videoUrl : null,
          consent,
          website: honeypot,
        },
      });
      router.push(`/t/${res.id}`);
    } catch (err) {
      setSubmitting(false);
      const field = err instanceof ApiError ? (err.body.field as keyof Errors | undefined) : undefined;
      if (field) setErrors({ [field]: errMessage(err) });
      toast.error(errMessage(err));
    }
  }

  const tab = (m: Mode, label: string, Icon: typeof Video) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition",
        mode === m ? "border-brand bg-brand/15 text-fg shadow-[0_0_0_1px_var(--brand)]" : "border-line text-muted hover:text-fg",
      )}
    >
      <Icon className="size-4" aria-hidden /> {label}
    </button>
  );

  return (
    <div className="bg-hero-glow min-h-screen px-4 py-8 sm:py-12">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <motion.header
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-8 flex max-w-xl flex-col items-center text-center"
      >
        <Avatar name={creator.displayName} src={creator.avatarUrl} className="size-20 text-2xl ring-4 ring-brand/30" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Share your experience working with {firstName}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {creator.profession}
          {creator.brandName || creator.businessName ? ` · ${creator.brandName ?? creator.businessName}` : ""}
        </p>
      </motion.header>

      <motion.form
        onSubmit={onSubmit}
        noValidate
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mx-auto max-w-xl space-y-6 rounded-3xl border border-line bg-surface p-5 shadow-2xl shadow-black/20 sm:p-7"
      >
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Choose your story</p>
          <div role="tablist" aria-label="Review type" className="flex gap-2">
            {tab("video", "Record a Video", Video)}
            {tab("text", "Write a Text Review", PenLine)}
          </div>
        </div>

        {mode === "video" && (
          <div>
            <VideoRecorder slug={creator.slug} enabled={videoEnabled} onUploaded={setVideoUrl} onUseText={() => setMode("text")} />
            <FieldError>{errors.videoUrl}</FieldError>
          </div>
        )}

        <VibeChips chips={creator.chips} selected={selected} onToggle={toggleChip} />

        <div>
          <Label htmlFor="text">{mode === "video" ? "Add a few words (optional)" : "Your testimonial"}</Label>
          <Textarea
            id="text"
            ref={textRef}
            rows={mode === "video" ? 4 : 7}
            maxLength={MAX_TESTIMONIAL_CHARS}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={!!errors.text}
            aria-describedby="text-count text-error"
            placeholder="What did you enjoy about working with me? What stood out, and what would you tell someone considering my services?"
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <div className="min-h-5">
              <FieldError id="text-error">{errors.text}</FieldError>
            </div>
            <p id="text-count" className={cn("text-xs tabular-nums", text.length > MAX_TESTIMONIAL_CHARS - 150 ? "text-warn" : "text-muted")}>
              {text.length.toLocaleString()} / {MAX_TESTIMONIAL_CHARS.toLocaleString()}
            </p>
          </div>
        </div>

        <PowerMeter result={power} />

        <div className="space-y-2">
          <Button
            className="w-full py-6 text-base"
            onClick={() => setPolishOpen(true)}
            disabled={authored.length < 20}
            aria-describedby="polish-help"
          >
            <Sparkles className="size-5" /> Magic Polish
          </Button>
          <p id="polish-help" className="text-center text-xs text-muted">
            {authored.length < 20 ? "Write a little more (20+ characters) to unlock AI polish." : "Optional — AI rewrites your words in a tone you choose. You approve the result."}
          </p>
        </div>

        <MadLibsPanel slug={creator.slug} creatorName={firstName} onUse={useMadLib} />

        <hr className="border-line" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name *" htmlFor="name" error={errors.reviewerName}>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} aria-invalid={!!errors.reviewerName} />
          </Field>
          <Field label="Job title (optional)" htmlFor="title">
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} autoComplete="organization-title" />
          </Field>
          <Field label="Company (optional)" htmlFor="company">
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} autoComplete="organization" />
          </Field>
          <ReviewerPhoto name={name} url={photo} onChange={setPhoto} />
        </div>

        <div>
          <p id="rating-label" className="mb-1.5 text-sm font-medium">
            Overall rating (optional)
          </p>
          <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(rating === n ? null : n)}
                className="rounded-md p-1 text-line transition hover:scale-110 hover:text-amber-300 aria-checked:text-amber-400"
              >
                <Star className={cn("size-7", rating !== null && n <= rating && "fill-amber-400 text-amber-400")} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={!!errors.consent}
              className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
            />
            <span>
              I&apos;m happy for {creator.displayName} to publish this testimonial, along with my name{title || company ? ", role" : ""}
              {photo ? " and photo" : ""}, on their website and marketing.
            </span>
          </label>
          <FieldError>{errors.consent}</FieldError>
        </div>

        {/* honeypot — real people never see or fill this */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Submit review
        </Button>
        <p className="text-center text-xs text-muted">
          Your testimonial is reviewed by {firstName} before anything is published. No account needed.
        </p>
      </motion.form>

      <PolishDialog open={polishOpen} onClose={() => setPolishOpen(false)} slug={creator.slug} text={text.trim()} onAccept={acceptPolish} />
    </div>
  );
}
