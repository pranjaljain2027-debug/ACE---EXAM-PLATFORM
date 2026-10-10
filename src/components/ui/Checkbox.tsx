import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

export interface CheckboxProps
  extends Omit<ComponentPropsWithRef<"input">, "type" | "children"> {
  /** Required: an unlabelled control is unreachable for a screen reader. */
  label: string;
  hint?: string;
  error?: string;
}

/**
 * A real checkbox with a painted box. Keeping the native input preserves
 * space-to-toggle, form participation and the browser's own focus handling;
 * only the box and the tick are ours.
 */
export function Checkbox({
  label,
  hint,
  error,
  className,
  disabled = false,
  id,
  "aria-describedby": describedBy,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const hintId = `${checkboxId}-hint`;
  const errorId = `${checkboxId}-error`;

  const describedByIds = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label className="ui-checkbox" htmlFor={checkboxId}>
        <input
          {...rest}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy, describedByIds].filter(Boolean).join(" ") || undefined
          }
          className={[
            "ui-checkbox__input",
            error && "ui-checkbox__input--error",
            disabled && "ui-checkbox__input--disabled",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        <span className="ui-checkbox__text">
          <span className="ui-checkbox__label">{label}</span>
          {hint && (
            <span className="ui-field__hint" id={hintId}>
              {hint}
            </span>
          )}
          {error && (
            <span
              className="ui-field__message ui-field__message--error"
              id={errorId}
              data-slot="error"
            >
              <span className="ui-field__message-label">Error:</span> {error}
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
