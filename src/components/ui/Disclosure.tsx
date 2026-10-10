"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

export interface DisclosureProps {
  /** The always-visible question or label. */
  summary: ReactNode;
  children: ReactNode;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Controlled state; pair it with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A show/hide panel for detail that most readers can skip. The trigger is a
 * real button, so Space and Enter work and the panel is announced as expanded
 * or collapsed; the chevron only reinforces that, it never carries it alone.
 *
 * It renders no heading of its own: the surrounding page owns the heading
 * level, because a fixed level would be wrong wherever it is placed.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
}: DisclosureProps) {
  const generatedId = useId();
  const panelId = `${generatedId}-panel`;
  const triggerId = `${generatedId}-trigger`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  function toggle() {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="ui-disclosure">
      <button
        type="button"
        id={triggerId}
        className="ui-disclosure__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span>{summary}</span>
        <span className="ui-disclosure__chevron" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="ui-disclosure__panel"
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
