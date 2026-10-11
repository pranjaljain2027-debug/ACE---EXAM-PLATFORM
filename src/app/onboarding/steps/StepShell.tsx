/**
 * The step shell (U7).
 *
 * Every step renders inside this, so the heading level, the fieldset/legend
 * pairing, and the error announcement are written once rather than six times.
 * Six copies of an accessible radio group is six chances to get one of them
 * subtly wrong, and nothing in a test suite would catch it.
 *
 * The error summary is a live region: a parent who presses Continue on an
 * unanswered step hears the reason without having to go looking for it.
 */
import type { ReactNode } from "react";

export interface StepProps {
  /** Errors to show. Empty when the step is satisfied or optional. */
  readonly errors: readonly string[];
}

interface StepShellProps extends StepProps {
  readonly titleId: string;
  readonly heading: string;
  readonly intro: string;
  /** Optional Skip control, rendered above the fields. */
  readonly skip?: ReactNode;
  readonly children: ReactNode;
}

export function StepShell({
  titleId,
  heading,
  intro,
  errors,
  skip,
  children,
}: StepShellProps) {
  const errorId = `${titleId}-errors`;

  return (
    <section className="onboarding-step" aria-labelledby={titleId}>
      <h2 id={titleId}>{heading}</h2>
      <p>{intro}</p>

      {skip}

      {/*
        The region is always rendered so assistive technology has something to
        watch; it is empty when there is nothing wrong. A live region that is
        added to the DOM at the same moment as its content is often missed.
      */}
      <div
        id={errorId}
        role="alert"
        aria-live="assertive"
        className={errors.length > 0 ? "onboarding-step__errors" : "onboarding-step__errors is-empty"}
      >
        {errors.length > 0 && (
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {children}
    </section>
  );
}

/**
 * Props for a step that renders a single-choice radio group.
 *
 * One shape for all three single-choice steps, so the page can render them
 * uniformly and so the group semantics cannot drift between them.
 */
/**
 * Props for a step that renders a single-choice radio group.
 *
 * No `errors` here on purpose: `StepShell` owns the error region, and a group
 * that also had to render errors would put the message in two places.
 */
export interface ChoiceStepProps<T extends string> {
  readonly name: string;
  readonly legend: string;
  readonly value: T | null;
  readonly choices: ReadonlyArray<{ readonly value: T; readonly label: string; readonly hint?: string }>;
  readonly onSelect: (value: T) => void;
}

export function ChoiceStep<T extends string>({
  name,
  legend,
  value,
  choices,
  onSelect,
}: ChoiceStepProps<T>) {
  return (
    <fieldset className="onboarding-choice">
      <legend className="onboarding-choice__legend">{legend}</legend>
      {choices.map((choice) => (
        <label key={choice.value} className="onboarding-choice__option">
          <input
            type="radio"
            name={name}
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onSelect(choice.value)}
          />
          <span>{choice.label}</span>
          {choice.hint !== undefined && <span className="onboarding-choice__hint">{choice.hint}</span>}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Props for a step that renders a multi-choice checkbox group.
 *
 * `Toggle` is a pure function of `(current, value)` rather than an index or a
 * boolean, so the caller never has to know which way a toggle goes — the one
 * thing that went wrong in the previous attempt at this flow.
 */
export interface MultiChoiceStepProps<T extends string> {
  readonly name: string;
  readonly legend: string;
  readonly values: readonly T[];
  readonly choices: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  readonly toggle: (current: readonly T[], value: T) => readonly T[];
  readonly onChange: (next: readonly T[]) => void;
}

export function MultiChoiceStep<T extends string>({
  name,
  legend,
  values,
  choices,
  toggle,
  onChange,
}: MultiChoiceStepProps<T>) {
  return (
    <fieldset className="onboarding-choice">
      <legend className="onboarding-choice__legend">{legend}</legend>
      {choices.map((choice) => (
        <label key={choice.value} className="onboarding-choice__option">
          <input
            type="checkbox"
            name={name}
            value={choice.value}
            checked={values.includes(choice.value)}
            onChange={() => onChange(toggle(values, choice.value))}
          />
          <span>{choice.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
