import { AIError } from "./types";

/** Numbers/amounts in text, normalised — used to detect invented figures. */
const numberTokens = (s: string) => new Set((s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]+$/, "")));

/**
 * Guard against fabricated facts: the rewrite may not contain figures absent from the source,
 * and may not balloon in length.
 */
export function assertFaithful(source: string, output: string, maxChars = 3000): void {
  const allowed = numberTokens(source);
  for (const n of numberTokens(output)) {
    if (!allowed.has(n)) {
      throw new AIError("unsafe_output", 502, "We couldn't produce a safe rewrite this time. Your original text is untouched.");
    }
  }
  if (output.length > maxChars || output.length > source.length * 2.5 + 200) {
    throw new AIError("unsafe_output", 502, "We couldn't produce a safe rewrite this time. Your original text is untouched.");
  }
}
