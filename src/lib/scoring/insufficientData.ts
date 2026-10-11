/**
 * The "not enough data yet" state (R28, AE3).
 *
 * Below a minimum sample per reasoning area, the scorers return an explicit
 * insufficient-data state instead of a percentage. The UI renders that state
 * distinctly from low performance — a child who has answered two questions has
 * not "scored 0% on verbal reasoning", they have not been assessed in verbal
 * reasoning at all, and the difference is the whole point of R28.
 *
 * Nothing in this file describes an official assessment or a clinical
 * evaluation (R20).
 */

/** The reasoning areas the product scores and reports on (R9, R19). */
export const REASONING_AREAS = ["nonverbal", "quantitative", "verbal"] as const;

export type ReasoningArea = (typeof REASONING_AREAS)[number];

/**
 * Minimum answered questions per area before a percentage is reported.
 *
 * Why 3: at 1–2 questions a single correct or incorrect answer moves the
 * percentage by 33–50 points, so the number says more about the sample size
 * than about the child. Three answers per area is the smallest sample where a
 * percentage still tracks real performance — and the threshold is stated here
 * in one place rather than scattered through the scorers.
 */
export const MIN_RESPONSES_PER_AREA = 3;

/** Per-area sample state: enough data for a percentage, or why there isn't. */
export type AreaSample = {
  readonly area: ReasoningArea;
  readonly answered: number;
  readonly correct: number;
  /** True only when `answered >= MIN_RESPONSES_PER_AREA`. */
  readonly sufficient: boolean;
  /** Present only when `sufficient` is false. */
  readonly reason: string | undefined;
};

/** The rendered state for one area with too few answers. */
export type InsufficientData = {
  readonly status: "insufficient-data";
  readonly message: string;
};

/** The rendered state for one area with enough answers. */
export type SufficientData = {
  readonly status: "sufficient-data";
  /** Proportion 0–1, only present when the sample is sufficient. */
  readonly accuracy: number;
};

export type AreaState = InsufficientData | SufficientData;

function sampleFor(
  area: ReasoningArea,
  responses: ReadonlyArray<{ readonly correct: boolean }>,
): AreaSample {
  const answered = responses.length;
  const correct = responses.filter((response) => response.correct).length;
  const sufficient = answered >= MIN_RESPONSES_PER_AREA;

  return {
    area,
    answered,
    correct,
    sufficient,
    reason: sufficient
      ? undefined
      : `Not enough data yet — ${answered} of ${MIN_RESPONSES_PER_AREA} questions needed in ${area} before a percentage is meaningful.`,
  };
}

/**
 * Build the per-area sample state from responses already filtered to each area.
 *
 * Takes the filtered responses rather than the full response list so the caller
 * owns the grouping and this stays a pure function of what it is handed.
 */
export function sampleAreas(
  byArea: Readonly<Record<ReasoningArea, ReadonlyArray<{ readonly correct: boolean }>>>,
): readonly AreaSample[] {
  return REASONING_AREAS.map((area) => sampleFor(area, byArea[area]));
}

/** Turn a sample into the state the UI renders. */
export function areaStateFrom(sample: AreaSample): AreaState {
  if (!sample.sufficient) {
    return { status: "insufficient-data", message: sample.reason ?? "Not enough data yet." };
  }
  return { status: "sufficient-data", accuracy: sample.correct / sample.answered };
}

/** True when no area has enough data for a percentage. */
export function allAreasInsufficient(
  samples: ReadonlyArray<AreaSample>,
): boolean {
  return samples.every((sample) => !sample.sufficient);
}

/** True when at least one area has enough data. */
export function anyAreaSufficient(samples: ReadonlyArray<AreaSample>): boolean {
  return samples.some((sample) => sample.sufficient);
}
