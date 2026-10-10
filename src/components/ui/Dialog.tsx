"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  /** Called on Escape, on the close button, and on a click outside the panel. */
  onClose: () => void;
  /** Names the dialog. Keep it short and specific. */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) =>
    typeof element.checkVisibility === "function"
      ? element.checkVisibility()
      : true,
  );
}

const noopSubscribe = () => () => {};

/**
 * A portal needs a document. This is false while rendering on the server and
 * during hydration, then true on the client, so the dialog's markup only ever
 * appears in the DOM the browser built.
 */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * The modal every other surface depends on: it traps Tab, closes on Escape,
 * and hands focus back to whatever opened it.
 *
 * Focus is moved into the dialog itself rather than its first control, so a
 * screen reader reads the title and description before the actions.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = "Close",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isClient = useIsClient();
  const titleId = useId();
  const descriptionId = useId();

  // Take focus on open, give it back on close.
  useEffect(() => {
    if (!open || !isClient) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.focus();

    return () => {
      const previous = restoreFocusRef.current;
      restoreFocusRef.current = null;
      previous?.focus?.();
    };
  }, [open, isClient]);

  // Hold the page still behind the dialog.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = focusableWithin(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      const focusIsOutside = !active || !dialog.contains(active);

      if (event.shiftKey) {
        if (active === first || focusIsOutside || active === dialog) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || focusIsOutside || active === dialog) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <div
      className="ui-dialog__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="ui-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="ui-dialog__header">
          <h2 className="ui-dialog__title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="ui-dialog__close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {description && (
          <p className="ui-dialog__description" id={descriptionId}>
            {description}
          </p>
        )}

        {children && <div className="ui-dialog__body">{children}</div>}
        {footer && <div className="ui-dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
