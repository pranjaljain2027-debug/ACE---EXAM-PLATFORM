export interface StepperStep {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: readonly StepperStep[];
  currentIndex: number;
  /**
   * Called with the index of a completed step. Steps at or after the current
   * one are never rendered as controls, so a flow cannot be jumped past the
   * point where its required answers are collected.
   */
  onStepSelect?: (index: number) => void;
  /** Accessible name for the progress navigation. */
  label?: string;
}

const STATUS = ["Completed", "Current", "Not started"] as const;

/**
 * A quiet numbered sequence — not a card wall. Each step states its status in
 * words as well as in the marker, so progress is never colour-only.
 */
export function Stepper({
  steps,
  currentIndex,
  onStepSelect,
  label = "Progress",
}: StepperProps) {
  return (
    <nav className="ui-stepper" aria-label={label}>
      <ol className="ui-stepper__list">
        {steps.map((step, index) => {
          const state =
            index < currentIndex
              ? "complete"
              : index === currentIndex
                ? "current"
                : "upcoming";
          const status = STATUS[index === currentIndex ? 1 : index < currentIndex ? 0 : 2];
          const marker = (
            <span className="ui-stepper__marker" aria-hidden="true">
              {index + 1}
            </span>
          );
          const text = (
            <>
              <span className="ui-visually-hidden">{`${status}: `}</span>
              <span className="ui-stepper__label">{step.label}</span>
            </>
          );

          return (
            <li
              key={step.id}
              className={`ui-stepper__item ui-stepper__item--${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {state === "complete" && onStepSelect ? (
                <button
                  type="button"
                  className="ui-stepper__trigger"
                  aria-label={`${status}: ${step.label}`}
                  onClick={() => onStepSelect(index)}
                >
                  {marker}
                  {text}
                </button>
              ) : (
                <>
                  {marker}
                  {text}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
