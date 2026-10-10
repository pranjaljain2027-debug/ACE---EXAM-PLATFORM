"use client";

/**
 * The reasoning demo (U5) — the product's central proof.
 *
 * One figure-matrix question, a board with a single empty square, four pictures
 * to choose from, and an explanation that walks the visitor through why one of
 * them is right. It is built from the same player a practice session will use
 * (U10): the only difference the host states is whether an answer is confirmed
 * or committed on the spot.
 *
 * The sequence, and why each part is where it is:
 *
 *   board → choices → feedback → walk the steps → the rule → replay or reset
 *
 * Two keyboard rules keep the two arrow-key behaviours apart. Inside the answer
 * group the arrow keys move focus between pictures and never choose one; inside
 * the explanation panel they move between steps. Once the explanation is
 * showing the answer group goes inert, so one key never means two things and a
 * tab never lands somewhere the visitor did not ask to go (R33, AE1).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { MatrixGrid } from "./MatrixGrid";
import { ShapeGlyph } from "./ShapeGlyph";
import { useExplanation, usePrefersReducedMotion } from "./useExplanation";
import type { SubmitMode } from "./useExplanation";
import type { FigureChoice, FigureMatrixQuestion } from "@/content/questions/types";

export interface ExplanationPlayerProps {
  question: FigureMatrixQuestion;
  /**
   * `direct` commits an answer as soon as it is chosen — the landing demo.
   * `explicit` waits for a confirm control, which is what a session needs.
   */
  submitMode?: SubmitMode;
  /** The continue edge out of the feedback into the explanation. */
  continueLabel?: string;
  /** Fired once the visitor reaches the last explanation step. */
  onExplanationViewed?: () => void;
  className?: string;
}

const SLOT_NAMES = "ABCDEFGH";

type ChoiceStatus = { readonly label: string; readonly tone: "correct" | "missed" } | null;

function statusFor(
  choice: FigureChoice,
  committedChoiceId: string | null,
  correctChoiceId: string,
  isCorrect: boolean,
  revealAnswer: boolean,
): ChoiceStatus {
  if (revealAnswer && choice.id === correctChoiceId) {
    return { label: "The answer", tone: "correct" };
  }
  if (choice.id === committedChoiceId) {
    return isCorrect
      ? { label: "Your answer — correct", tone: "correct" }
      : { label: "Your answer — not the one", tone: "missed" };
  }
  return null;
}

/**
 * The tick and the cross. Correct and incorrect are never carried by colour
 * alone: every state that uses one of these also writes the words beside it
 * (R25, R33).
 */
