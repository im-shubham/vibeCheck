"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Optional reviewer photo. Skippable; falls back to initials. Uploads to our validated endpoint. */
export function ReviewerPhoto({ name, url, onChange }: { name: string; url: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setError("Please choose an image under 2 MB.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/public/upload-image", { method: "POST", body: form });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Upload failed.");
      onChange(body.url);
    } catch (e) {
      setError(e instanceof Error ? `${e.message} You can skip the photo.` : "Upload failed. You can skip the photo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Your photo (optional)</p>
      <div className="flex items-center gap-3">
        <Avatar name={name || "You"} src={url} className="size-12" />
        <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" aria-label="Upload your photo" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {url ? "Change" : "Upload"}
        </Button>
        {url && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} aria-label="Remove photo">
            <X className="size-4" />
          </Button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-bad">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">No photo? We&apos;ll show your initials.</p>
      )}
    </div>
  );
}
