/**
 * Shipped-corpus tests (U8 test scenarios 5 and 6).
 *
 * The content module is the thing that reaches a child, so the corpus itself
 * has to clear the same bar as the fixtures in `validate.test.ts`. These run as
 * part of `npm test`, which is the gate before content is accepted (KTD5).
 */
import {
  claimedReasoningCategories,
  questions,
} from "@/content/questions";
import { validateCorpusCoverage, validateQuestion } from "@/lib/questions/validate";

describe("the shipped question corpus", () => {
  it("validates question by question", () => {
    const failures = questions
      .map((question) => ({ question, result: validateQuestion(question) }))
      .filter((entry) => !entry.result.valid);

    expect(
      failures.map(
        (entry) =>
          `${entry.question.id}: ${entry.result.issues.map((issue) => issue.message).join("; ")}`,
      ),
    ).toEqual([]);
  });

  it("covers every reasoning category the product claims", () => {
    const result = validateCorpusCoverage(questions, claimedReasoningCategories);

    expect(result.issues.map((issue) => issue.message)).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("holds one question per supported type", () => {
    const types = questions.map((question) => question.type).sort();

    expect(types).toEqual([
      "classification",
      "classification",
      "figure-analogy",
      "figure-matrix",
      "number-series",
      "verbal-analogy",
    ]);
  });

  it("gives every question a prompt, a key, and at least one explanation step", () => {
    const incomplete = questions.filter(
      (question) =>
        question.prompt.trim() === "" ||
        question.choices.length < 2 ||
        question.explanation.length === 0,
    );

    expect(incomplete.map((question) => question.id)).toEqual([]);
  });
});