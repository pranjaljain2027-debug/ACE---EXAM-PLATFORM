/**
 * Diagnostic rules — deterministic, documented mappings from per-category outcomes
 * to recommended practice mix. Every rule carries a comment explaining the
 * reasoning (spec §10.3). This is the code the spec requires to be documented
 * rather than hidden.
 *
 * KTD10: no model calls, no AI predictions. Same inputs → same outputs.
 */

/** Maps per-area correct counts to a recommended practice mix. */
export type RulesOutput = {
  /** Insight string shown to the parent */
  insight: string;
  /** Suggested practice label */
  label: string;
  /** Suggested route */
  route: string | null;
};

/** Apply deterministic diagnostic rules to per-area correct counts.
 * Rules are explicit and documented — not hidden behind a model.
 */
export function applyDiagnosticRules(
  nonverbalCorrect: number,
  quantitativeCorrect: number,
  verbalCorrect: number,
  totalPerArea: {
    nonverbal: number;
    quantitative: number;
    verbal: number;
  },
  goals: ReadonlyArray<string>,
): RulesOutput {
  // Calculate accuracies per area
  const nonverbalAcc = totalPerArea.nonverbal > 0 ? nonverbalCorrect / totalPerArea.nonverbal : 0;
  const quantitativeAcc = totalPerArea.quantitative > 0 ? quantitativeCorrect / totalPerArea.quantitative : 0;
  const verbalAcc = totalPerArea.verbal > 0 ? verbalCorrect / totalPerArea.verbal : 0;

  // Overall accuracy across all areas
  const totalCorrect = nonverbalCorrect + quantitativeCorrect + verbalCorrect;
  const totalPerAreaTotal =
    totalPerArea.nonverbal + totalPerArea.quantitative + totalPerArea.verbal;
  const overallAcc = totalPerAreaTotal > 0 ? totalCorrect / totalPerAreaTotal : 0;

  // Rule 1: If any area has very low accuracy, focus on that area
  // If nonverbal is much lower than other areas, the child may struggle with spatial reasoning
  if (nonverbalAcc < 0.3 && quantitativeAcc >= 0.5 && verbalAcc >= 0.5) {
    return {
      insight:
        "Nonverbal reasoning needs practice — try more shape-and-pattern problems.",
      label: "Focus on Nonverbal",
      route: "/practice?area=nonverbal",
    };
  }

  // Rule 2: If verbal is the strongest area, encourage verbal reasoning
  if (verbalAcc >= 0.7 && nonverbalAcc < 0.5 && quantitativeAcc < 0.5) {
    return {
      insight:
        "Verbal reasoning is strong — encourage reading-based problem solving.",
      label: "Strengthen Verbal",
      route: "/practice?area=verbal",
    };
  }

  // Rule 3: If quantitative is the weakest area, focus on number problems
  if (quantitativeAcc < 0.3 && nonverbalAcc >= 0.3 && verbalAcc >= 0.3) {
    return {
      insight:
        "Quantitative reasoning needs practice — try more number sequence problems.",
      label: "Focus on Quantitative",
      route: "/practice?area=quantitative",
    };
  }

  // Rule 4: Balanced performance across all areas — general practice
  if (
    nonverbalAcc >= 0.5 &&
    quantitativeAcc >= 0.5 &&
    verbalAcc >= 0.5
  ) {
    return {
      insight:
        "Balanced performance across all reasoning areas — maintain with mixed practice.",
      label: "Mixed Practice",
      route: "/practice",
    };
  }

  // Rule 5: Default — mixed practice for general improvement
  return {
    insight:
      "Mixed practice across reasoning areas supports well-rounded development.",
    label: "Mixed Practice",
    route: "/practice",
  };
}