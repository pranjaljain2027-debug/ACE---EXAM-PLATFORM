/**
 * The landing demo's figure matrix (U5).
 *
 * This is deliberately NOT the seeded corpus question in
 * `src/content/questions/figureMatrix.ts`. That one is "developing" difficulty
 * and is pinned by three simultaneous rules at once — shape constant down a
 * column, fill constant across a row, and facing derived from row+column — so
 * a child has to hold three threads in their head. This one is the gentle
 * on-ramp a first-time visitor should solve in a few seconds: every picture on
 * the board is the same outlined arrow, so the only thing the eye has to track
 * is which way it points, and there is exactly one rule to discover.
 *
 *   quarterTurns = (rowIndex + columnIndex) mod 4, zero-based, so every step
 *   right and every step down adds exactly one quarter turn clockwise
 *
 *                  up(0)  right(1)  down(2)
 *   row 1         A0      A1        A2
 *   row 2         A1      A2        A3
 *   row 3         A2      A3        ? = A0, up
 *
 * The missing cell is pinned twice over, so a child can check either way:
 *
 *   Along the missing cell's row (row 3):  down(2) → left(3) → up(0).
 *   Down the missing cell's column (col 3): down(2) → left(3) → up(0).
 *
 * Both routes land on "an outlined arrow pointing up", which is choice A, the
 * keyed answer. The anti-diagonal agrees too — r1c1 up(0), r2c2 down(2), r3c3
 * up(4 mod 4) — so no reading of the board produces a second candidate.
 *
 * Every wrong choice breaks exactly one thing, so a wrong answer reveals which
 * rule was missed:
 *
 *   b — outlined arrow pointing left: copies the picture beside the empty
 *       space instead of turning it a further quarter turn.
 *   c — outlined arrow pointing down: turns the wrong way round (it is also
 *       the picture above, so "forgot to turn going down" is the same miss).
 *   d — solid arrow pointing up: right shape, right direction, but the filling
 *       changes — nothing on this board is ever filled in.
 */
import type { FigureMatrixQuestion } from "@/content/questions/types";

