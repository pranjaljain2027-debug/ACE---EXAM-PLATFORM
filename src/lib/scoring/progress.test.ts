import { describe, expect, it } from "vitest";
import { computeProgress, mostActiveAreas, sessionSummaries } from "./progress";
import type { SessionRecord } from "./progress";
import type { ScoredResponse } from "./diagnostic";

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

function session(
  sessionId: string,
  completedOn: string,
  answered: ScoredResponse[],
): SessionRecord {
  return { sessionId, completedOn, responses: answered };
}

describe("computeProgress", () => {
  it("matches a hand-computed count for a known response set", () => {
    const history = [
      session("s1", "2026-10-01", [
        ...responses("nonverbal", 2, 3),
        ...responses("quantitative", 1, 3),
        ...responses("verbal", 3, 3),
      ]),
      session("s2", "2026-10-08", [
        ...responses("nonverbal", 3, 3),
        ...responses("quantitative", 2, 3),
        ...responses("verbal", 1, 3),
      ]),
    ];

    const summary = computeProgress(history);

    // Hand-computed: s1 has 2+1+3 = 6 correct of 9, s2 has 3+2+1 = 6 of 9.
    expect(summary.totalAnswered).toBe(18);
    expect(summary.totalCorrect).toBe(12);
    expect(summary.overallAccuracy).toBeCloseTo(12 / 18);
    expect(summary.sessionCount).toBe(2);
  });

  it("returns the insufficient-data state per area below the minimum sample (AE3)", () => {
    const summary = computeProgress([
      session("s1", "2026-10-01", [
        ...responses("nonverbal", 3, 3),
        ...responses("quantitative", 1, 1),
      ]),
    ]);

    const nonverbal = summary.areas.find((area) => area.area === "nonverbal");
    const quantitative = summary.areas.find((area) => area.area === "quantitative");

    expect(nonverbal?.sufficient).toBe(true);
    expect(nonverbal?.accuracy).toBe(1);
    expect(quantitative?.sufficient).toBe(false);
    expect(quantitative?.accuracy).toBeUndefined();
    expect(quantitative?.reason).toContain("Not enough data yet");
  });

  it("produces a designed empty state for a child with no sessions", () => {
    const summary = computeProgress([]);

    expect(summary.sessionCount).toBe(0);
    expect(summary.totalAnswered).toBe(0);
    expect(summary.overallAccuracy).toBe(0);
    expect(summary.firstSessionOn).toBeUndefined();
    expect(summary.areas.every((area) => area.accuracy === undefined)).toBe(true);
    expect(summary.recommendation.rationale).toContain("Not enough practice data yet");
  });

  it("derives everything on read, so recounting the same history gives the same figures", () => {
    const history = [
      session("s1", "2026-10-01", responses("nonverbal", 2, 3)),
      session("s2", "2026-10-02", responses("verbal", 3, 3)),
    ];

    expect(computeProgress(history)).toEqual(computeProgress(history));
  });

  it("records which areas practice has actually been concentrated in", () => {
    const summary = computeProgress([
      session("s1", "2026-10-01", responses("nonverbal", 2, 3)),
      session("s2", "2026-10-02", [
        ...responses("nonverbal", 1, 3),
        ...responses("verbal", 3, 3),
      ]),
    ]);

    expect(summary.activityByArea.nonverbal).toBe(2);
    expect(summary.activityByArea.verbal).toBe(1);
    expect(summary.activityByArea.quantitative).toBe(0);
    expect(mostActiveAreas(summary)).toEqual(["nonverbal"]);
  });

  it("never emits an IQ, percentile, or placement claim", () => {
    const summary = computeProgress([
      session("s1", "2026-10-01", [
        ...responses("nonverbal", 3, 3),
        ...responses("quantitative", 3, 3),
        ...responses("verbal", 3, 3),
      ]),
    ]);

    const text = JSON.stringify(summary).toLowerCase();

    for (const prohibited of ["iq score", "percentile", "placement", "gifted"]) {
      expect(text).not.toContain(prohibited);
    }
  });
});

describe("sessionSummaries", () => {
  it("returns sessions newest first for the activity feed", () => {
    const summaries = sessionSummaries([
      session("older", "2026-10-01", responses("nonverbal", 1, 3)),
      session("newer", "2026-10-09", responses("nonverbal", 3, 3)),
    ]);

    expect(summaries.map((entry) => entry.sessionId)).toEqual(["newer", "older"]);
    expect(summaries[0]?.diagnostic.correctCount).toBe(3);
  });
});
