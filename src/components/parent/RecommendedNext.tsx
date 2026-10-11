/**
 * The recommended next practice (U14, R26).
 *
 * Exactly one. The results screen makes the same promise and the plan holds both
 * to it: a dashboard offering three equally-weighted suggestions is a dashboard
 * offering no recommendation, and a parent has to make the decision the product
 * exists to help them make.
 *
 * The recommendation is rendered as prose rather than as a bare difficulty
 * label, because "developing" means nothing to a parent who did not choose it.
 * The sentence says why, and that is the part that can be acted on.
 */
import Link from "next/link";
import type { PracticeRecommendation } from "@/lib/scoring/diagnosticRules";

export interface RecommendedNextProps {
  readonly recommendation: PracticeRecommendation | null;
}

export function RecommendedNext({ recommendation }: RecommendedNextProps) {
  if (!recommendation) return null;

  const areas = recommendation.focusAreas.join(", ");
  const params = new URLSearchParams({
    areas,
    difficulty: recommendation.startingDifficulty,
  });

  return (
    <section className="parent-recommended" aria-labelledby="recommended-heading">
      <h2 id="recommended-heading">What to do next</h2>
      <p>{recommendation.rationale}</p>
      <Link className="button button--primary" href={`/practice?${params.toString()}`}>
        {recommendation.startingDifficulty === "advanced"
          ? "Try harder problems"
          : recommendation.startingDifficulty === "developing"
            ? "Keep practising"
            : "Start with the basics"}
      </Link>
    </section>
  );
}