function StatusIcon({ tone }: { tone: "correct" | "missed" }) {
  return (
    <svg
      data-slot="state-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {tone === "correct" ? (
        <path
          d="M2.5 7.4l3 3 6-6.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function ExplanationPlayer({
  question,
  submitMode = "direct",
  continueLabel = "See the answer",
  onExplanationViewed,
  className,
}: ExplanationPlayerProps) {
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const promptId = `${baseId}-prompt`;
  const groupLabelId = `${baseId}-group-label`;
  const stepLabelId = `${baseId}-step-label`;

  const controller = useExplanation({ question, submitMode, onExplanationViewed });
  const reducedMotion = usePrefersReducedMotion();

  const [focusIndex, setFocusIndex] = useState(0);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stepPanelRef = useRef<HTMLElement | null>(null);

  // Entering the explanation moves focus into it, because from then on the
  // arrow keys belong to the steps rather than to the pictures. It happens on
  // entry and on replay, not on every step, so paging with the buttons is not
  // interrupted.
  useEffect(() => {
    if (controller.explaining) {
      stepPanelRef.current?.focus();
    }
  }, [controller.explaining, controller.revealEntry]);

  const keyedGlyph = useMemo(
    () => question.choices.find((choice) => choice.id === question.correctChoiceId)?.glyph ?? null,
    [question],
  );

  const step = controller.step;

  // Once the reveal step has been reached the answer stays marked and stays in
  // the empty square: it is not withdrawn when the walkthrough moves on to
  // stating the rule.
  const revealIndex = useMemo(
    () => question.explanation.findIndex((entry) => entry.operation === "reveal"),
    [question],
  );
  const answerShown =
    controller.explaining && revealIndex >= 0 && controller.stepIndex >= revealIndex;

  const cellForElement = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of question.visual.rows) {
      for (const cell of row) {
        map.set(cell.cellId, cell.cellId);
        if (cell.glyph !== null) {
          map.set(cell.glyph.glyphId, cell.cellId);
        }
      }
    }
    return map;
  }, [question]);

  // A step may point at a cell or at a figure; either way the grid highlights
  // the cell the figure sits in.
  const highlightCellIds = useMemo(() => {
    if (step === null) {
      return [];
    }
    const ids: string[] = [];
    for (const elementId of step.highlightIds) {
      const cellId = cellForElement.get(elementId);
      if (cellId !== undefined && !ids.includes(cellId)) {
        ids.push(cellId);
      }
    }
    return ids;
  }, [step, cellForElement]);

  const gridTransform =
    controller.visualState.kind === "transform"
      ? { cellId: controller.visualState.cellId, transform: controller.visualState.transform }
      : null;

  // The answer group stops being a control the moment the explanation starts,
  // so the arrow keys cannot mean two things at once. The tab index is set as
  // well as the attribute, so the group leaves the tab order in every browser
  // rather than only those that implement `inert`.
  const answersInert = controller.explaining;

  const moveFocus = (index: number) => {
    setFocusIndex(index);
    choiceRefs.current[index]?.focus();
  };

  const selectAt = (index: number) => {
    const choice = question.choices[index];
    if (choice === undefined) {
      return;
    }
    setFocusIndex(index);
    controller.select(choice.id);
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (answersInert || question.choices.length === 0) {
      return;
    }
    const last = question.choices.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = focusIndex >= last ? 0 : focusIndex + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = focusIndex <= 0 ? last : focusIndex - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case " ":
      case "Enter":
        // Space and Enter choose. The arrow keys only ever move focus, so a
        // committed answer is never changed by browsing past it.
        event.preventDefault();
        selectAt(focusIndex);
        return;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(next);
  };

  const handleStepKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      controller.nextStep();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      controller.previousStep();
    }
  };

  const resetAndRefocus = () => {
    controller.reset();
    setFocusIndex(0);
    // The reset control is about to disappear; put focus somewhere real.
    choiceRefs.current[0]?.focus();
  };

  const atLastStep = controller.stepCount > 0 && controller.stepIndex === controller.stepCount - 1;
  // An answer can be taken back from the moment it is picked, in either mode.
  const canReset =
    controller.committedChoiceId !== null || controller.pendingChoiceId !== null;

  return (
    <section
      aria-labelledby={promptId}
      data-phase={controller.phase}
      data-motion={reducedMotion ? "static" : "animated"}
      className={className}
      style={{ display: "grid", gap: "var(--space-5)" }}
    >
      <h3
        id={promptId}
        style={{ fontSize: "var(--text-lg)", lineHeight: "var(--line-height-snug)" }}
      >
        {question.prompt}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "var(--space-5)",
        }}
      >
        <div style={{ flex: "1 1 18rem", minWidth: "0" }}>
          <MatrixGrid
            visual={question.visual}
            highlightCellIds={highlightCellIds}
            transform={gridTransform}
            revealedGlyph={answerShown ? keyedGlyph : null}
            animate={!reducedMotion}
          />
        </div>

        <div
          style={{
            flex: "1 1 19rem",
            minWidth: "0",
            display: "grid",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <p id={groupLabelId} style={{ marginBottom: "var(--space-3)", fontWeight: 650 }}>
              Choose a picture
            </p>
            <div
              role="radiogroup"
              aria-labelledby={groupLabelId}
              inert={answersInert}
              onKeyDown={handleGroupKeyDown}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(9.5rem, 1fr))",
                gap: "var(--space-3)",
              }}
            >
              {question.choices.map((choice, index) => {
                const status = statusFor(
                  choice,
                  controller.committedChoiceId,
                  question.correctChoiceId,
                  controller.isCorrect,
                  answerShown,
                );
                const checked =
                  controller.committedChoiceId ?? controller.pendingChoiceId ?? "";
                const isChecked = checked === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={isChecked}
                    tabIndex={answersInert ? -1 : focusIndex === index ? 0 : -1}
                    ref={(element) => {
                      choiceRefs.current[index] = element;
                    }}
                    onClick={() => selectAt(index)}
                    style={{
                      display: "grid",
                      justifyItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-3)",
                      border: `2px solid ${
                        status?.tone === "correct"
                          ? "var(--color-success)"
                          : status?.tone === "missed"
                            ? "var(--color-warning)"
                            : isChecked
                              ? "var(--color-accent)"
                              : "var(--color-border)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text)",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        alignSelf: "start",
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        letterSpacing: "var(--tracking-wide)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {SLOT_NAMES[index] ?? index + 1}
                    </span>
                    <ShapeGlyph glyph={choice.glyph} size={60} decorative />
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        lineHeight: "var(--line-height-snug)",
                      }}
                    >
                      {choice.glyph.altText}
                    </span>
                    {status !== null && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--space-1)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 650,
                          color:
                            status.tone === "correct"
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                        }}
                      >
                        <StatusIcon tone={status.tone} />
                        {status.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* The live region is mounted from the start and filled in on commit,
              so what changes is what a screen reader announces. The controls
              below it sit outside it on purpose: announcing a button name every
              time focus moves is noise, not information. */}
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              data-slot="feedback"
              style={{
                padding: controller.feedback === null ? undefined : "var(--space-4)",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  controller.feedback === null
                    ? undefined
                    : controller.feedback.correct
                      ? "var(--color-success-muted)"
                      : "var(--color-surface-sunken)",
              }}
            >
              {controller.feedback !== null && (
                <p
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    fontSize: "var(--text-base)",
                    lineHeight: "var(--line-height-body)",
                  }}
                >
                  <StatusIcon tone={controller.feedback.correct ? "correct" : "missed"} />
                  <span>
                    <strong>{controller.feedback.headline}</strong>{" "}
                    <span>{controller.feedback.detail}</span>
                  </span>
                </p>
              )}
            </div>

            {controller.phase !== "idle" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                {controller.phase === "selected" && (
                  <Button variant="primary" onClick={controller.submit}>
                    Check my answer
                  </Button>
                )}
                {controller.phase === "submitted" && (
                  <Button variant="primary" onClick={controller.beginExplanation}>
                    {continueLabel}
                  </Button>
                )}
                {canReset && (
                  <Button variant="ghost" onClick={resetAndRefocus}>
                    Start over
                  </Button>
                )}
              </div>
            )}
          </div>

          {step !== null && (
            <section
              ref={stepPanelRef}
              tabIndex={-1}
              aria-labelledby={stepLabelId}
              onKeyDown={handleStepKeyDown}
              style={{
                display: "grid",
                gap: "var(--space-3)",
                padding: "var(--space-4)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <p id={stepLabelId} style={{ fontWeight: 650 }}>
                <span data-slot="step-count">
                  {`Step ${controller.stepIndex + 1} of ${controller.stepCount}`}
                </span>
                {step.title !== undefined && ": "}
                {step.title !== undefined && (
                  <span data-slot="step-title">{step.title}</span>
                )}
              </p>

              <p>{step.narration}</p>

              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                ← → to step
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <Button
                  variant="secondary"
                  onClick={controller.previousStep}
                  disabled={controller.stepIndex === 0}
                >
                  Back
                </Button>
                {atLastStep ? (
                  <Button variant="primary" onClick={controller.replay}>
                    Play it again
                  </Button>
                ) : (
                  <Button variant="primary" onClick={controller.nextStep}>
                    Next step
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}