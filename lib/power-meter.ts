/**
 * Testimonial Power Meter — a client/server-safe writing-quality heuristic.
 * It guides reviewers toward specific, useful feedback. It is NOT an
 * authenticity check, and it never requires numbers or ROI claims.
 */
export type PowerLevel = "getting-started" | "taking-shape" | "good-detail" | "epic-impact";

export interface PowerResult {
  score: number; // 0..100
  level: PowerLevel;
  label: string;
  message: string;
  metricsDetected: boolean;
  signals: { enoughText: boolean; hasDetail: boolean; hasOutcome: boolean; hasEvidence: boolean };
}

const OUTCOME_WORDS =
  /\b(helped|saved|improved|increased|reduced|grew|launched|finished|delivered|solved|fixed|clearer|easier|faster|confident|results?|outcome|turned out|exceeded|resulted|changed|thanks to|because of)\b/i;
const DETAIL_WORDS =
  /\b(because|especially|specifically|for example|for instance|stood out|before|after|when|while|instead|process|communication|quality|deadline|project|team|support|explained|listened)\b/i;
const EVIDENCE =
  /(\d[\d,.]*\s?%|[$€£]\s?\d|\b\d+(\.\d+)?\s?(x|times|days?|weeks?|months?|hours?|minutes?|years?|clients?|customers?|users?|visitors?|sales|leads)\b)/i;

const LEVELS: Record<PowerLevel, { label: string; message: string }> = {
  "getting-started": { label: "Getting Started", message: "A sentence or two about your experience is a great start." },
  "taking-shape": { label: "Taking Shape", message: "Nice — what stood out to you most? A specific moment helps." },
  "good-detail": { label: "Good Detail", message: "Helpful and specific. Mention what changed for you if you'd like." },
  "epic-impact": { label: "Epic Impact", message: "A rich, detailed story. Thank you for sharing it!" },
};

export function evaluatePower(raw: string): PowerResult {
  const text = raw.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 3).length;

  const enoughText = words >= 15;
  const hasDetail = words >= 30 && (sentences >= 2 || DETAIL_WORDS.test(text));
  const hasOutcome = OUTCOME_WORDS.test(text);
  const hasEvidence = EVIDENCE.test(text);

  // Length carries most weight; measurable evidence is a small, optional bonus.
  let score = (Math.min(words, 60) / 60) * 45;
  if (enoughText) score += 10;
  if (hasDetail) score += 15;
  if (hasOutcome) score += 20;
  if (hasEvidence) score += 10;
  if (words < 4) score = Math.min(score, 8);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: PowerLevel =
    score >= 80 ? "epic-impact" : score >= 55 ? "good-detail" : score >= 25 ? "taking-shape" : "getting-started";

  return {
    score,
    level,
    ...LEVELS[level],
    metricsDetected: hasEvidence,
    signals: { enoughText, hasDetail, hasOutcome, hasEvidence },
  };
}

export const POWER_LABELS: Record<PowerLevel, string> = {
  "getting-started": "Getting Started",
  "taking-shape": "Taking Shape",
  "good-detail": "Good Detail",
  "epic-impact": "Epic Impact",
};
