/**
 * The single recommended next action shown on the results screen (R26).
 *
 * This is a thin presentation layer over U13's `recommendPractice`: the rules
 * live there, documented, and this module only turns a recommendation into the
 * copy and the link the results page renders. Keeping the judgement in one place
 * is what stops the results screen and the parent dashboard from disagreeing
 * about what the child should do next.
 */
import { scoreSession } from "./diagnostic";
import type { ScoredResponse } from "./diagnostic";
import { recommendPractice } from "./diagnosticRules";

export type NextAction = {
  /** One plain-language sentence for the parent. */
  readonly insight: string;
  /** Button label. */
  readonly label: string;
  /** Where the button goes. */
  readonly href: string;
};

const DIFFICULTY_LABELS = {
  introductory: "Start with the basics",
  developing: "Keep practising",
  advanced: "Try harder problems",
} as const;

/**
 * Derive the next action from a session's responses.
 *
 * Deterministic: the same responses always produce the same action. The link
 * carries the recommended areas and difficulty as query parameters so the
 * practice surface can act on the recommendation without re-deriving it.
 */
export function getNextAction(
  responses: readonly ScoredResponse[],
): NextAction {
  const diagnostic = scoreSession(responses);
  const recommendation = recommendPractice(diagnostic);
  const params = new URLSearchParams({
    areas: recommendation.focusAreas.join(","),
    difficulty: recommendation.startingDifficulty,
  });

  return {
    insight: recommendation.rationale,
    label: DIFFICULTY_LABELS[recommendation.startingDifficulty],
    href: `/practice?${params.toString()}`,
  };
}
