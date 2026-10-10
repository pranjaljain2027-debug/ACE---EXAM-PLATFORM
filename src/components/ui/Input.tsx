import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  /** Required: an unlabelled field is unreachable for a screen reader. */
  label: string;
  /** Permanent help text, read with the field. */
  hint?: string;
  /** A labelled problem. Takes precedence over `successMessage`. */
  error?: string;
  /** Confirmation that the current value was accepted. */
  successMessage?: string;
  hideLabel?: boolean;
}

/**
 * A labelled text field with one message slot. Errors are announced with the
 * field rather than in a separate summary, so a screen reader user meets the
 * problem where it happened. The message carries the word "Error" or "Saved"
 * so its meaning never depends on its colour.
 */
export function Input({
  label,
  hint,
  error,
  successMessage,
  hideLabel = false,
  className,
  disabled = false,
  id,
  "aria-describedby": describedBy,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const messageId = `${inputId}-message`;
  const message = error ?? successMessage;

  const describedByIds = [hint ? hintId : null, message ? messageId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["ui-field", className].filter(Boolean).join(" ")}>
      <label
        className={hideLabel ? "ui-visually-hidden" : "ui-field__label"}
        htmlFor={inputId}
      >
        {label}
      </label>

      <input
        {...rest}
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [describedBy, describedByIds].filter(Boolean).join(" ") || undefined
        }
        className={[
          "ui-input",
          error && "ui-input--error",
          !error && successMessage && "ui-input--success",
          disabled && "ui-input--disabled",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {hint && (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {message && (
        <p
          className={`ui-field__message ui-field__message--${error ? "error" : "success"}`}
          id={messageId}
          data-slot={error ? "error" : "success"}
        >
          <span className="ui-field__message-label">
            {error ? "Error:" : "Saved:"}
          </span>{" "}
          {message}
        </p>
      )}
    </div>
  );
}
