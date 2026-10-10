/**
 * Determines the next action recommendation based on practice session results.
 * This is a deterministic, documented rule — never a model or AI prediction
 * (per R19, KTD10). Same responses always produce the same recommendation.
 */

/** Per-reasoning-area practice counts */
export type AreaCounts = {
  nonverbal: number;
  quantitative: number;
  verbal: number;
};

/** Summary of a practice session */
export type ResultsSummary = {
  totalQuestions: number;
  correct: number;
  accuracy: number;
  areaCounts: AreaCounts;
  /** True if the session had enough data for a meaningful recommendation */
  hasSufficientData: boolean;
};

/** The suggestion shown in the Results UI */
export type NextAction = {
  /** Plain-language insight based on the results */
  insight: string;
  /** Action label for the call-to-action button */
  label: string;
  /** Route to navigate to, or null for none */
  route: string | null;
};

/** Calculate results from raw practice responses */
export function calculateResults(
  responses: ReadonlyArray<{ selectedChoiceId: string; correct: boolean }>,
): ResultsSummary {
  const total = responses.length;
  const correctCount = responses.filter((r) => r.correct).length;
  const accuracy = total > 0 ? correctCount / total : 0;

  // Area counts — simplified: distribute correct answers across areas
  const areaCounts: AreaCounts = {
    nonverbal: 0,
    quantitative: 0,
    verbal: 0,
  };

  // Simple heuristic: first third nonverbal, second third quantitative, last third verbal
  const third = Math.floor(total / 3);
  for (let i = 0; i < total; i++) {
    if (i < third) areaCounts.nonverbal++;
    else if (i < third * 2) areaCounts.quantitative++;
    else areaCounts.verbal++;
  }

  // Only consider it sufficient data if we have at least 3 questions
  // and the child answered at least one question per area
  const minPerArea = 1;
  const hasSufficientData =
    total >= 3 &&
    areaCounts.nonverbal >= minPerArea &&
    areaCounts.quantitative >= minPerArea &&
    areaCounts.verbal >= minPerArea;

  return {
    totalQuestions: total,
    correct: correctCount,
    accuracy: accuracy,
    areaCounts,
    hasSufficientData,
  };
}

/** Derive the next action from results — deterministic, never AI-generated */
export function getNextAction(
  total: number,
  correct: number,
  goals: ReadonlyArray<string>,
): NextAction {
  const results = calculateResults([
      { selectedChoiceId: "a", correct: correct > 0 },
    ] as readonly { selectedChoiceId: string; correct: boolean }[],
  );

  // If insufficient data, show "not enough yet" message
  if (!results.hasSufficientData) {
    return {
      insight: "Keep practicing! More sessions build stronger reasoning skills.",
      label: "Practice More",
      route: "/practice",
    };
  }

  // Determine the recommended next action based on performance
  const highPerformers = goals.includes("prepare_assessment");
  const buildConfidence = goals.includes("build_confidence");

  let insight: string;
  let label: string;
  let route: string | null;

  if (results.accuracy >= 0.8) {
    insight = "You're demonstrating strong reasoning skills — keep challenging yourself with more complex problems.";
    label = "Try Advanced Problems";
    route = "/practice?difficulty=advanced";
  } else if (results.accuracy >= 0.5) {
    insight = "You're building reasonable reasoning skills — consistent practice will strengthen them further.";
    label = "Continue Practicing";
    route = "/practice";
  } else {
    insight = "Every expert was once a beginner — keep practicing at your own pace.";
    label = "Start with Basics";
    route = "/practice?difficulty=introductory";
  }

  // If the parent indicated test prep, steer toward assessment-focused practice
  if (highPerformers && goals.length > 0) {
    route = "/practice?assessment=prep";
  }

  return { insight, label, route };
}