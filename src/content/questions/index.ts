/**
 * The shipped question corpus (U8).
 *
 * Content is data, and data is only accepted once `validateQuestion` and
 * `validateCorpusCoverage` agree with it — those checks run over this exact
 * list in `index.test.ts`, which is part of `npm test` (KTD5, AE2).
 */
import { classificationQuestions } from "./classification";
import { figureAnalogyQuestions } from "./figureAnalogy";
import { figureMatrixQuestions } from "./figureMatrix";
import { numberSeriesQuestions } from "./numberSeries";
import type { Question, ReasoningCategory } from "./types";
import { verbalAnalogyQuestions } from "./verbalAnalogy";

/**
 * The reasoning areas the product claims coverage for at launch. A coverage
 * claim may only name a category the corpus can actually back up, so this list
 * and `questions` are checked against each other rather than trusted (R9).
 */
export const claimedReasoningCategories: readonly ReasoningCategory[] = [
  "nonverbal",
  "quantitative",
  "verbal",
];

export const questions: readonly Question[] = [
  ...figureMatrixQuestions,
  ...figureAnalogyQuestions,
  ...classificationQuestions,
  ...numberSeriesQuestions,
  ...verbalAnalogyQuestions,
];

export * from "./types";