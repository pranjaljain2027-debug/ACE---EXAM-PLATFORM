/**
 * The marketing copy against the content it claims to describe (U4, R9).
 *
 * The landing page says which reasoning areas the practice holds questions
 * for. That sentence is only worth anything if the corpus behind it is real,
 * so it is checked against `questions` rather than trusted: an assessment that
 * claims an area the content does not cover fails here.
 *
 * The rendered claim scan lives with the page it protects
 * (`(public)/landing-page.test.tsx`). This file is the part that needs no
 * browser — the data, checked against the data.
 */
import { claimedReasoningCategories, questions } from "@/content/questions";
import { REASONING_AREA_NOTES, assessmentCoverage } from "./copy";

/** Reasoning areas the shipped corpus really holds questions for. */
const categoriesWithQuestions = new Set(questions.map((question) => question.reasoningCategory));

describe("assessment coverage claims", () => {
  it("claims only reasoning areas the shipped corpus holds questions for", () => {
    const claims = assessmentCoverage.flatMap((assessment) =>
      assessment.areas.map((area) => ({
        assessment: assessment.name,
        label: area.label,
        category: area.category,
      })),
    );

    expect(claims.length).toBeGreaterThan(0);

    const unbacked = claims.filter((claim) => !categoriesWithQuestions.has(claim.category));

    expect(unbacked).toEqual([]);
  });

  it("claims only areas the corpus module itself claims to cover", () => {
    const unbacked = assessmentCoverage
      .flatMap((assessment) => assessment.areas)
      .filter((area) => !claimedReasoningCategories.includes(area.category));

    expect(unbacked).toEqual([]);
  });

  it("has at least one question behind every reasoning area it describes", () => {
    const counts = new Map<string, number>();
    for (const question of questions) {
      counts.set(question.reasoningCategory, (counts.get(question.reasoningCategory) ?? 0) + 1);
    }

    for (const [category, note] of Object.entries(REASONING_AREA_NOTES)) {
      expect(`${category}:${counts.get(category) ?? 0}`).not.toBe(`${category}:0`);
      expect(note.length).toBeGreaterThan(20);
    }
  });

  it("names CogAT, OLSAT and NNAT once each, with no duplicated assessment", () => {
    expect(assessmentCoverage.map((entry) => entry.name)).toEqual(["CogAT", "OLSAT", "NNAT"]);
  });

  it("gives every area of every assessment a label and a reason it is there", () => {
    for (const assessment of assessmentCoverage) {
      expect(assessment.summary.length).toBeGreaterThan(20);

      for (const area of assessment.areas) {
        expect(area.label.trim()).not.toBe("");
        // The detail is read from the reasoning area rather than written again,
        // so the same area cannot be described two different ways.
        expect(area.detail).toBe(REASONING_AREA_NOTES[area.category]);
      }
    }
  });
});
