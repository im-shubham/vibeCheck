"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";

export function CopyButton({ text, label = "Copy", variant = "secondary" }: { text: string; label?: string; variant?: "primary" | "secondary" | "ghost" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually.");
    }
  }
  return (
    <Button variant={variant} size="sm" onClick={copy} aria-label={label}>
      {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
