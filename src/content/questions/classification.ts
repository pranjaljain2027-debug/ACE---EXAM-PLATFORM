/**
 * Classification questions — "which one does not belong?".
 *
 * Classification is the reasoning skill of grouping by a shared property while
 * ignoring the property that merely looks different. One question uses pictures
 * (nonverbal) and one uses words (verbal), because both are asked in these
 * assessments and the two families need different content.
 *
 * Picture set: three outlined triangles pointing three different ways, plus an
 * outlined arrow pointing up. The arrow is the odd one — the rule that holds
 * for the other three is "same shape, turned different ways", and the arrow
 * breaks the shape half of that rule while matching the outline and the
 * direction. The pointing direction is a deliberate distractor surface.
 *
 * Word set: apple, banana, carrot, orange. Carrot is the odd one — it is the
 * only vegetable.
 */
import type { ClassificationQuestion } from "./types";

export const classificationQuestions: readonly ClassificationQuestion[] = [
  {
    id: "classification-same-shape",
    type: "classification",
    reasoningCategory: "nonverbal",
    difficulty: "introductory",
    prompt:
      "Three of these pictures belong together. One does not belong. Which one does not belong?",
    visual: {
      items: [
        {
          kind: "figure",
          itemId: "figure-1",
          glyph: {
            glyphId: "figure-1-glyph",
            shape: "triangle",
            fill: "outline",
            quarterTurns: 0,
            altText: "an outlined triangle pointing up",
          },
        },
        {
          kind: "figure",
          itemId: "figure-2",
          glyph: {
            glyphId: "figure-2-glyph",
            shape: "triangle",
            fill: "outline",
            quarterTurns: 2,
            altText: "an outlined triangle pointing down",
          },
        },
        {
          kind: "figure",
          itemId: "figure-3",
          glyph: {
            glyphId: "figure-3-glyph",
            shape: "triangle",
            fill: "outline",
            quarterTurns: 1,
            altText: "an outlined triangle pointing right",
          },
        },
        {
          kind: "figure",
          itemId: "figure-4",
          glyph: {
            glyphId: "figure-4-glyph",
            shape: "arrow",
            fill: "outline",
            quarterTurns: 0,
            altText: "an outlined arrow pointing up",
          },
        },
      ],
    },
    choices: [
      { id: "a", itemId: "figure-1" },
      { id: "b", itemId: "figure-2" },
      { id: "c", itemId: "figure-3" },
      { id: "d", itemId: "figure-4" },
    ],
    correctChoiceId: "d",
    explanation: [
      {
        id: "class-figures-same-drawing",
        title: "Look at all four",
        operation: "orient",
        narration:
          "First look at all four pictures together. Every one of them is drawn the same way — an outline with nothing filled in.",
        highlightIds: ["figure-1", "figure-2", "figure-3", "figure-4"],
        visualState: {
          kind: "focus",
          itemIds: ["figure-1", "figure-2", "figure-3", "figure-4"],
        },
      },
      {
        id: "class-figures-group-of-three",
        title: "Find the three that match",
        operation: "focus",
        narration:
          "The first three pictures are all triangles. They point up, down, and right, so they are the same shape turned in three different directions. That is what makes them a group.",
        highlightIds: ["figure-1", "figure-2", "figure-3"],
        visualState: { kind: "focus", itemIds: ["figure-1", "figure-2", "figure-3"] },
      },
      {
        id: "class-figures-odd-one",
        title: "The one left over",
        operation: "focus",
        narration:
          "The fourth picture points up like the first one, which makes it look like part of the group. But it is an arrow, not a triangle, so it is the one that does not belong.",
        highlightIds: ["figure-1", "figure-4"],
        visualState: { kind: "focus", itemIds: ["figure-1", "figure-4"] },
      },
      {
        id: "class-figures-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "d",
        narration:
          "So the answer is D, the arrow.",
        highlightIds: ["figure-4"],
        visualState: { kind: "none" },
      },
      {
        id: "class-figures-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "The rule is: the picture that does not belong is the one with a different shape. Pointing a different way does not count — that is only a turn, and every member of the group can be turned.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
  {
    id: "classification-odd-word-out",
    type: "classification",
    reasoningCategory: "verbal",
    difficulty: "introductory",
    prompt: "Three of these words belong together. One does not belong. Which word does not belong?",
    visual: {
      items: [
        { kind: "word", itemId: "word-1", text: "apple" },
        { kind: "word", itemId: "word-2", text: "banana" },
        { kind: "word", itemId: "word-3", text: "carrot" },
        { kind: "word", itemId: "word-4", text: "orange" },
      ],
    },
    choices: [
      { id: "a", itemId: "word-1" },
      { id: "b", itemId: "word-2" },
      { id: "c", itemId: "word-3" },
      { id: "d", itemId: "word-4" },
    ],
    correctChoiceId: "c",
    explanation: [
      {
        id: "class-words-read-all",
        title: "Read all four words",
        operation: "orient",
        narration: "Read the four words out loud: apple, banana, carrot, orange.",
        highlightIds: ["word-1", "word-2", "word-3", "word-4"],
        visualState: {
          kind: "focus",
          itemIds: ["word-1", "word-2", "word-3", "word-4"],
        },
      },
      {
        id: "class-words-group-of-three",
        title: "Find the group of three",
        operation: "focus",
        narration:
          "Apple, banana, and orange are all fruits. Fruits grow on a tree or a bush, and we eat them as fruit.",
        highlightIds: ["word-1", "word-2", "word-4"],
        visualState: { kind: "focus", itemIds: ["word-1", "word-2", "word-4"] },
      },
      {
        id: "class-words-odd-one",
        title: "The one left over",
        operation: "focus",
        narration:
          "A carrot is a vegetable. It grows in the ground, and we eat the root, so it is not a fruit.",
        highlightIds: ["word-3"],
        visualState: { kind: "focus", itemIds: ["word-3"] },
      },
      {
        id: "class-words-reveal",
        title: "The answer",
        operation: "reveal",
        revealsChoiceId: "c",
        narration: "So the answer is C, carrot.",
        highlightIds: ["word-3"],
        visualState: { kind: "none" },
      },
      {
        id: "class-words-rule",
        title: "The rule",
        operation: "state-rule",
        narration:
          "The rule is: sort the words into a group, then pick the word left over. Carrot belongs to a different group — vegetables instead of fruits.",
        highlightIds: [],
        visualState: { kind: "none" },
      },
    ],
  },
];