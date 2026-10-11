/**
 * The diagnostic scorer (R19).
 *
 * Scores exactly the questions that were actually answered and nothing else. A
 * partial session produces a partial result that says so, rather than a
 * confident recommendation built on three answers.
 *
 * Every figure this module produces is a count or a proportion of the child's
 * own practice answers. It is never an IQ score, a percentile, or a placement
 * prediction (R5, R20).
 */
import {
  REASONING_AREAS,
  areaStateFrom,
  sampleAreas,
  allAreasInsufficient,
} from "./insufficientData";
import type { AreaSample, AreaState, ReasoningArea } from "./insufficientData";
import type { PracticeResponse } from "../data/types";

/** The shape the scorer needs. Narrower than `PracticeResponse` on purpose. */
export type ScoredResponse = Pick<
  PracticeResponse,
  "questionId" | "correct" | "reasoningCategory"
>;

/** A diagnostic result for one session. */
export type DiagnosticResult = {
  /** Questions actually answered. Unanswered questions are never counted. */
  readonly answeredCount: number;
  readonly correctCount: number;
  /** Proportion 0–1 of answered questions that were right. */
  readonly accuracy: number;
  /** Per-area sample state; drives the insufficient-data UI. */
  readonly areas: readonly AreaSample[];
  /** True only when every area has enough answers for a percentage. */
  readonly complete: boolean;
  /** True when at least one area can be reported. */
  readonly partial: boolean;
  /** Plain-language status, safe to show a parent verbatim. */
  readonly status: string;
};

function groupByArea(
  responses: ReadonlyArray<ScoredResponse>,
): Record<ReasoningArea, ScoredResponse[]> {
  const grouped: Record<ReasoningArea, ScoredResponse[]> = {
    nonverbal: [],
    quantitative: [],
    verbal: [],
  };
  for (const response of responses) {
    grouped[response.reasoningCategory].push(response);
  }
  return grouped;
}

/**
 * Score a session.
 *
 * Deterministic and total: the same responses always produce the same result,
 * and an empty response list is a valid input that yields a zeroed result with
 * every area in the insufficient-data state rather than a division by zero.
 */
export function scoreSession(responses: ReadonlyArray<ScoredResponse>): DiagnosticResult {
  const answeredCount = responses.length;
  const correctCount = responses.filter((response) => response.correct).length;
  const accuracy = answeredCount > 0 ? correctCount / answeredCount : 0;

  const areas = sampleAreas(groupByArea(responses));
  const noneSufficient = allAreasInsufficient(areas);
  const someSufficient = !noneSufficient && areas.some((area) => area.sufficient);
  const complete = REASONING_AREAS.every((area) =>
    areas.some((sample) => sample.area === area && sample.sufficient),
  );

  let status: string;
  if (answeredCount === 0) {
    status = "No questions answered yet — nothing to report.";
  } else if (noneSufficient) {
    status = `Partial result — ${answeredCount} answered. Answer a few more in each reasoning area before drawing a conclusion.`;
  } else if (someSufficient && !complete) {
    status = `Partial result — ${answeredCount} answered. Some reasoning areas have enough answers to report and others do not.`;
  } else {
    status = `Complete result — ${answeredCount} answered across all reasoning areas.`;
  }

  return {
    answeredCount,
    correctCount,
    accuracy,
    areas,
    complete,
    partial: answeredCount > 0 && !complete,
    status,
  };
}

/** The per-area state the UI renders, ready to display. */
export function areaStates(result: DiagnosticResult): readonly AreaState[] {
  return result.areas.map(areaStateFrom);
}

/**
 * Per-area accuracy, but only for areas with a sufficient sample.
 *
 * Areas without enough answers are absent from the result rather than present
 * with a zero, so a caller cannot accidentally render `0%` for an area that was
 * never assessed (R28).
 */
export function sufficientAccuracies(
  result: DiagnosticResult,
): ReadonlyArray<{ readonly area: ReasoningArea; readonly accuracy: number }> {
  const output: Array<{ area: ReasoningArea; accuracy: number }> = [];
  for (const sample of result.areas) {
    if (sample.sufficient) {
      output.push({ area: sample.area, accuracy: sample.correct / sample.answered });
    }
  }
  return output;
}
