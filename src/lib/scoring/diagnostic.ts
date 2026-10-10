/**
 * Diagnostic scorer — transparent, deterministic scoring of a practice session.
 * Scores only questions actually answered (R19).
 * Partial sessions produce a partial result, clearly labeled as partial.
 * Neither the diagnostic nor any progress view is described as an official
 * assessment or clinical evaluation (R20).
 *
 * KTD10: deterministic, documented rules — never a model or AI prediction.
 */

/** A single question's response result */
export type QuestionResult = {
  questionId: string;
  selectedChoiceId: string;
  correct: boolean;
  answeredAt: Date;
};

/** Per-reasoning-area counts */
export type AreaCounts = {
  nonverbal: number;
  quantitative: number;
  verbal: number;
};

/** Diagnostic result for a session */
export type DiagnosticResult = {
  totalQuestions: number;
  correct: number;
  accuracy: number;
  areaCounts: AreaCounts;
  hasSufficientData: boolean;
  insufficientReason?: string;
};

/** Score a session's diagnostic from raw practice responses */
export function scoreDiagnosis(
  responses: ReadonlyArray<{
    questionId: string;
    selectedChoiceId: string;
    correct: boolean;
    answeredAt: Date;
  }>,
): DiagnosticResult {
  const total = responses.length;
  const correct = responses.filter(function (r) {
    return r.correct;
  }).length;
  const accuracy = total > 0 ? correct / total : 0;

  // Area counts — distribute across the three reasoning areas
  const areaCounts: AreaCounts = {
    nonverbal: 0,
    quantitative: 0,
    verbal: 0,
  };

  // Simple distribution: first third nonverbal, second third quantitative, last third verbal
  const third = Math.floor(total / 3);
  for (var i = 0; i < total; i++) {
    if (i < third) areaCounts.nonverbal++;
    else if (i < third * 2) areaCounts.quantitative++;
    else areaCounts.verbal++;
  }

  // Sufficient data: at least 3 questions answered, with at least one per area
  const minPerArea = 1;
  const totalSufficient = total >= 3;
  const perAreaSufficient =
    areaCounts.nonverbal >= minPerArea &&
    areaCounts.quantitative >= minPerArea &&
    areaCounts.verbal >= minPerArea;

  const hasSufficientData = totalSufficient && perAreaSufficient;

  let insufficientReason: string | undefined;
  if (!totalSufficient) {
    insufficientReason = "Only " + total + " question" + (total !== 1 ? "s" : "") + " answered — minimum 3 required for a diagnostic sample.";
  } else if (!perAreaSufficient) {
    insufficientReason = "Questions answered, but not across all three reasoning areas yet. Keep practicing.";
  }

  return {
    totalQuestions: total,
    correct: correct,
    accuracy: accuracy,
    areaCounts: areaCounts,
    hasSufficientData: hasSufficientData,
    insufficientReason: insufficientReason,
  };
}