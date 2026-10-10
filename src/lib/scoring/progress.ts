/**
 * Progress calculator — computes activity and per-area performance from stored
 * responses on read. No denormalized counters that can drift from source data
 * (R28).
 */

/** Progress state derived from stored session diagnostics */
export type ProgressState = {
  sessionCount: number;
  totalQuestions: number;
  areaAccuracy: {
    nonverbal: number;
    quantitative: number;
    verbal: number;
  };
  areaDataSufficiency: {
    nonverbal: boolean;
    quantitative: boolean;
    verbal: boolean;
  };
  lastDiagnostic:
    | {
        totalQuestions: number;
        correct: number;
        accuracy: number;
        areaCounts: {
          nonverbal: number;
          quantitative: number;
          verbal: number;
        };
        hasSufficientData: boolean;
        insufficientReason?: string;
      } | undefined;
};

/** Compute progress state from an array of diagnostic results. */
export function computeProgressFromDiagnostics(
  diagnostics: ReadonlyArray<{
    totalQuestions: number;
    correct: number;
    areaCounts: {
      nonverbal: number;
      quantitative: number;
      verbal: number;
    };
    hasSufficientData: boolean;
    insufficientReason?: string;
  }>,
): ProgressState {
  var sessionCount = diagnostics.length;
  var totalQuestions = 0;

  // Per-area correct counts and total opportunities
  var nonverbalCorrect = 0;
  var quantitativeCorrect = 0;
  var verbalCorrect = 0;
  var nonverbalTotal = 0;
  var quantitativeTotal = 0;
  var verbalTotal = 0;

  for (var i = 0; i < diagnostics.length; i++) {
    var d = diagnostics[i];
    if (d === undefined || d === null) continue;
    totalQuestions += d.totalQuestions;

    // Each diagnostic samples ~3 questions per area
    nonverbalTotal += 3;
    quantitativeTotal += 3;
    verbalTotal += 3;

    nonverbalCorrect += d.areaCounts.nonverbal;
    quantitativeCorrect += d.areaCounts.quantitative;
    verbalCorrect += d.areaCounts.verbal;
  }

  var areaAccuracy = {
    nonverbal: nonverbalTotal > 0 ? (nonverbalCorrect / nonverbalTotal) * 100 : 0,
    quantitative:
      quantitativeTotal > 0 ? (quantitativeCorrect / quantitativeTotal) * 100 : 0,
    verbal:
      verbalTotal > 0 ? (verbalCorrect / verbalTotal) * 100 : 0,
  };

  var areaDataSufficiency = {
    nonverbal: diagnostics.length >= 1,
    quantitative: diagnostics.length >= 1,
    verbal: diagnostics.length >= 1,
  };

  var lastDiagnostic:
    | {
        totalQuestions: number;
        correct: number;
        accuracy: number;
        areaCounts: {
          nonverbal: number;
          quantitative: number;
          verbal: number;
        };
        hasSufficientData: boolean;
        insufficientReason?: string;
      }
    | undefined;

  if (diagnostics.length > 0) {
    lastDiagnostic = {
      totalQuestions: diagnostics[diagnostics.length - 1].totalQuestions,
      correct: diagnostics[diagnostics.length - 1].correct,
      accuracy:
        diagnostics[diagnostics.length - 1].totalQuestions > 0
          ? diagnostics[diagnostics.length - 1].correct /
            diagnostics[diagnostics.length - 1].totalQuestions
          : 0,
      areaCounts: diagnostics[diagnostics.length - 1].areaCounts,
      hasSufficientData: diagnostics[diagnostics.length - 1].hasSufficientData === true,
      insufficientReason: diagnostics[diagnostics.length - 1].insufficientReason,
    };
  } else {
    lastDiagnostic = undefined;
  }

  return {
    sessionCount: sessionCount,
    totalQuestions: totalQuestions,
    areaAccuracy: areaAccuracy,
    areaDataSufficiency: areaDataSufficiency,
    lastDiagnostic: lastDiagnostic,
  } as ProgressState;
}

/** Checks whether a diagnostic result represents insufficient data */
export function isInsufficient(
  diag: { hasSufficientData: boolean },
): diag is { hasSufficientData: false } {
  return diag.hasSufficientData === false;
}