import type { ReactNode } from "react";

export type CalloutTone = "info" | "success" | "warning" | "error";

export interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
}

const TONE_LABEL: Record<CalloutTone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

const TONE_ICON: Record<CalloutTone, ReactNode> = {
  info: (
    <>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
    </>
  ),
  success: (
    <>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8.2l2 2 4-4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  warning: (
    <>
      <path
        d="M8 2.2l6.2 11.3H1.8L8 2.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6.6v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.85" fill="currentColor" />
    </>
  ),
  error: (
    <>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.9" fill="currentColor" />
    </>
  ),
};

/** Which live-region role a tone should use, if any. */
const TONE_ROLE = {
  info: "note",
  success: "status",
  warning: "note",
  error: "alert",
} as const;

/**
 * A short standing message: what just happened, or what to watch for. The
 * tone is carried by a tint, an icon and a written label, so it never depends
 * on colour alone — and an error is a stated problem, never a red screen.
 */
export function Callout({ tone = "info", title, children }: CalloutProps) {
  return (
    <div className={`ui-callout ui-callout--${tone}`} role={TONE_ROLE[tone]}>
      <svg
        className="ui-callout__icon"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {TONE_ICON[tone]}
      </svg>
      <div className="ui-callout__body">
        <span className="ui-visually-hidden" data-tone-label>
          {TONE_LABEL[tone]}
          {title ? ": " : ". "}
        </span>
        {title && <span className="ui-callout__title">{title}</span>}
        {title && children && " "}
        {children}
      </div>
    </div>
  );
}
