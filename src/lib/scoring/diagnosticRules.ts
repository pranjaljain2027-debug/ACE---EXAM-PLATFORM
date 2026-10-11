/**
 * Diagnostic rules — the recommended practice mix derived from a diagnostic
 * result (spec §10.3).
 *
 * These rules are explicit, readable, and deterministic. The spec requires
 * this code to be documented rather than hidden, so every rule carries a comment
 * explaining why it exists and what it recommends. There is no model call and
 * no machine-learned component anywhere in this path (KTD10, R19): the same
 * diagnostic always produces the same recommendation, which is what makes the
 * recommendation auditable by a parent who asks "why did it say that?"
 *
 * Nothing here describes an official assessment or a clinical evaluation (R20).
 */
import { MIN_RESPONSES_PER_AREA } from "./insufficientData";
import type { ReasoningArea } from "./insufficientData";
import type { DiagnosticResult } from "./diagnostic";
import { sufficientAccuracies } from "./diagnostic";

/** What the child should practise next, and why. */
export type PracticeRecommendation = {
  /** The areas to weight practice toward. */
  readonly focusAreas: readonly ReasoningArea[];
  /** One sentence, safe to show a parent verbatim. */
  readonly rationale: string;
  /** Suggested starting difficulty. */
  readonly startingDifficulty: "introductory" | "developing" | "advanced";
};

/**
 * A single area is "weak" below this proportion of correct answers.
 *
 * Why 0.6 rather than 0.5: with three to six answers per area, a proportion
 * below 0.6 means the child is more often wrong than right in that area, which
 * is the point where adding more of the same practice stops being useful. At
 * exactly 0.5 the signal is too noisy to act on from so few questions.
 */
const WEAK_THRESHOLD = 0.6;

/**
 * The whole sample is "strong" at or above this proportion.
 *
 * Why 0.8: at this level the child is answering most questions correctly
 * across every area, so the useful next step is more difficulty rather than
 * more repetition of material already understood.
 */
const STRONG_THRESHOLD = 0.8;

/** Per-area accuracy, honouring the insufficient-data threshold. */
function accuraciesByArea(
  result: DiagnosticResult,
): ReadonlyMap<ReasoningArea, number> {
  const map = new Map<ReasoningArea, number>();
  for (const entry of sufficientAccuracies(result)) {
    map.set(entry.area, entry.accuracy);
  }
  return map;
}

/**
 * Rule 1 — insufficient data.
 *
 * If no area has enough answers, there is nothing to act on. Recommending
 * practice from three questions would be a guess presented as guidance, which
 * is exactly what R28 rules out. This rule fires before any judgement about
 * strength, because an area that was never assessed cannot be called weak.
 */
function ruleInsufficientData(result: DiagnosticResult): PracticeRecommendation | null {
  const accuracies = accuraciesByArea(result);
  if (accuracies.size === 0) {
    return {
      focusAreas: ["nonverbal", "quantitative", "verbal"],
      rationale: `Not enough practice data yet. Answer at least ${MIN_RESPONSES_PER_AREA} questions in each reasoning area before a focused recommendation is meaningful.`,
      startingDifficulty: "introductory",
    };
  }
  return null;
}

/**
 * Rule 2 — strong across every assessed area.
 *
 * When the child is at or above the strong threshold everywhere there is data,
 * more of the same questions teaches nothing. Step difficulty up instead.
 */
function ruleStrongEverywhere(accuracies: ReadonlyMap<ReasoningArea, number>): PracticeRecommendation | null {
  if (accuracies.size === 0) return null;

  const allStrong = [...accuracies.values()].every(
    (accuracy) => accuracy >= STRONG_THRESHOLD,
  );
  if (!allStrong) return null;

  const areas = [...accuracies.keys()];
  return {
    focusAreas: areas,
    rationale:
      "Answers are consistently correct across the areas practised so far, so the next step is more difficulty rather than more of the same questions.",
    startingDifficulty: "advanced",
  };
}

/**
 * Rule 3 — one weak area.
 *
 * When a single area falls below the weak threshold and the others are
 * comfortably above it, the useful response is targeted practice on that area.
 * The rationale names the area so the parent can see the rule's reasoning
 * rather than being handed an unexplained recommendation.
 */
function ruleSingleWeakArea(
  accuracies: ReadonlyMap<ReasoningArea, number>,
): PracticeRecommendation | null {
  const weak = [...accuracies.entries()].filter(
    ([, accuracy]) => accuracy < WEAK_THRESHOLD,
  );
  if (weak.length !== 1) return null;

  const [weakEntry] = weak;
  if (!weakEntry) return null;

  const [weakArea] = weakEntry;
  const others = [...accuracies.entries()].filter(
    ([area]) => area !== weakArea,
  );
  const othersSolid =
    others.length === 0 ||
    others.every(([, accuracy]) => accuracy >= WEAK_THRESHOLD);
  if (!othersSolid) return null;

  return {
    focusAreas: [weakArea],
    rationale: `${weakArea} reasoning is below the level of the other areas practised so far, so this is where extra practice will help most.`,
    startingDifficulty: "introductory",
  };
}

/**
 * Rule 4 — several weak areas.
 *
 * More than one area below the threshold means the child needs broad
 * foundational practice rather than a targeted fix, so the recommendation
 * covers every weak area instead of picking one.
 */
function ruleMultipleWeakAreas(
  accuracies: ReadonlyMap<ReasoningArea, number>,
): PracticeRecommendation | null {
  const weak = [...accuracies.entries()].filter(
    ([, accuracy]) => accuracy < WEAK_THRESHOLD,
  );
  if (weak.length < 2) return null;

  return {
    focusAreas: weak.map(([area]) => area),
    rationale:
      "Several reasoning areas are below the level where extra practice helps, so foundational practice across these areas is the useful next step.",
    startingDifficulty: "introductory",
  };
}

/**
 * Rule 5 — the default.
 *
 * Everything else: some areas weak, some strong, or a single mid-range area.
 * Recommend keeping a balanced mix across all assessed areas. This is the
 * fallback rather than a dead branch — it is what a typical mixed session
 * produces, so it needs to be a sensible answer, not a catch-all.
 */
function ruleBalancedMix(
  accuracies: ReadonlyMap<ReasoningArea, number>,
): PracticeRecommendation {
  return {
    focusAreas: accuracies.size > 0 ? [...accuracies.keys()] : ["nonverbal", "quantitative", "verbal"],
    rationale:
      "Performance across the areas practised so far is mixed, so a balanced mix keeps developing each one.",
    startingDifficulty: "developing",
  };
}

/**
 * Derive the recommended practice mix from a diagnostic result.
 *
 * Total and deterministic: every input produces exactly one recommendation, and
 * rules are evaluated in a fixed order so the same result always takes the same
 * path through them.
 */
export function recommendPractice(result: DiagnosticResult): PracticeRecommendation {
  const insufficient = ruleInsufficientData(result);
  if (insufficient) return insufficient;

  const accuracies = accuraciesByArea(result);

  const strong = ruleStrongEverywhere(accuracies);
  if (strong) return strong;

  const singleWeak = ruleSingleWeakArea(accuracies);
  if (singleWeak) return singleWeak;

  const multipleWeak = ruleMultipleWeakAreas(accuracies);
  if (multipleWeak) return multipleWeak;

  return ruleBalancedMix(accuracies);
}
