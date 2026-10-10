"use client";

/**
 * The explanation player's state machine (U5, R8).
 *
 *   idle ──select──▶ selected ──submit──▶ submitted ──▶ revealed(step 0)
 *     ▲                 │                     │                │  next/prev
 *     │                 │ (the landing demo   │                ▼
 *     │                 │  enters submitted   │          steps[n-1]  (the rule)
 *     │                 │  directly)          │                │ continue/skip
 *     └───── replay/reset◀────────────────────────────────────────────┘
 *
 * `submitMode: "direct"` is the landing demo, where a visitor should not have
 * to confirm a choice. `submitMode: "explicit"` keeps the `selected` phase and
 * its confirm control for a session, so this player is not structurally
 * incapable of the two-step flow — the unit that needs it only changes the
 * mode.
 *
 * Feedback is derived from the board, not written per choice. A figure-matrix
 * question carries no per-choice copy, so the specific thing to look at again
 * is worked out from what the chosen picture got wrong and what the board
 * keeps constant. That is what makes the feedback specific for any question
 * rather than only for the one authored with it, and it is why feedback can
 * never contradict the explanation: both read the same visual.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type {
  ExplanationStep,
  FigureMatrixQuestion,
  FigureMatrixVisualState,
  FillStyle,
  ShapeKind,
} from "@/content/questions/types";

export type ExplanationPhase = "idle" | "selected" | "submitted" | "revealed";

/**
 * `direct` commits an answer as soon as it is chosen (the landing demo).
 * `explicit` waits for the confirm control (a session).
 */
export type SubmitMode = "direct" | "explicit";

export interface ExplanationFeedback {
  readonly correct: boolean;
  /** A short, neutral verdict. Never the only thing the visitor is told. */
  readonly headline: string;
  /** The specific thing to look at, in the question's own vocabulary. */
  readonly detail: string;
}

export interface UseExplanationOptions {
  readonly question: FigureMatrixQuestion;
  readonly submitMode: SubmitMode;
  /** Fired when the last explanation step is reached, never before. */
  readonly onExplanationViewed?: () => void;
}

export interface ExplanationController {
  readonly phase: ExplanationPhase;
  readonly stepCount: number;
  readonly stepIndex: number;
  readonly step: ExplanationStep<FigureMatrixVisualState> | null;
  /** The committed answer, which is what the feedback is about. */
  readonly committedChoiceId: string | null;
  /** The choice made but not yet committed, in explicit submit mode. */
  readonly pendingChoiceId: string | null;
  /** The answer the key names, so the reveal step can name it too. */
  readonly correctChoiceId: string;
  /**
   * Increments every time the explanation is entered or replayed. It is the
   * signal to move focus into the step panel — which happens on entry, not on
   * every step, so a visitor paging with the buttons is not dragged away.
   */
  readonly revealEntry: number;
  readonly isCorrect: boolean;
  readonly feedback: ExplanationFeedback | null;
  readonly visualState: FigureMatrixVisualState;
  /** True while the explanation is showing, which is when the answer group goes inert. */
  readonly explaining: boolean;
  select(choiceId: string): void;
  submit(): void;
  beginExplanation(): void;
  nextStep(): void;
  previousStep(): void;
  goToStep(index: number): void;
  replay(): void;
  reset(): void;
}

/* -------------------------------------------------------------------------- */
/* Reading the board                                                          */
/* -------------------------------------------------------------------------- */

interface BoardReading {
  /** The shape every filled figure shares, if there is one. */
  readonly shape: ShapeKind | null;
  /** The filling every filled figure shares, if there is one. */
  readonly fill: FillStyle | null;
  /** Where to send a visitor who has not spotted the pattern yet. */
  readonly look: string;
  /** What the figures in that line do as the eye moves along it. */
  readonly movement: string;
}

function missingCellPosition(
  question: FigureMatrixQuestion,
): { rowIndex: number; columnIndex: number } | null {
  for (const [rowIndex, row] of question.visual.rows.entries()) {
    const columnIndex = row.findIndex((cell) => cell.cellId === question.visual.missingCellId);
    if (columnIndex >= 0) {
      return { rowIndex, columnIndex };
    }
  }
  return null;
}

/**
 * The turn from one filled figure to the next along a line, in quarter turns
 * clockwise. Read from figures that are actually on the board rather than
 * assumed, so a board with a different rule still describes itself.
 */
