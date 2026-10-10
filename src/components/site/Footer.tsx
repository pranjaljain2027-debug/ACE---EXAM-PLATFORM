import Link from "next/link";

/**
 * The shell footer: the wordmark, every route a visitor can reach without an
 * account, and the copyright line.
 *
 * No social icons and no outbound links — a link the reader cannot act on is
 * decoration pretending to be navigation (R35). The legal routes belong to U9
 * and the account routes to U6; both are linked from here because the plan
 * gives them this footer, and both are named as later-unit routes in
 * `Footer.test.tsx` rather than assumed to exist.
 */
const FOOTER_NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/assessments", label: "Assessments" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact and support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  // Read at render time, never written down: a hardcoded year is wrong by the
  // time anyone reads it, and this test file asserts exactly that.
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link className="site-footer__wordmark" href="/">
          Heir of Wisdom
        </Link>

        <nav className="site-footer__nav" aria-label="Footer">
          <ul className="site-footer__nav-list">
            {FOOTER_NAV.map((link) => (
              <li key={link.href}>
                <Link className="site-footer__nav-link" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="site-footer__legal">© {year} Heir of Wisdom</p>
    </footer>
  );
}