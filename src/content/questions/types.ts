/**
 * The question content model (U8, KTD5).
 *
 * One question is one object: prompt, visual, answer choices, the answer key,
 * and the explanation steps that teach the rule. Nothing here is free-form, and
 * no visual is a `Record<string, unknown>` bag — every supported question type
 * has its own concrete visual payload so an explanation step can point at a
 * real element and a wrong reference is a type error rather than a surprise at
 * runtime (R24).
 *
 * The explanation is authored, not generated. `ExplanationStep.operation`
 * is a discriminated union precisely so that a step which reveals an answer has
 * no way to exist without naming the choice it reveals: that is the hook
 * `validateQuestion` uses to hold the explanation to the key (AE2).
 */

export const REASONING_CATEGORIES = ["nonverbal", "quantitative", "verbal"] as const;

/**
 * The reasoning areas the product scores and reports on. A diagnostic samples
 * these, and coverage claims are scoped to them (R9, R19).
 */
export type ReasoningCategory = (typeof REASONING_CATEGORIES)[number];

export const DIFFICULTIES = ["introductory", "developing", "advanced"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = [
  "figure-matrix",
  "figure-analogy",
  "classification",
  "number-series",
  "verbal-analogy",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* Figure vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/**
 * All three shapes point "up" in their natural orientation, so the same
 * quarter turn reads the same way in every cell of a puzzle.
 */
export const SHAPE_KINDS = ["triangle", "arrow", "chevron"] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number];

export const FILL_STYLES = ["outline", "striped", "solid"] as const;

export type FillStyle = (typeof FILL_STYLES)[number];

/** Quarter turns clockwise from the shape's natural, pointing-up orientation. */
export type QuarterTurns = 0 | 1 | 2 | 3;

export interface FigureGlyph {
  /** Id of this glyph as an element of the question's visual. */
  readonly glyphId: string;
  readonly shape: ShapeKind;
  readonly fill: FillStyle;
  readonly quarterTurns: QuarterTurns;
  /**
   * What a screen reader says for the picture. A picture answer choice has no
   * other name, so this is required content, not a caption.
   */
  readonly altText: string;
}

export type FigureTransform =
  | { readonly kind: "rotate"; readonly quarterTurns: QuarterTurns }
  | { readonly kind: "fill"; readonly fill: FillStyle };

/* -------------------------------------------------------------------------- */
/* Choices                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Choices carry no display label: the slot name ("A", "B", "C") is derived from
 * their order, so the same data cannot disagree with itself about how a choice
 * is named. Everything a choice needs is type-specific and below.
 */
export interface ChoiceBase {
  readonly id: string;
}

/** A picture answer. */
export interface FigureChoice extends ChoiceBase {
  readonly glyph: FigureGlyph;
}

/** A number answer. */
export interface NumberChoice extends ChoiceBase {
  readonly value: number;
}

/** A word answer. */
export interface WordChoice extends ChoiceBase {
  readonly text: string;
}

/* -------------------------------------------------------------------------- */
/* Explanation steps                                                          */
/* -------------------------------------------------------------------------- */

export interface ExplanationStepBase<State> {
  readonly id: string;
  readonly title?: string;
  /** What the child is told at this step. Never empty. */
  readonly narration: string;
  /** Element ids of the question's visual that this step points at. */
  readonly highlightIds: readonly string[];
  /** What the step does to the visual. Typed per question type. */
  readonly visualState: State;
}

/**
 * A reveal step is the only step that names an answer, and the type makes that
 * choice mandatory. `validateQuestion` compares every reveal against
 * `correctChoiceId`, so a question cannot ship an explanation that points at a
 * different choice than its key (AE2).
 */
export type ExplanationStep<State> =
  | (ExplanationStepBase<State> & {
      readonly operation: "orient" | "focus" | "transform" | "state-rule";
    })
  | (ExplanationStepBase<State> & {
      readonly operation: "reveal";
      readonly revealsChoiceId: string;
    });

/* -------------------------------------------------------------------------- */
/* Figure matrix                                                              */
/* -------------------------------------------------------------------------- */

export interface FigureMatrixCell {
  /** Id of the cell as an element of the question's visual. */
  readonly cellId: string;
  /** Null in the one empty cell the child has to solve for. */
  readonly glyph: FigureGlyph | null;
}

export interface FigureMatrixVisual {
  readonly rows: readonly (readonly FigureMatrixCell[])[];
  /** The empty cell, which must really be empty. */
  readonly missingCellId: string;
}

export type FigureMatrixVisualState =
  | { readonly kind: "none" }
  | { readonly kind: "focus"; readonly cellIds: readonly string[] }
  | {
      readonly kind: "transform";
      readonly cellId: string;
      readonly transform: FigureTransform;
    };

export interface FigureMatrixQuestion extends QuestionBase {
  readonly type: "figure-matrix";
  readonly visual: FigureMatrixVisual;
  readonly choices: readonly FigureChoice[];
  readonly correctChoiceId: string;
  readonly explanation: readonly ExplanationStep<FigureMatrixVisualState>[];
}

/* -------------------------------------------------------------------------- */
/* Figure analogy                                                             */
/* -------------------------------------------------------------------------- */

export interface AnalogyFigure {
  /** Id of the figure as an element of the question's visual. */
  readonly figureId: string;
  readonly glyph: FigureGlyph;
}

export interface FigureAnalogyVisual {
  /** The worked pair: A is to B. */
  readonly first: AnalogyFigure;
  readonly second: AnalogyFigure;
  /** The pair the child solves: C is to ?. */
  readonly third: AnalogyFigure;
}

export type FigureAnalogyVisualState =
  | { readonly kind: "none" }
  | { readonly kind: "focus"; readonly figureIds: readonly string[] }
  | {
      readonly kind: "transform";
      readonly figureId: string;
      readonly transform: FigureTransform;
    };

export interface FigureAnalogyQuestion extends QuestionBase {
  readonly type: "figure-analogy";
  readonly visual: FigureAnalogyVisual;
  readonly choices: readonly FigureChoice[];
  readonly correctChoiceId: string;
  readonly explanation: readonly ExplanationStep<FigureAnalogyVisualState>[];
}

/* -------------------------------------------------------------------------- */
/* Classification                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Classification is asked with words, with pictures, or both, so a group member
 * is one of two concrete shapes rather than an untyped value.
 */
export type ClassificationItem =
  | { readonly kind: "word"; readonly itemId: string; readonly text: string }
  | { readonly kind: "figure"; readonly itemId: string; readonly glyph: FigureGlyph };

export interface ClassificationVisual {
  readonly items: readonly ClassificationItem[];
}

export type ClassificationVisualState =
  | { readonly kind: "none" }
  | { readonly kind: "focus"; readonly itemIds: readonly string[] };

/** A choice points at a member of the group rather than repeating it. */
export interface ClassificationChoice extends ChoiceBase {
  readonly itemId: string;
}

export interface ClassificationQuestion extends QuestionBase {
  readonly type: "classification";
  readonly visual: ClassificationVisual;
  readonly choices: readonly ClassificationChoice[];
  readonly correctChoiceId: string;
  readonly explanation: readonly ExplanationStep<ClassificationVisualState>[];
}

/* -------------------------------------------------------------------------- */
/* Number series                                                              */
/* -------------------------------------------------------------------------- */

export interface SeriesTerm {
  /** Id of the term as an element of the question's visual. */
  readonly termId: string;
  /** Null in the one term the child has to work out. */
  readonly value: number | null;
}

export interface NumberSeriesVisual {
  readonly terms: readonly SeriesTerm[];
  /** The term left blank, which must be the only blank one. */
  readonly answerSlotId: string;
}

export type NumberSeriesVisualState =
  | { readonly kind: "none" }
  | { readonly kind: "focus"; readonly termIds: readonly string[] }
  | { readonly kind: "operation"; readonly operation: "double" | "add"; readonly operand: number };

export interface NumberSeriesQuestion extends QuestionBase {
  readonly type: "number-series";
  readonly visual: NumberSeriesVisual;
  readonly choices: readonly NumberChoice[];
  readonly correctChoiceId: string;
  readonly explanation: readonly ExplanationStep<NumberSeriesVisualState>[];
}

/* -------------------------------------------------------------------------- */
/* Verbal analogy                                                             */
/* -------------------------------------------------------------------------- */

export interface AnalogyWord {
  /** Id of the word as an element of the question's visual. */
  readonly termId: string;
  readonly word: string;
}

export interface VerbalAnalogyVisual {
  readonly first: AnalogyWord;
  readonly second: AnalogyWord;
  readonly third: AnalogyWord;
}

export type VerbalAnalogyVisualState =
  | { readonly kind: "none" }
  | { readonly kind: "focus"; readonly termIds: readonly string[] };

export interface VerbalAnalogyQuestion extends QuestionBase {
  readonly type: "verbal-analogy";
  readonly visual: VerbalAnalogyVisual;
  readonly choices: readonly WordChoice[];
  readonly correctChoiceId: string;
  readonly explanation: readonly ExplanationStep<VerbalAnalogyVisualState>[];
}

/* -------------------------------------------------------------------------- */
/* The question union                                                         */
/* -------------------------------------------------------------------------- */

export interface QuestionBase {
  readonly id: string;
  readonly reasoningCategory: ReasoningCategory;
  readonly difficulty: Difficulty;
  readonly prompt: string;
}

/**
 * Questions discriminate on `type`, so a consumer narrows with a plain
 * `question.type === "figure-matrix"` check and gets the matching visual type.
 */
export type Question =
  | FigureMatrixQuestion
  | FigureAnalogyQuestion
  | ClassificationQuestion
  | NumberSeriesQuestion
  | VerbalAnalogyQuestion;