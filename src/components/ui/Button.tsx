import type { ComponentPropsWithRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  /** Visual weight. `primary` is reserved for the one action a screen is about. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, marks the button busy, and blocks further activation. */
  loading?: boolean;
  /** Announced and shown while `loading`, when the action needs a new name. */
  loadingLabel?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * The one button in the app. `type` defaults to "button" because an
 * accidental Enter inside a form must never submit something unintended.
 *
 * A navigation action that needs to be a link should be an anchor carrying the
 * `ui-button ui-button--primary` classes rather than a click handler here.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  fullWidth = false,
  disabled = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const state: "default" | "disabled" | "loading" = loading
    ? "loading"
    : disabled
      ? "disabled"
      : "default";

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-state={state}
      className={[
        "ui-button",
        `ui-button--${variant}`,
        size !== "md" && `ui-button--${size}`,
        fullWidth && "ui-button--full",
        state !== "default" && "ui-button--disabled",
        loading && "ui-button--loading",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && <span className="ui-button__spinner" aria-hidden="true" />}
      <span className="ui-button__label">
        {loading && loadingLabel ? loadingLabel : children}
      </span>
    </button>
  );
}
