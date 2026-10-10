import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
  /** Use for an unselected affordance such as "Choose one". */
  disabled?: boolean;
}

export interface SelectProps extends ComponentPropsWithRef<"select"> {
  /** Required: an unlabelled field is unreachable for a screen reader. */
  label: string;
  options: readonly SelectOption[];
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

/**
 * A native select. It is the right control here: it behaves correctly with a
 * keyboard, a screen reader, a touch keyboard and a 320px viewport, none of
 * which a styled listbox gets for free.
 */
export function Select({
  label,
  options,
  hint,
  error,
  hideLabel = false,
  className,
  disabled = false,
  id,
  "aria-describedby": describedBy,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;

  const describedByIds = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["ui-select", className].filter(Boolean).join(" ")}>
      <label
        className={hideLabel ? "ui-visually-hidden" : "ui-field__label"}
        htmlFor={selectId}
      >
        {label}
      </label>

      <div className="ui-select__control-wrap">
        <select
          {...rest}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy, describedByIds].filter(Boolean).join(" ") || undefined
          }
          className={[
            "ui-select__control",
            error && "ui-select__control--error",
            disabled && "ui-select__control--disabled",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="ui-select__chevron" aria-hidden="true" />
      </div>

      {hint && (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p
          className="ui-field__message ui-field__message--error"
          id={errorId}
          data-slot="error"
        >
          <span className="ui-field__message-label">Error:</span> {error}
        </p>
      )}
    </div>
  );
}
