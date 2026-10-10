/**
 * Number-series questions.
 *
 * The rule here is doubling: 3, 6, 12, 24, and each term is the term before it
 * multiplied by two, so the term after 24 is 48. The three wrong choices are the
 * three ways this rule actually gets misfired — repeating the last number,
 * carrying on adding the first step (24 + 6), and adding the step before last
 * (24 + 12).
 */
import type { NumberSeriesQuestion } from "./types";

export const numberSeriesQuestions: readonly NumberSeriesQuestion[] = [
  {
    id: "number-series-doubling",
    type: "number-series",
    reasoningCategory: "quantitative",
    difficulty: "introductory",
    prompt:
      "Each number here is built from the number before it. Which number comes next in the line?",
    visual: {
      answerSlotId: "term-5",
      terms: [
        { termId: "term-1", value: 3 },
        { termId: "term-2", value: 6 },
        { termId: "term-3", value: 12 },
        { termId: "term-4", value: 24 },
        { termId: "term-5", value: null },
      ],
    },
    choices: [
      { id: "a", value: 24 },
      { id: "b", value: 30 },
      { id: "c", value: 48 },
      { id: "d", value: 36 },
    ],
    correctChoiceId: "c",
    explanation: [
      {
        id: "series-first-step",
        title: "Look at the first step",
        operation: "focus",
        narration:
          "Start at the beginning. The line goes 3, then 6. What do you do to 3 to get 6? You add 3 to itself — you double it.",
        highlightIds: ["term-1", "term-2"],
        visualState: { kind: "focus", termIds: ["term-1", "term-2"] },
      },
      {
        id: "series-rule-holds",
        title: "Check the rule holds",
        operation: "transform",
        narration:
          "Check that the same thing happens again. Double 6 and you get 12. Double 12 and you get 24. The rule is to double every time.",
        highlightIds: ["term-2", "term-3", "term-4"],
        visualState: { kind: "operation", operation: "double", operand: 2 },
      },
      {
        id: "series-next-step",
        title: "Do it one more time",
        operation: "focus",
        narration:
          "So the number after 24 is 24 doubled. Half of 24 is 12, and 12 added to 24 makes 48.",
        highlightIds: ["term-4", "term-5"],
        visualState: { kind: "operation", operation: "double", operand: 2 },
      },
      {
        id: "series-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "c",
        narration: "So the answer is C, 48.",
        highlightIds: ["term-5"],
        visualState: { kind: "none" },
      },
      {
        id: "series-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "The rule is: every number in the line is double the number before it. Doubling means adding the number to itself.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
];