"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

export interface MobileNavProps {
  /** The primary navigation, repeated inside the menu for narrow viewports. */
  readonly links: readonly NavLink[];
  readonly signIn: NavLink;
  readonly callToAction: NavLink;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) =>
    typeof element.checkVisibility === "function" ? element.checkVisibility() : true,
  );
}

/**
 * The narrow-viewport menu.
 *
 * Opening it moves focus into the panel and holds it there: a menu that let
 * focus wander into the page behind it left the header in a state a keyboard
 * user could not reason about (R33). Escape, a link, and a route change are the
 * ways out; the first two hand focus back to the trigger.
 *
 * The panel stays mounted and toggles `hidden`, so the trigger's
 * `aria-controls` always points at something real.
 */
export function MobileNav({ links, signIn, callToAction }: MobileNavProps) {
  const pathname = usePathname() ?? "";
  /**
   * The menu records the route it was opened on rather than a boolean. A route
   * change makes that record stale on the very render it happens, so the menu
   * closes itself without an effect reaching in to set state after the fact,
   * and without surviving a navigation it was never part of.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    const panel = panelRef.current;
    const focusWasInside = panel ? panel.contains(document.activeElement) : false;

    setOpenedOn(null);
    if (focusWasInside) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    focusableWithin(panel)[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = focusableWithin(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      const focusIsOutside = !(active instanceof HTMLElement) || !panel.contains(active);

      if (event.shiftKey) {
        if (active === first || focusIsOutside) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || focusIsOutside) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, close]);

  return (
    <div className="site-mobile-nav">
      <button
        ref={triggerRef}
        type="button"
        className="site-header__menu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenedOn(open ? null : pathname)}
      >
        <span className="ui-visually-hidden">Menu</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3 6h14M3 10h14M3 14h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div id={panelId} ref={panelRef} className="site-mobile-nav__panel" hidden={!open}>
        <nav className="site-mobile-nav__nav" aria-label="Mobile">
          <ul className="site-mobile-nav__list">
            {links.map((link) => (
              <li key={link.href}>
                <Link className="site-mobile-nav__link" href={link.href} onClick={close}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-mobile-nav__actions">
          <Link
            className="ui-button ui-button--secondary ui-button--full"
            href={signIn.href}
            onClick={close}
          >
            {signIn.label}
          </Link>
          <Link
            className="ui-button ui-button--primary ui-button--full"
            href={callToAction.href}
            onClick={close}
          >
            {callToAction.label}
          </Link>
        </div>
      </div>
    </div>
  );
}