function stepAlong(
  turns: readonly (number | null)[],
  fromIndex: number,
): number | null {
  for (let index = fromIndex - 2; index >= 0; index -= 1) {
    const before = turns[index];
    const after = turns[index + 1];
    if (before !== null && before !== undefined && after !== null && after !== undefined) {
      return (after - before + 4) % 4;
    }
  }
  return null;
}

function describeStep(step: number | null): string | null {
  switch (step) {
    case 1:
      return "one quarter turn clockwise";
    case 2:
      return "half a turn";
    case 3:
      return "one quarter turn anticlockwise";
    default:
      return null;
  }
}

function readBoard(question: FigureMatrixQuestion): BoardReading {
  const filled = question.visual.rows.flatMap((row) =>
    row.flatMap((cell) => (cell.glyph === null ? [] : [cell.glyph])),
  );
  const first = filled[0];
  const shape =
    first !== undefined && filled.every((glyph) => glyph.shape === first.shape)
      ? first.shape
      : null;
  const fill =
    first !== undefined && filled.every((glyph) => glyph.fill === first.fill) ? first.fill : null;

  const position = missingCellPosition(question);
  if (position === null) {
    return {
      shape,
      fill,
      look: "look along the row and down the column that meet at the empty space",
      movement: "each figure is the same",
    };
  }

  const { rowIndex, columnIndex } = position;
  const row = question.visual.rows[rowIndex] ?? [];
  const column = question.visual.rows.map((line) => line[columnIndex]);
  const rowStep = stepAlong(
    row.map((cell) => cell?.glyph?.quarterTurns ?? null),
    columnIndex,
  );
  const columnStep = stepAlong(
    column.map((cell) => cell?.glyph?.quarterTurns ?? null),
    rowIndex,
  );

  // Prefer the row when it shows the step; otherwise fall back to the column.
  const alongRow = rowStep !== null;
  const line = alongRow ? `row ${rowIndex + 1}` : `column ${columnIndex + 1}`;
  const direction = alongRow ? "from left to right" : "from top to bottom";
  const step = describeStep(alongRow ? rowStep : columnStep);
  const noun = shape === null ? "figure" : shape;

  return {
    shape,
    fill,
    look: `read ${line} ${direction}`,
    movement:
      step === null
        ? `every ${noun} in it is the same`
        : `each ${noun} turns ${step} as it goes`,
  };
}

/* -------------------------------------------------------------------------- */
/* Feedback                                                                   */
/* -------------------------------------------------------------------------- */

const FILL_DESCRIPTION: Record<FillStyle, string> = {
  outline: "drawn with an outline only",
  striped: "drawn with stripes",
  solid: "filled in solid",
};

/**
 * What the visitor got wrong, named from the board itself. Exactly one thing is
 * raised, so a wrong answer shows which rule was missed rather than listing
 * everything that could have been.
 *
 * Returns null when the committed id names no choice: there is then nothing
 * true to tell the visitor, and a guess would be worse than silence.
 */
function buildFeedback(
  question: FigureMatrixQuestion,
  selectedChoiceId: string,
): ExplanationFeedback | null {
  const choice = question.choices.find((entry) => entry.id === selectedChoiceId);
  if (choice === undefined) {
    return null;
  }

  const board = readBoard(question);
  const line = `${capitalise(board.look)}, and watch how ${board.movement}.`;

  if (selectedChoiceId === question.correctChoiceId) {
    return {
      correct: true,
      headline: "You found it.",
      detail: `${line} That is the pattern that finishes the board.`,
    };
  }

  if (board.shape !== null && choice.glyph.shape !== board.shape) {
    return {
      correct: false,
      headline: "Not this time.",
      detail: `Every picture on this board is the same ${board.shape} shape, so the answer has to have that shape too.`,
    };
  }

  if (board.fill !== null && choice.glyph.fill !== board.fill) {
    return {
      correct: false,
      headline: "Not this time.",
      detail: `Every picture on this board is ${FILL_DESCRIPTION[board.fill]} — nothing here is ever ${alternativeFill(board.fill)}. The shape is right, so the filling is the part to check.`,
    };
  }

  return {
    correct: false,
    headline: "Not this time.",
    detail: `The shape and the filling are right, so what is left is the direction. ${line}`,
  };
}

/**
 * The opposite of a filling, for "nothing here is ever ___". Reads as a phrase
 * rather than a fill name: "nothing here is ever filled in".
 */
