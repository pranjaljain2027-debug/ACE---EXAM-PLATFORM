/**
 * Content validator tests (U8 test scenarios 1-4 and 6).
 *
 * Every fixture is a deep clone of a question that actually ships, so each
 * assertion here is an assertion about the corpus we ship, not about a toy
 * object that could never reach production.
 */
import { classificationQuestions } from "@/content/questions/classification";
import { figureMatrixQuestions } from "@/content/questions/figureMatrix";
import { numberSeriesQuestions } from "@/content/questions/numberSeries";
import type { FigureMatrixQuestion, Question } from "@/content/questions/types";
import {
  validateCorpusCoverage,
  validateQuestion,
  type ValidationResult,
} from "@/lib/questions/validate";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function at<T>(items: readonly T[], index: number, label: string): T {
  const item = items.at(index);
  if (item === undefined) {
    throw new Error(`the fixture needs a ${label} at index ${index}`);
  }
  return item;
}

function messages(result: ValidationResult): string {
  return result.issues.map((issue) => issue.message).join("\n");
}

function matrixFixture(): FigureMatrixQuestion {
  return clone(at(figureMatrixQuestions, 0, "figure-matrix question"));
}

describe("validateQuestion — answer key and explanation must agree (AE2)", () => {
  it("fails a question whose key disagrees with the choice its explanation reveals", () => {
    const question = matrixFixture();
    const wrongKey = question.choices.find((choice) => choice.id !== question.correctChoiceId);
    if (wrongKey === undefined) {
      throw new Error("the fixture question must offer a wrong choice");
    }

    const result = validateQuestion({ ...question, correctChoiceId: wrongKey.id });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain(`reveals choice "${question.correctChoiceId}"`);
    expect(messages(result)).toContain(`answer key is "${wrongKey.id}"`);
  });

  it("fails a question whose explanation never reveals an answer", () => {
    const question = matrixFixture();
    const withoutReveal = question.explanation.filter((step) => step.operation !== "reveal");

    const result = validateQuestion({ ...question, explanation: withoutReveal });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("no explanation step that reveals an answer");
  });

  it("fails a question whose key names a choice that does not exist", () => {
    const question = matrixFixture();

    const result = validateQuestion({ ...question, correctChoiceId: "zz" });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain('answer key names the choice "zz"');
  });
});

describe("validateQuestion — ids must be unique and resolvable", () => {
  it("fails a question with two choices sharing one id", () => {
    const question = matrixFixture();
    const firstChoice = at(question.choices, 0, "choice");
    const choices = question.choices.map((choice, index) =>
      index === 1 ? { ...choice, id: firstChoice.id } : choice,
    );

    const result = validateQuestion({ ...question, choices });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain(`two choices with the id "${firstChoice.id}"`);
  });

  it("fails a highlight id that names no element of the visual", () => {
    const question = matrixFixture();
    const explanation = question.explanation.map((step, index) =>
      index === 0 ? { ...step, highlightIds: ["cell-r9c9"] } : step,
    );

    const result = validateQuestion({ ...question, explanation });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain('"cell-r9c9"');
    expect(messages(result)).toContain("not an element of the visual");
  });

  it("fails a visual that reuses one element id, because a highlight would light up two things", () => {
    const question = matrixFixture();
    const rows = question.visual.rows.map((row, rowIndex) =>
      row.map((cell, columnIndex) =>
        rowIndex === 0 && columnIndex === 1
          ? { ...cell, cellId: at(question.visual.rows, 0, "row")[0]?.cellId ?? cell.cellId }
          : cell,
      ),
    );

    const result = validateQuestion({ ...question, visual: { ...question.visual, rows } });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain('"cell-r1c1"');
    expect(messages(result)).toContain("more than once");
  });

  it("fails a choice that points at a member of the picture group that is not there", () => {
    const question = clone(at(classificationQuestions, 0, "classification question"));
    const choices = question.choices.map((choice, index) =>
      index === 0 ? { ...choice, itemId: "figure-99" } : choice,
    );

    const result = validateQuestion({ ...question, choices });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain('"figure-99"');
    expect(messages(result)).toContain("not one of the group members");
  });
});

describe("validateQuestion — every step teaches something", () => {
  it("fails a step with an empty narration", () => {
    const question = matrixFixture();
    const explanation = question.explanation.map((step, index) =>
      index === 0 ? { ...step, narration: "" } : step,
    );

    const result = validateQuestion({ ...question, explanation });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("has an empty narration");
  });

  it("fails a step whose narration is only spaces", () => {
    const question = matrixFixture();
    const explanation = question.explanation.map((step, index) =>
      index === 0 ? { ...step, narration: "   " } : step,
    );

    const result = validateQuestion({ ...question, explanation });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("has an empty narration");
  });

  it("fails a question whose difficulty is not a known value", () => {
    const question = matrixFixture();
    const broken = { ...question, difficulty: "impossible" } as unknown as Question;

    const result = validateQuestion(broken);

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("unknown difficulty");
  });

  it("fails a figure whose alt text is empty, because a picture choice would be nameless", () => {
    const question = matrixFixture();
    const rows = question.visual.rows.map((row, rowIndex) =>
      row.map((cell, columnIndex) =>
        rowIndex === 0 && columnIndex === 0 && cell.glyph !== null
          ? { ...cell, glyph: { ...cell.glyph, altText: "" } }
          : cell,
      ),
    );

    const result = validateQuestion({ ...question, visual: { ...question.visual, rows } });

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("has no alt text");
  });
});

describe("validateCorpusCoverage", () => {
  it("fails when a claimed category has no validated question", () => {
    const quantitativeOnly = numberSeriesQuestions;

    const result = validateCorpusCoverage(quantitativeOnly, [
      "nonverbal",
      "quantitative",
      "verbal",
    ]);

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain('"nonverbal"');
    expect(messages(result)).toContain('"verbal"');
  });

  it("fails when a corpus holds two questions under one id", () => {
    const [question] = numberSeriesQuestions;
    if (question === undefined) {
      throw new Error("the number-series corpus must not be empty");
    }
    const doubled = [question, clone(question)];

    const result = validateCorpusCoverage(doubled, ["quantitative"]);

    expect(result.valid).toBe(false);
    expect(messages(result)).toContain("two questions with the id");
  });

  it("passes when every claimed category holds a validated question", () => {
    const result = validateCorpusCoverage(numberSeriesQuestions, ["quantitative"]);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});