export const demoMatrixQuestion: FigureMatrixQuestion = {
  id: "demo-matrix-quarter-turn",
  type: "figure-matrix",
  reasoningCategory: "nonverbal",
  difficulty: "introductory",
  prompt: "One square in this board of arrows is empty. Which arrow belongs in the empty space?",
  visual: {
    missingCellId: "cell-r3c3",
    rows: [
      [
        {
          cellId: "cell-r1c1",
          glyph: {
            glyphId: "glyph-r1c1",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 0,
            altText: "an outlined arrow pointing up",
          },
        },
        {
          cellId: "cell-r1c2",
          glyph: {
            glyphId: "glyph-r1c2",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 1,
            altText: "an outlined arrow pointing right",
          },
        },
        {
          cellId: "cell-r1c3",
          glyph: {
            glyphId: "glyph-r1c3",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 2,
            altText: "an outlined arrow pointing down",
          },
        },
      ],
      [
        {
          cellId: "cell-r2c1",
          glyph: {
            glyphId: "glyph-r2c1",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 1,
            altText: "an outlined arrow pointing right",
          },
        },
        {
          cellId: "cell-r2c2",
          glyph: {
            glyphId: "glyph-r2c2",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 2,
            altText: "an outlined arrow pointing down",
          },
        },
        {
          cellId: "cell-r2c3",
          glyph: {
            glyphId: "glyph-r2c3",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 3,
            altText: "an outlined arrow pointing left",
          },
        },
      ],
      [
        {
          cellId: "cell-r3c1",
          glyph: {
            glyphId: "glyph-r3c1",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 2,
            altText: "an outlined arrow pointing down",
          },
        },
        {
          cellId: "cell-r3c2",
          glyph: {
            glyphId: "glyph-r3c2",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 3,
            altText: "an outlined arrow pointing left",
          },
        },
        {
          cellId: "cell-r3c3",
          glyph: null,
        },
      ],
    ],
  },
  choices: [
    {
      id: "a",
      glyph: {
        glyphId: "demo-choice-a",
        shape: "arrow",
        fill: "outline",
        quarterTurns: 0,
        altText: "an outlined arrow pointing up",
      },
    },
    {
      id: "b",
      glyph: {
        glyphId: "demo-choice-b",
        shape: "arrow",
        fill: "outline",
        quarterTurns: 3,
        altText: "an outlined arrow pointing left",
      },
    },
    {
      id: "c",
      glyph: {
        glyphId: "demo-choice-c",
        shape: "arrow",
        fill: "outline",
        quarterTurns: 2,
        altText: "an outlined arrow pointing down",
      },
    },
    {
      id: "d",
      glyph: {
        glyphId: "demo-choice-d",
        shape: "arrow",
        fill: "solid",
        quarterTurns: 0,
        altText: "a solid arrow pointing up",
      },
    },
  ],
  correctChoiceId: "a",
  explanation: [
    {
      id: "demo-along-the-row",
      title: "Look along the bottom row",
      operation: "focus",
      narration:
        "Look along the bottom row. Every arrow there is the same outlined arrow, and each one turns a quarter turn clockwise as you move right: first pointing down, then pointing left. One more quarter turn brings it round to pointing up.",
      highlightIds: ["cell-r3c1", "cell-r3c2", "cell-r3c3"],
      visualState: { kind: "focus", cellIds: ["cell-r3c1", "cell-r3c2", "cell-r3c3"] },
    },
    {
      id: "demo-down-the-column",
      title: "Check it the other way",
      operation: "focus",
      narration:
        "Check it the other way, straight down the column on the right: down, then left, then one more quarter turn, which is up again. The row and the column agree, so the empty space holds an outlined arrow pointing up.",
      highlightIds: ["cell-r1c3", "cell-r2c3", "cell-r3c3"],
      visualState: { kind: "focus", cellIds: ["cell-r1c3", "cell-r2c3", "cell-r3c3"] },
    },
    {
      id: "demo-what-stays-the-same",
      title: "What never changes",
      operation: "focus",
      narration:
        "Two things stay the same on this whole board: the shape is always an arrow, and the filling is always an outline. Only the direction moves.",
      highlightIds: [
        "cell-r1c1",
        "cell-r1c2",
        "cell-r1c3",
        "cell-r2c1",
        "cell-r2c2",
        "cell-r2c3",
        "cell-r3c1",
        "cell-r3c2",
      ],
      visualState: {
        kind: "focus",
        cellIds: [
          "cell-r1c1",
          "cell-r1c2",
          "cell-r1c3",
          "cell-r2c1",
          "cell-r2c2",
          "cell-r2c3",
          "cell-r3c1",
          "cell-r3c2",
        ],
      },
    },
    {
      id: "demo-the-turn-on-its-own",
      title: "The turn on its own",
      operation: "transform",
      narration:
        "Here is the turn by itself. The arrow just to the left of the empty space points left. Turn it one quarter turn clockwise and it points up, which is the shape the empty space needs.",
      highlightIds: ["cell-r3c2", "cell-r3c3"],
      visualState: {
        kind: "transform",
        cellId: "cell-r3c2",
        transform: { kind: "rotate", quarterTurns: 1 },
      },
    },
    {
      id: "demo-reveal",
      title: "The answer",
      operation: "reveal",
      revealsChoiceId: "a",
      narration: "So the answer is A: an outlined arrow pointing up.",
      highlightIds: ["cell-r3c3"],
      visualState: { kind: "none" },
    },
    {
      id: "demo-the-rule",
      title: "The rule",
      operation: "state-rule",
      narration:
        "Here is the whole rule: on this board the figure always stays the same outlined arrow, and every time you move one square right or one square down, it turns a quarter turn clockwise.",
      highlightIds: [],
      visualState: { kind: "none" },
    },
  ],
};