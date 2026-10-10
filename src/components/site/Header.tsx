import Link from "next/link";
import { MobileNav } from "./MobileNav";
import type { NavLink } from "./MobileNav";

/**
 * The shell header: wordmark, the three navigation links, sign-in, and the one
 * call to action. Deliberately quiet — no badges, no utility links, nothing
 * that competes with the page.
 *
 * "How it works" is the landing page's own section, not a route of its own, so
 * it points at the anchor and carries the leading slash: from `/faq` that has
 * to mean the home page's section, not this page's.
 *
 * Sign-in and sign-up are U6's routes (see the note below on why they are
 * linked before they exist).
 */
const PRIMARY_NAV: readonly NavLink[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/assessments", label: "Assessments" },
  { href: "/faq", label: "FAQ" },
];

const SIGN_IN: NavLink = { href: "/sign-in", label: "Sign in" };

/**
 * The primary call to action. `/diagnostic` is the route this will eventually
 * address, but it is built in a later unit (U10), and a header that 404s is the
 * failure R35 exists to prevent. `/sign-up` is the real next step in the funnel
 * — the account a free diagnostic runs under — and U6 creates it in the same
 * plan. `Header.test.tsx` names it as a later-unit route rather than pretending
 * it is on disk.
 */
const CALL_TO_ACTION: NavLink = { href: "/sign-up", label: "Start free diagnostic" };

export function Header() {
  return (
    <header className="site-header">
      <Link className="site-header__wordmark" href="/">
        Heir of Wisdom
      </Link>

      <nav className="site-header__nav" aria-label="Primary">
        <ul className="site-header__nav-list">
          {PRIMARY_NAV.map((link) => (
            <li key={link.href}>
              <Link className="site-header__nav-link" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="site-header__actions">
        <Link
          className="ui-button ui-button--secondary ui-button--sm"
          href={SIGN_IN.href}
        >
          {SIGN_IN.label}
        </Link>
        <Link className="ui-button ui-button--primary ui-button--sm" href={CALL_TO_ACTION.href}>
          {CALL_TO_ACTION.label}
        </Link>
      </div>

      <MobileNav links={PRIMARY_NAV} signIn={SIGN_IN} callToAction={CALL_TO_ACTION} />
    </header>
  );
}