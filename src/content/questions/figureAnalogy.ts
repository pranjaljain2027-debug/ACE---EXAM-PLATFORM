/**
 * Figure-analogy questions.
 *
 * "A is to B as C is to ?" — the worked pair states the transformation and the
 * child applies it to the third picture.
 *
 * The first pair is: outlined triangle pointing up -> solid triangle pointing
 * down. That is one half turn clockwise plus a solid filling. Applying the same
 * two changes to "outlined arrow pointing right" gives a solid arrow pointing
 * left, which is the keyed answer. Each wrong choice carries out only one of the
 * two changes, or fills the wrong way, so a child can see which half of the
 * rule they missed.
 */
import type { FigureAnalogyQuestion } from "./types";

export const figureAnalogyQuestions: readonly FigureAnalogyQuestion[] = [
  {
    id: "figure-analogy-half-turn-and-fill",
    type: "figure-analogy",
    reasoningCategory: "nonverbal",
    difficulty: "developing",
    prompt:
      "The first picture changes into the second picture. The third picture has to change in exactly the same way. Which one?",
    visual: {
      first: {
        figureId: "figure-a",
        glyph: {
          glyphId: "figure-a-glyph",
          shape: "triangle",
          fill: "outline",
          quarterTurns: 0,
          altText: "an outlined triangle pointing up",
        },
      },
      second: {
        figureId: "figure-b",
        glyph: {
          glyphId: "figure-b-glyph",
          shape: "triangle",
          fill: "solid",
          quarterTurns: 2,
          altText: "a solid triangle pointing down",
        },
      },
      third: {
        figureId: "figure-c",
        glyph: {
          glyphId: "figure-c-glyph",
          shape: "arrow",
          fill: "outline",
          quarterTurns: 1,
          altText: "an outlined arrow pointing right",
        },
      },
    },
    choices: [
      {
        id: "a",
        glyph: {
          glyphId: "choice-a-glyph",
          shape: "arrow",
          fill: "outline",
          quarterTurns: 3,
          altText: "an outlined arrow pointing left",
        },
      },
      {
        id: "b",
        glyph: {
          glyphId: "choice-b-glyph",
          shape: "arrow",
          fill: "solid",
          quarterTurns: 3,
          altText: "a solid arrow pointing left",
        },
      },
      {
        id: "c",
        glyph: {
          glyphId: "choice-c-glyph",
          shape: "arrow",
          fill: "solid",
          quarterTurns: 1,
          altText: "a solid arrow pointing right",
        },
      },
      {
        id: "d",
        glyph: {
          glyphId: "choice-d-glyph",
          shape: "arrow",
          fill: "striped",
          quarterTurns: 3,
          altText: "a striped arrow pointing left",
        },
      },
    ],
    correctChoiceId: "b",
    explanation: [
      {
        id: "analogy-read-the-pair",
        title: "Compare the first pair",
        operation: "focus",
        narration:
          "Look at the two pictures on the left. The second one is the first one changed in two ways, and both changes happen every time.",
        highlightIds: ["figure-a", "figure-b"],
        visualState: { kind: "focus", figureIds: ["figure-a", "figure-b"] },
      },
      {
        id: "analogy-first-change",
        title: "First: it makes a half turn",
        operation: "transform",
        narration:
          "The first change is a turn. The triangle points up, and after a half turn — halfway all the way round — it points down.",
        highlightIds: ["figure-a", "figure-b"],
        visualState: {
          kind: "transform",
          figureId: "figure-a",
          transform: { kind: "rotate", quarterTurns: 2 },
        },
      },
      {
        id: "analogy-second-change",
        title: "Second: it becomes solid",
        operation: "transform",
        narration:
          "The second change is the filling. The picture starts as an outline and ends up filled in solid.",
        highlightIds: ["figure-a", "figure-b"],
        visualState: {
          kind: "transform",
          figureId: "figure-a",
          transform: { kind: "fill", fill: "solid" },
        },
      },
      {
        id: "analogy-apply",
        title: "Do both to the arrow",
        operation: "focus",
        narration:
          "Now do exactly those two things to the arrow. A half turn takes it from pointing right to pointing left, and then it becomes solid.",
        highlightIds: ["figure-c"],
        visualState: { kind: "focus", figureIds: ["figure-c"] },
      },
      {
        id: "analogy-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "b",
        narration: "So the answer is B: a solid arrow pointing left.",
        highlightIds: ["figure-c"],
        visualState: { kind: "none" },
      },
      {
        id: "analogy-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "The rule is: turn the picture a half turn, then fill it in solid. Do both, every time.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
];