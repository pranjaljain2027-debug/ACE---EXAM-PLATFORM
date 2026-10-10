/**
 * Figure-matrix questions.
 *
 * The matrix below is solved by three rules that hold at the same time, so the
 * missing cell is pinned down twice over — once along its row, once along its
 * column — and a child can check their own answer either way:
 *
 *   shape  — constant down a column (col 1 triangle, col 2 arrow, col 3 chevron)
 *   fill   — constant across a row (row 1 outline, row 2 striped, row 3 solid)
 *   facing — quarterTurns = (rowIndex + columnIndex) mod 4 over zero-based
 *            indices, so every step right and every step down adds exactly one
 *            quarter turn clockwise
 *
 *                  up(0)  right(1)  down(2)
 *   row 1 outline   T0      A1        C2
 *   row 2 striped   T1      A2        C3
 *   row 3 solid     T2      A3        ? = C0, up
 *
 * Row 3 gives fill (solid) and facing (2 → 3 → 0). Column 3 gives shape
 * (chevron) and independently confirms the facing (2 → 3 → 0). Both routes
 * land on "a solid chevron pointing up", which is the keyed answer.
 */
import type { FigureMatrixQuestion } from "./types";

export const figureMatrixQuestions: readonly FigureMatrixQuestion[] = [
  {
    id: "figure-matrix-quarter-turns",
    type: "figure-matrix",
    reasoningCategory: "nonverbal",
    difficulty: "developing",
    prompt:
      "One square in this board of pictures is empty. Which picture belongs in the empty space?",
    visual: {
      missingCellId: "cell-r3c3",
      rows: [
        [
          {
            cellId: "cell-r1c1",
            glyph: {
              glyphId: "glyph-r1c1",
              shape: "triangle",
              fill: "outline",
              quarterTurns: 0,
              altText: "an outlined triangle pointing up",
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
              shape: "chevron",
              fill: "outline",
              quarterTurns: 2,
              altText: "an outlined chevron pointing down",
            },
          },
        ],
        [
          {
            cellId: "cell-r2c1",
            glyph: {
              glyphId: "glyph-r2c1",
              shape: "triangle",
              fill: "striped",
              quarterTurns: 1,
              altText: "a striped triangle pointing right",
            },
          },
          {
            cellId: "cell-r2c2",
            glyph: {
              glyphId: "glyph-r2c2",
              shape: "arrow",
              fill: "striped",
              quarterTurns: 2,
              altText: "a striped arrow pointing down",
            },
          },
          {
            cellId: "cell-r2c3",
            glyph: {
              glyphId: "glyph-r2c3",
              shape: "chevron",
              fill: "striped",
              quarterTurns: 3,
              altText: "a striped chevron pointing left",
            },
          },
        ],
        [
          {
            cellId: "cell-r3c1",
            glyph: {
              glyphId: "glyph-r3c1",
              shape: "triangle",
              fill: "solid",
              quarterTurns: 2,
              altText: "a solid triangle pointing down",
            },
          },
          {
            cellId: "cell-r3c2",
            glyph: {
              glyphId: "glyph-r3c2",
              shape: "arrow",
              fill: "solid",
              quarterTurns: 3,
              altText: "a solid arrow pointing left",
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
          glyphId: "choice-a-glyph",
          shape: "triangle",
          fill: "solid",
          quarterTurns: 0,
          altText: "a solid triangle pointing up",
        },
      },
      {
        id: "b",
        glyph: {
          glyphId: "choice-b-glyph",
          shape: "chevron",
          fill: "solid",
          quarterTurns: 0,
          altText: "a solid chevron pointing up",
        },
      },
      {
        id: "c",
        glyph: {
          glyphId: "choice-c-glyph",
          shape: "chevron",
          fill: "outline",
          quarterTurns: 0,
          altText: "an outlined chevron pointing up",
        },
      },
      {
        id: "d",
        glyph: {
          glyphId: "choice-d-glyph",
          shape: "chevron",
          fill: "solid",
          quarterTurns: 1,
          altText: "a solid chevron pointing right",
        },
      },
    ],
    correctChoiceId: "b",
    explanation: [
      {
        id: "matrix-fill-from-the-row",
        title: "Look along the bottom row",
        operation: "focus",
        narration:
          "Start with the filling. Every picture in the bottom row is solid, and every picture in a row shares the same filling, so the empty space has to be solid.",
        highlightIds: ["cell-r3c1", "cell-r3c2", "cell-r3c3"],
        visualState: {
          kind: "focus",
          cellIds: ["cell-r3c1", "cell-r3c2", "cell-r3c3"],
        },
      },
      {
        id: "matrix-shape-from-the-column",
        title: "Look down the last column",
        operation: "focus",
        narration:
          "Now look straight down the column on the right. Both pictures in it are chevrons, and a column keeps the same shape, so the empty space is a chevron too.",
        highlightIds: ["glyph-r1c3", "glyph-r2c3", "cell-r3c3"],
        visualState: {
          kind: "focus",
          cellIds: ["cell-r1c3", "cell-r2c3", "cell-r3c3"],
        },
      },
      {
        id: "matrix-turn-along-the-row",
        title: "Count the turns along the row",
        operation: "transform",
        narration:
          "Which way should it point? Along the bottom row the triangle points down, the arrow points left, and each picture turns a quarter turn as you move right. So after left comes up.",
        highlightIds: ["cell-r3c1", "cell-r3c2"],
        visualState: {
          kind: "transform",
          cellId: "cell-r3c2",
          transform: { kind: "rotate", quarterTurns: 1 },
        },
      },
      {
        id: "matrix-turn-along-the-column",
        title: "Check the turns down the column",
        operation: "focus",
        narration:
          "Check it the other way. Down the right-hand column the chevron points down, then left, then up — one quarter turn each step. The row and the column agree, so the answer is right.",
        highlightIds: ["glyph-r1c3", "glyph-r2c3", "cell-r3c3"],
        visualState: {
          kind: "focus",
          cellIds: ["cell-r1c3", "cell-r2c3", "cell-r3c3"],
        },
      },
      {
        id: "matrix-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "b",
        narration:
          "So the answer is B: a solid chevron pointing up.",
        highlightIds: ["cell-r3c3"],
        visualState: { kind: "none" },
      },
      {
        id: "matrix-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "Here is the rule for this board: the shape stays the same going down a column, the filling stays the same going across a row, and every picture turns a quarter turn each time you move right or move down.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
];