function alternativeFill(fill: FillStyle): string {
  switch (fill) {
    case "outline":
      return "filled in";
    case "striped":
      return "plain";
    case "solid":
      return "left as an outline";
  }
}

function capitalise(text: string): string {
  return text.length === 0 ? text : `${text[0]?.toUpperCase() ?? ""}${text.slice(1)}`;
}

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reads `prefers-reduced-motion` as the external system it is, and keeps
 * reading it: a visitor can change the setting while the page is open.
 * jsdom never evaluates the query, so `matchMedia` may be absent — the
 * animated path is then the default, which is also what the stylesheet assumes
 * before hydration.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function reducedMotionQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = reducedMotionQuery();
  if (query === null) {
    return () => {};
  }
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  return reducedMotionQuery()?.matches ?? false;
}

export function usePrefersReducedMotion(): boolean {
  // The server has no way to know the setting, so the first paint is the
  // animated path and the stored stylesheet zeroes its duration until this
  // resolves.
  return useSyncExternalStore(subscribeToReducedMotion, readReducedMotion, () => false);
}

/* -------------------------------------------------------------------------- */
/* The machine                                                                */
/* -------------------------------------------------------------------------- */

const IDLE_STATE = {
  pendingChoiceId: null,
  committedChoiceId: null,
  stepIndex: 0,
};

export function useExplanation({
  question,
  submitMode,
  onExplanationViewed,
}: UseExplanationOptions): ExplanationController {
  const [phase, setPhase] = useState<ExplanationPhase>("idle");
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [committedChoiceId, setCommittedChoiceId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealEntry, setRevealEntry] = useState(0);

  const stepCount = question.explanation.length;

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), Math.max(stepCount - 1, 0));
      setStepIndex(clamped);
      if (clamped === stepCount - 1) {
        onExplanationViewed?.();
      }
    },
    [stepCount, onExplanationViewed],
  );

  const select = useCallback(
    (choiceId: string) => {
      // While the explanation is showing the answer group is inert; this is the
      // same rule stated in the only place it can be enforced.
      if (phase === "revealed") {
        return;
      }
      setPendingChoiceId(choiceId);
      setStepIndex(0);
      if (submitMode === "direct") {
        setCommittedChoiceId(choiceId);
        setPhase("submitted");
        return;
      }
      setPhase("selected");
    },
    [phase, submitMode],
  );

  const submit = useCallback(() => {
    if (phase !== "selected" || pendingChoiceId === null) {
      return;
    }
    setCommittedChoiceId(pendingChoiceId);
    setPhase("submitted");
  }, [phase, pendingChoiceId]);

  const enterExplanation = useCallback((next: ExplanationPhase) => {
    setPhase(next);
    setStepIndex(0);
    setRevealEntry((entry) => entry + 1);
  }, []);

  const beginExplanation = useCallback(() => {
    if (phase !== "submitted") {
      return;
    }
    enterExplanation("revealed");
  }, [phase, enterExplanation]);

  const nextStep = useCallback(() => goToStep(stepIndex + 1), [goToStep, stepIndex]);
  const previousStep = useCallback(() => goToStep(stepIndex - 1), [goToStep, stepIndex]);

  const replay = useCallback(() => {
    if (phase !== "revealed") {
      return;
    }
    enterExplanation("revealed");
  }, [phase, enterExplanation]);

  const reset = useCallback(() => {
    setPhase("idle");
    setPendingChoiceId(IDLE_STATE.pendingChoiceId);
    setCommittedChoiceId(IDLE_STATE.committedChoiceId);
    setStepIndex(IDLE_STATE.stepIndex);
  }, []);

  const explaining = phase === "revealed";
  const step = explaining ? (question.explanation[stepIndex] ?? null) : null;

  const feedback = useMemo(
    () =>
      committedChoiceId === null
        ? null
        : buildFeedback(question, committedChoiceId),
    [question, committedChoiceId],
  );

  const visualState: FigureMatrixVisualState =
    step === null || step.visualState.kind === "none"
      ? { kind: "none" }
      : step.visualState;

  return {
    phase,
    stepCount,
    stepIndex,
    step,
    committedChoiceId,
    pendingChoiceId,
    correctChoiceId: question.correctChoiceId,
    revealEntry,
    isCorrect: committedChoiceId !== null && committedChoiceId === question.correctChoiceId,
    feedback,
    visualState,
    explaining,
    select,
    submit,
    beginExplanation,
    nextStep,
    previousStep,
    goToStep,
    replay,
    reset,
  };
}