/**
 * Puzzle correctness tests for the shipped corpus.
 *
 * `validateQuestion` proves a question is internally consistent. It cannot
 * prove the puzzle is *solvable*: a consistent question can still encode a
 * nonsense rule and teach a child the wrong thing. These tests re-derive each
 * answer from the cells or terms a child can actually see, working only from
 * the visible puzzle, and check the derivation against the key that ships.
 *
 * The two word questions (odd-word-out, verbal analogy) have no mechanical
 * derivation — their correctness is a human review item, not something a test
 * can honestly claim to prove.
 */
import { classificationQuestions } from "./classification";
import { figureAnalogyQuestions } from "./figureAnalogy";
import { figureMatrixQuestions } from "./figureMatrix";
import { numberSeriesQuestions } from "./numberSeries";
import type {
  ClassificationItem,
  FigureGlyph,
  FigureMatrixCell,
  FigureMatrixQuestion,
  ShapeKind,
} from "./types";

function at<T>(items: readonly T[], index: number, label: string): T {
  const item = items.at(index);
  if (item === undefined) {
    throw new Error(`the fixture needs a ${label} at index ${index}`);
  }
  return item;
}

function found<T>(items: readonly T[], matches: (item: T) => boolean, label: string): T {
  const item = items.find(matches);
  if (item === undefined) {
    throw new Error(`the fixture needs a ${label}`);
  }
  return item;
}

function keyedGlyph(question: {
  choices: readonly { id: string; glyph: FigureGlyph }[];
  correctChoiceId: string;
}): FigureGlyph {
  return found(
    question.choices,
    (choice) => choice.id === question.correctChoiceId,
    "glyph for the answer key",
  ).glyph;
}

function keyedItemId(choices: readonly { id: string; itemId: string }[], correctChoiceId: string): string {
  return found(
    choices,
    (choice) => choice.id === correctChoiceId,
    "the keyed choice",
  ).itemId;
}

function columns(question: FigureMatrixQuestion): readonly (readonly FigureMatrixCell[])[] {
  const firstRow = question.visual.rows[0];
  if (firstRow === undefined) {
    return [];
  }
  return firstRow.map((_, columnIndex) =>
    question.visual.rows.map((row) => at(row, columnIndex, "cell")),
  );
}

function glyphOf(cell: FigureMatrixCell): FigureGlyph {
  if (cell.glyph === null) {
    throw new Error(`expected "${cell.cellId}" to be filled in`);
  }
  return cell.glyph;
}

function shapeOfItem(item: ClassificationItem): ShapeKind | null {
  return item.kind === "figure" ? item.glyph.shape : null;
}

describe("the figure matrix", () => {
  const question = at(figureMatrixQuestions, 0, "figure-matrix question");

  it("turns one quarter turn clockwise at every step right along a row", () => {
    for (const [rowIndex, row] of question.visual.rows.entries()) {
      for (const [columnIndex, cell] of row.entries()) {
        const next = row.at(columnIndex + 1);
        if (cell.glyph === null || next === undefined || next.glyph === null) {
          continue;
        }
        expect(
          next.glyph.quarterTurns,
          `row ${rowIndex + 1}, cell ${columnIndex + 2}`,
        ).toBe((cell.glyph.quarterTurns + 1) % 4);
      }
    }
  });

  it("turns one quarter turn clockwise at every step down a column", () => {
    for (const [columnIndex, column] of columns(question).entries()) {
      for (const [rowIndex, cell] of column.entries()) {
        const next = column.at(rowIndex + 1);
        if (cell.glyph === null || next === undefined || next.glyph === null) {
          continue;
        }
        expect(
          next.glyph.quarterTurns,
          `column ${columnIndex + 1}, row ${rowIndex + 2}`,
        ).toBe((cell.glyph.quarterTurns + 1) % 4);
      }
    }
  });

  it("keeps the filling constant across every row", () => {
    for (const [rowIndex, row] of question.visual.rows.entries()) {
      const fills = row.filter((cell) => cell.glyph !== null).map((cell) => glyphOf(cell).fill);
      expect(new Set(fills).size, `row ${rowIndex + 1}`).toBe(1);
    }
  });

  it("keeps the shape constant down every column", () => {
    for (const [columnIndex, column] of columns(question).entries()) {
      const shapes = column
        .filter((cell) => cell.glyph !== null)
        .map((cell) => glyphOf(cell).shape);
      expect(new Set(shapes).size, `column ${columnIndex + 1}`).toBe(1);
    }
  });

  it("derives the missing cell from its row and its column, and that derivation is the key", () => {
    const board = question.visual.rows;
    const missingRowIndex = board.findIndex((row) =>
      row.some((cell) => cell.cellId === question.visual.missingCellId),
    );
    expect(missingRowIndex).toBeGreaterThan(-1);

    const row = at(board, missingRowIndex, "the row holding the empty cell");
    const missingIndex = row.findIndex((cell) => cell.cellId === question.visual.missingCellId);
    const column = at(columns(question), missingIndex, "the column holding the empty cell");

    expect(at(row, missingIndex, "the empty cell").glyph).toBeNull();

    const rowGlyphs = row.filter((cell) => cell.glyph !== null).map(glyphOf);
    const columnGlyphs = column.filter((cell) => cell.glyph !== null).map(glyphOf);

    const derived = {
      // Filling comes from the row: every filled cell in it agrees.
      fill: at(rowGlyphs, 0, "row glyph").fill,
      // Shape comes from the column: every filled cell in it agrees.
      shape: at(columnGlyphs, 0, "column glyph").shape,
      // Facing comes from one more quarter turn after the last cell of the row.
      quarterTurns: (at(rowGlyphs, rowGlyphs.length - 1, "row glyph").quarterTurns + 1) % 4,
    };

    // The column must reach the same facing, or the puzzle would have two answers.
    expect(
      (at(columnGlyphs, columnGlyphs.length - 1, "column glyph").quarterTurns + 1) % 4,
    ).toBe(derived.quarterTurns);

    const keyed = keyedGlyph(question);
    expect({ shape: keyed.shape, fill: keyed.fill, quarterTurns: keyed.quarterTurns }).toEqual(
      derived,
    );
  });
});

