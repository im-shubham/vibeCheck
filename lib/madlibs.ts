export interface MadLibPrompt {
  id: "need" | "appreciated" | "changed";
  question: string;
  options: string[];
}

export const MADLIB_PROMPTS: MadLibPrompt[] = [
  {
    id: "need",
    question: "What did you need help with?",
    options: [
      "a new website",
      "a brand refresh",
      "marketing support",
      "learning something new",
      "a project I couldn't finish alone",
      "expert advice",
    ],
  },
  {
    id: "appreciated",
    question: "What did you appreciate most?",
    options: [
      "the clear communication",
      "how quickly things moved",
      "the care and attention to detail",
      "the creative ideas",
      "how patient and supportive it was",
      "how easy it was to work together",
    ],
  },
  {
    id: "changed",
    question: "What changed after working together?",
    options: [
      "things feel clearer and more manageable",
      "I feel more confident about what comes next",
      "the project came together well",
      "I have something I'm proud to share",
    ],
  },
];

export type MadLibAnswers = { need: string; appreciated: string; changed: string };

const clean = (s: string) => s.trim().replace(/[.!?\s]+$/, "");

/** Deterministic, fact-preserving paragraph. Works with no AI at all. */
export function buildMadLibParagraph(a: MadLibAnswers, creatorName: string): string {
  const name = creatorName.trim() || "them";
  return (
    `I came to ${name} looking for help with ${clean(a.need)}. ` +
    `What I appreciated most was ${clean(a.appreciated)}. ` +
    `After working together, ${clean(a.changed)}.`
  );
}
