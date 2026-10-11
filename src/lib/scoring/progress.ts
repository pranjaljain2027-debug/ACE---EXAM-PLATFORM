/**
 * Progress calculators (R28).
 *
 * Everything here is computed on read from the stored responses. There are no
 * denormalised counters — no cached totals, no incrementing running scores —
 * because a counter that drifts from its source is indistinguishable from a
 * correct one until a parent notices their child's history disagreeing with
 * the summary. Deriving on read costs nothing at this data volume and removes
 * the failure mode entirely.
 */
import { REASONING_AREAS, sampleAreas } from "./insufficientData";
import type { ReasoningArea } from "./insufficientData";
import { scoreSession } from "./diagnostic";
import type { DiagnosticResult, ScoredResponse } from "./diagnostic";
import { recommendPractice } from "./diagnosticRules";
import type { PracticeRecommendation } from "./diagnosticRules";

/** One completed session, as recovered from the response log. */
export type SessionRecord = {
  readonly sessionId: string;
  readonly responses: readonly ScoredResponse[];
  /** ISO date string; the day the session was completed. */
  readonly completedOn: string;
};

/** Per-area progress across all sessions. */
export type AreaProgress = {
  readonly area: ReasoningArea;
  readonly answered: number;
  readonly correct: number;
  readonly sufficient: boolean;
  /** Present only when `sufficient`. */
  readonly accuracy: number | undefined;
  readonly reason: string | undefined;
};

/** Everything a parent view needs about a child's practice to date. */
export type ProgressSummary = {
  readonly sessionCount: number;
  readonly totalAnswered: number;
  readonly totalCorrect: number;
  /** Overall proportion across every answered question, 0–1. */
  readonly overallAccuracy: number;
  readonly areas: readonly AreaProgress[];
  readonly firstSessionOn: string | undefined;
  readonly mostRecentSessionOn: string | undefined;
  /** Sessions per area, used for "where has practice been concentrated". */
  readonly activityByArea: Readonly<Record<ReasoningArea, number>>;
  readonly latestDiagnostic: DiagnosticResult;
  readonly recommendation: PracticeRecommendation;
};

function sortDates(records: readonly SessionRecord[]): readonly string[] {
  return [...records]
    .map((record) => record.completedOn)
    .sort((a, b) => a.localeCompare(b));
}

function buildAreaProgress(
  allResponses: readonly ScoredResponse[],
): readonly AreaProgress[] {
  const samples = sampleAreas({
    nonverbal: allResponses.filter((r) => r.reasoningCategory === "nonverbal"),
    quantitative: allResponses.filter((r) => r.reasoningCategory === "quantitative"),
    verbal: allResponses.filter((r) => r.reasoningCategory === "verbal"),
  });

  return samples.map((sample) => ({
    area: sample.area,
    answered: sample.answered,
    correct: sample.correct,
    sufficient: sample.sufficient,
    accuracy: sample.sufficient ? sample.correct / sample.answered : undefined,
    reason: sample.reason,
  }));
}

function buildActivityByArea(
  records: readonly SessionRecord[],
): Record<ReasoningArea, number> {
  const activity: Record<ReasoningArea, number> = {
    nonverbal: 0,
    quantitative: 0,
    verbal: 0,
  };
  for (const record of records) {
    const touched = new Set<ReasoningArea>();
    for (const response of record.responses) {
      touched.add(response.reasoningCategory);
    }
    for (const area of touched) {
      activity[area] += 1;
    }
  }
  return activity;
}

/**
 * Compute a child's practice progress from the full session history.
 *
 * The most recent session's diagnostic and the practice recommendation derived
 * from it are both included, so the parent dashboard does not have to
 * reimplement scoring to show "what should they do next".
 *
 * An empty history is a valid input: every area reports the insufficient-data
 * state and the recommendation says so, rather than showing zeroed percentages.
 */
export function computeProgress(records: readonly SessionRecord[]): ProgressSummary {
  const allResponses: ScoredResponse[] = [];
  for (const record of records) {
    allResponses.push(...record.responses);
  }

  const totalAnswered = allResponses.length;
  const totalCorrect = allResponses.filter((r) => r.correct).length;
  const overallAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

  const latestRecord = records[records.length - 1];
  const latestResponses = latestRecord?.responses ?? [];
  const latestDiagnostic = scoreSession(latestResponses);
  const recommendation = recommendPractice(latestDiagnostic);

  const dates = sortDates(records);

  return {
    sessionCount: records.length,
    totalAnswered,
    totalCorrect,
    overallAccuracy,
    areas: buildAreaProgress(allResponses),
    firstSessionOn: dates[0],
    mostRecentSessionOn: dates[dates.length - 1],
    activityByArea: buildActivityByArea(records),
    latestDiagnostic,
    recommendation,
  };
}

/**
 * Per-session summaries, newest first — the activity feed's data source.
 *
 * Each entry carries its own diagnostic so the feed does not have to recompute
 * one entry at a time from the aggregate.
 */
export function sessionSummaries(
  records: readonly SessionRecord[],
): ReadonlyArray<{
  readonly sessionId: string;
  readonly completedOn: string;
  readonly diagnostic: DiagnosticResult;
}> {
  return [...records]
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn))
    .map((record) => ({
      sessionId: record.sessionId,
      completedOn: record.completedOn,
      diagnostic: scoreSession(record.responses),
    }));
}

/** The areas with the most sessions — answers "where has practice been concentrated". */
export function mostActiveAreas(
  summary: ProgressSummary,
  limit = 1,
): readonly ReasoningArea[] {
  return REASONING_AREAS.filter((area) => summary.activityByArea[area] > 0)
    .sort((a, b) => summary.activityByArea[b] - summary.activityByArea[a])
    .slice(0, limit);
}
