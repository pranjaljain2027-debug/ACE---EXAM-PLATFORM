/**
 * Verbal-analogy questions.
 *
 * "Kitten is to cat as puppy is to ?" — the relation is naming the grown-up
 * version of the first word. Kitten -> cat fixes the relation; applying it to
 * puppy gives dog. "Fox" is the sharp distractor because it is also a canine,
 * and a child who looks up the single word "puppy" without carrying the
 * relation across will reach for it.
 */
import type { VerbalAnalogyQuestion } from "./types";

export const verbalAnalogyQuestions: readonly VerbalAnalogyQuestion[] = [
  {
    id: "verbal-analogy-young-to-grown",
    type: "verbal-analogy",
    reasoningCategory: "verbal",
    difficulty: "developing",
    prompt: "A kitten grows up to be a cat. A puppy grows up to be a what?",
    visual: {
      first: { termId: "term-1", word: "kitten" },
      second: { termId: "term-2", word: "cat" },
      third: { termId: "term-3", word: "puppy" },
    },
    choices: [
      { id: "a", text: "Kitten" },
      { id: "b", text: "Dog" },
      { id: "c", text: "Bird" },
      { id: "d", text: "Fox" },
    ],
    correctChoiceId: "b",
    explanation: [
      {
        id: "verbal-read-the-first-pair",
        title: "Read the first pair",
        operation: "focus",
        narration:
          "The first pair tells you the rule. A kitten is a young cat — it is the same animal, only younger. So the second word is the grown-up version of the first word.",
        highlightIds: ["term-1", "term-2"],
        visualState: { kind: "focus", termIds: ["term-1", "term-2"] },
      },
      {
        id: "verbal-apply-the-rule",
        title: "Use the same rule on the second pair",
        operation: "focus",
        narration:
          "Now use that rule on puppy. A puppy is a young dog, so the grown-up version of puppy is dog. Fox is a wild animal, not what a pet puppy grows into.",
        highlightIds: ["term-3"],
        visualState: { kind: "focus", termIds: ["term-3"] },
      },
      {
        id: "verbal-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "b",
        narration: "So the answer is Dog.",
        highlightIds: ["term-3"],
        visualState: { kind: "none" },
      },
      {
        id: "verbal-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "The rule is: look for what the two words share, then find that relationship in the second pair. A kitten becomes a cat, and a puppy becomes a dog.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
];