import { describe, expect, it } from "vitest";
import { scoreSession } from "./diagnostic";
import type { ScoredResponse } from "./diagnostic";
import { recommendPractice } from "./diagnosticRules";

function responses(
  area: ScoredResponse["reasoningCategory"],
  correctCount: number,
  totalCount: number,
): ScoredResponse[] {
  return Array.from({ length: totalCount }, (_, index) => ({
    questionId: `${area}-${index}`,
    correct: index < correctCount,
    reasoningCategory: area,
  }));
}

describe("recommendPractice", () => {
  it("recommends no focus when no area has a sufficient sample", () => {
    const result = scoreSession(responses("nonverbal", 2, 2));

    const recommendation = recommendPractice(result);

    expect(recommendation.focusAreas).toHaveLength(3);
    expect(recommendation.rationale).toContain("Not enough practice data yet");
    expect(recommendation.startingDifficulty).toBe("introductory");
  });

  it("steps difficulty up when every assessed area is strong", () => {
    const result = scoreSession([
      ...responses("nonverbal", 3, 3),
      ...responses("quantitative", 3, 3),
      ...responses("verbal", 3, 3),
    ]);

    const recommendation = recommendPractice(result);

    expect(recommendation.startingDifficulty).toBe("advanced");
    expect(recommendation.rationale).toContain("more difficulty");
  });

  it("targets a single weak area when the others are solid", () => {
    const result = scoreSession([
      ...responses("nonverbal", 1, 3),
      ...responses("quantitative", 3, 3),
      ...responses("verbal", 3, 3),
    ]);

    const recommendation = recommendPractice(result);

    expect(recommendation.focusAreas).toEqual(["nonverbal"]);
    expect(recommendation.rationale).toContain("nonverbal");
    expect(recommendation.startingDifficulty).toBe("introductory");
  });

  it("recommends broad practice when several areas are weak", () => {
    const result = scoreSession([
      ...responses("nonverbal", 1, 3),
      ...responses("quantitative", 1, 3),
      ...responses("verbal", 3, 3),
    ]);

    const recommendation = recommendPractice(result);

    expect(recommendation.focusAreas).toEqual(["nonverbal", "quantitative"]);
    expect(recommendation.startingDifficulty).toBe("introductory");
  });

  it("falls back to a balanced mix for a mid-range result", () => {
    const result = scoreSession([
      ...responses("nonverbal", 2, 3),
      ...responses("quantitative", 2, 3),
      ...responses("verbal", 2, 3),
    ]);

    const recommendation = recommendPractice(result);

    expect(recommendation.focusAreas).toEqual(["nonverbal", "quantitative", "verbal"]);
    expect(recommendation.startingDifficulty).toBe("developing");
  });

  it("is deterministic — the same result always recommends the same thing", () => {
    const result = scoreSession([
      ...responses("nonverbal", 1, 3),
      ...responses("quantitative", 3, 3),
      ...responses("verbal", 2, 3),
    ]);

    expect(recommendPractice(result)).toEqual(recommendPractice(result));
  });

  it("never frames the recommendation as an assessment score", () => {
    const result = scoreSession([
      ...responses("nonverbal", 1, 3),
      ...responses("quantitative", 3, 3),
      ...responses("verbal", 3, 3),
    ]);

    const text = JSON.stringify(recommendPractice(result)).toLowerCase();

    for (const prohibited of ["iq", "percentile", "placement", "gifted", "diagnos"]) {
      expect(text).not.toContain(prohibited);
    }
  });
});
