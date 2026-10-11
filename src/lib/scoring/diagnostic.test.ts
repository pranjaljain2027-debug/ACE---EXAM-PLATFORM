import { describe, expect, it } from "vitest";
import { scoreSession, sufficientAccuracies } from "./diagnostic";
import type { ScoredResponse } from "./diagnostic";
import { MIN_RESPONSES_PER_AREA } from "./insufficientData";

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

describe("scoreSession", () => {
  it("scores every answered question and no unanswered one (R19)", () => {
    const answered = [
      ...responses("nonverbal", 3, 3),
      ...responses("quantitative", 2, 3),
      ...responses("verbal", 1, 3),
    ];

    const result = scoreSession(answered);

    expect(result.answeredCount).toBe(9);
    expect(result.correctCount).toBe(6);
    expect(result.accuracy).toBeCloseTo(6 / 9);
  });

  it("yields a partial result labelled as partial, not a confident recommendation", () => {
    const result = scoreSession([...responses("nonverbal", 2, 2)]);

    expect(result.complete).toBe(false);
    expect(result.partial).toBe(true);
    expect(result.status).toContain("Partial result");
  });

  it("reports complete only when every area has a sufficient sample", () => {
    const result = scoreSession([
      ...responses("nonverbal", 3, 3),
      ...responses("quantitative", 3, 3),
      ...responses("verbal", 3, 3),
    ]);

    expect(result.complete).toBe(true);
    expect(result.partial).toBe(false);
    expect(result.status).toContain("Complete result");
  });

  it("returns a designed zero state for an empty session rather than dividing by zero", () => {
    const result = scoreSession([]);

    expect(result.answeredCount).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.partial).toBe(false);
    expect(result.status).toBe("No questions answered yet — nothing to report.");
  });

  it("is deterministic — the same responses always produce the same result", () => {
    const answered = [...responses("nonverbal", 2, 3), ...responses("verbal", 1, 3)];

    expect(scoreSession(answered)).toEqual(scoreSession(answered));
  });

  it("omits an area from sufficientAccuracies when its sample is too small (AE3)", () => {
    const result = scoreSession([
      ...responses("nonverbal", 3, 3),
      ...responses("quantitative", 1, 2),
      ...responses("verbal", 3, 3),
    ]);

    const areas = sufficientAccuracies(result).map((entry) => entry.area);

    expect(areas).toContain("nonverbal");
    expect(areas).toContain("verbal");
    expect(areas).not.toContain("quantitative");
  });

  it("never reports an accuracy for an area below the minimum sample", () => {
    const result = scoreSession(responses("verbal", 1, MIN_RESPONSES_PER_AREA - 1));

    const verbal = result.areas.find((area) => area.area === "verbal");

    expect(verbal?.sufficient).toBe(false);
    expect(verbal?.reason).toContain("Not enough data yet");
  });
});
