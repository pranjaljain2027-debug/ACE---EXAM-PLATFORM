/**
 * Insufficient data state — defines the minimum sample per area; below it, the
 * API returns "not enough data yet," which the UI renders distinctly from low
 * performance (R28, AE3).
 *
 * UI rule: never render a zeroed chart or a low score when data is insufficient.
 * Always show a distinct "not enough data yet" state.
 */

/** Minimum number of questions per reasoning area for a diagnostic sample */
export var MIN_SAMPLE_PER_AREA = 1;

/** Checks whether a diagnostic result has insufficient data */
export function hasInsufficientData(
  diag: { hasSufficientData: boolean },
): diag is { hasSufficientData: false } {
  return diag.hasSufficientData === false;
}

/** Generates the "not enough data yet" state object for UI rendering */
export function createInsufficientDataState(): {
  hasSufficientData: false;
  insufficientReason: string;
  displayMessage: string,
} {
  return {
    hasSufficientData: false,
    insufficientReason:
      "Answer at least " +
        MIN_SAMPLE_PER_AREA +
        " question per reasoning area (nonverbal, quantitative, verbal) to see a diagnostic sample.",
    displayMessage:
      "Not enough data yet — keep practicing to build a clearer picture of reasoning strengths.",
  };
}