describe("the figure analogy", () => {
  const question = at(figureAnalogyQuestions, 0, "figure-analogy question");

  it("changes the shape nowhere, because the rule is a turn and a filling", () => {
    expect(question.visual.second.glyph.shape).toBe(question.visual.first.glyph.shape);
  });

  it("applies the worked pair's change to the third figure, and that is the key", () => {
    const { first, second, third } = question.visual;
    const keyed = keyedGlyph(question);

    expect({ shape: keyed.shape, fill: keyed.fill, quarterTurns: keyed.quarterTurns }).toEqual({
      shape: third.glyph.shape,
      fill: second.glyph.fill,
      quarterTurns: (third.glyph.quarterTurns + second.glyph.quarterTurns - first.glyph.quarterTurns + 4) % 4,
    });
  });
});

describe("the picture classification", () => {
  const question = at(classificationQuestions, 0, "classification question");

  it("leaves out one member whose shape breaks the rule the other three share", () => {
    const oddItemId = keyedItemId(question.choices, question.correctChoiceId);
    const oddItem = found(
      question.visual.items,
      (item) => item.itemId === oddItemId,
      "the odd item",
    );
    const others = question.visual.items.filter((item) => item.itemId !== oddItemId);

    expect(new Set(others.map(shapeOfItem)).size).toBe(1);
    if (oddItem.kind !== "figure") {
      throw new Error("the odd member must be a picture");
    }
    expect(oddItem.glyph.shape).not.toBe(shapeOfItem(at(others, 0, "group member")));
  });
});

describe("the number series", () => {
  const question = at(numberSeriesQuestions, 0, "number-series question");

  function givenTerms(): readonly { termId: string; value: number | null }[] {
    return question.visual.terms.filter((term) => term.value !== null);
  }

  it("doubles every term from the one before it", () => {
    const given = givenTerms();
    for (const [index, term] of given.entries()) {
      const previous = index === 0 ? undefined : given.at(index - 1);
      if (previous?.value !== undefined && previous.value !== null && term.value !== null) {
        expect(term.value, `term ${index + 1} follows term ${index}`).toBe(previous.value * 2);
      }
    }
  });

  it("keys the double of the last given term", () => {
    const given = givenTerms();
    const last = at(given, given.length - 1, "given term").value;
    const keyedValue = found(
      question.choices,
      (choice) => choice.id === question.correctChoiceId,
      "the keyed choice",
    ).value;

    expect(keyedValue).toBe((last ?? 0) * 2);
  });
});

describe("distractors", () => {
  const figureQuestions = [...figureMatrixQuestions, ...figureAnalogyQuestions];

  it("gives every figure question four distinct pictures", () => {
    for (const question of figureQuestions) {
      const descriptions = question.choices.map((choice) => choice.glyph.altText);
      expect(new Set(descriptions).size, question.id).toBe(question.choices.length);
    }
  });

  it("makes every wrong figure choice differ from the key in at least one way", () => {
    for (const question of figureQuestions) {
      const keyed = keyedGlyph(question);
      const wrong = question.choices.filter((choice) => choice.id !== question.correctChoiceId);
      expect(wrong.length, question.id).toBeGreaterThan(0);
      for (const choice of wrong) {
        const differs =
          choice.glyph.shape !== keyed.shape ||
          choice.glyph.fill !== keyed.fill ||
          choice.glyph.quarterTurns !== keyed.quarterTurns;
        expect(differs, `${question.id}: choice ${choice.id} is a copy of the key`).toBe(true);
      }
    }
  });

  it("makes every number choice a different number", () => {
    for (const question of numberSeriesQuestions) {
      const values = question.choices.map((choice) => choice.value);
      expect(new Set(values).size, question.id).toBe(question.choices.length);
    }
  });
});