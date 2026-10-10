import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/**
 * Shared metadata for the public route group (R13).
 *
 * The title template here is the one place a public page's `<title>` is
 * assembled: each page sets the part that is specific to it, and this appends
 * the product name. Social preview defaults ride along the same way, so a new
 * public page is indexable and shareable by declaring a title and a
 * description and nothing else.
 */
export const metadata: Metadata = {
  title: {
    default: "Heir of Wisdom",
    template: "%s · Heir of Wisdom",
  },
  openGraph: {
    type: "website",
    siteName: "Heir of Wisdom",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * The shell's own rules.
 *
 * The primitives in `src/components/ui` style themselves; this covers only what
 * the frame needs — the header row, the menu panel, the footer, and the skip
 * link. It is shipped as a single scoped style element rather than a separate
 * stylesheet because this unit owns no CSS file; it reads only the tokens in
 * `src/styles/tokens.css`, so the palette, the control sizes and the shared
 * reduced-motion layer all still apply.
 */
const SHELL_STYLES = `
.site-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.site-skip-link {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 60;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(calc(-100% - var(--space-6)));
}

.site-skip-link:focus-visible {
  transform: translateY(0);
}

.site-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  max-width: var(--content-max);
  min-height: var(--control-min-size);
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.site-header__wordmark {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.site-header__wordmark:hover {
  color: var(--color-accent-strong);
}

.site-header__nav-list {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  list-style: none;
}

.site-header__nav-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min-size-compact);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-standard);
}

.site-header__nav-link:hover {
  color: var(--color-text);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.site-header__menu-trigger {
  display: none;
  align-items: center;
  justify-content: center;
  width: var(--control-min-size);
  height: var(--control-min-size);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

.site-header__menu-trigger:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.site-mobile-nav__panel {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

/* The hidden attribute has to beat the display above it. */
.site-mobile-nav__panel[hidden] {
  display: none;
}

.site-mobile-nav__list {
  display: flex;
  flex-direction: column;
  list-style: none;
}

.site-mobile-nav__link {
  display: flex;
  align-items: center;
  min-height: var(--control-min-size);
  color: var(--color-text);
  text-decoration: none;
}

.site-mobile-nav__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.site-main {
  flex: 1 0 auto;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-7) var(--space-4) var(--space-8);
}

.site-footer {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4) var(--space-6);
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-3);
}

.site-footer__wordmark {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.site-footer__nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  list-style: none;
}

.site-footer__nav-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min-size-compact);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-decoration: none;
}

.site-footer__nav-link:hover {
  color: var(--color-text);
}

.site-footer__legal {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-6);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

/* Below this width the three links and the two buttons stop fitting side by
   side, so the header becomes wordmark plus menu. */
@media (max-width: 47.99rem) {
  .site-header__nav,
  .site-header__actions {
    display: none;
  }

  .site-header__menu-trigger {
    display: inline-flex;
  }

  .site-main {
    padding-top: var(--space-6);
  }
}

@media (max-width: 26rem) {
  .site-header,
  .site-main,
  .site-footer__inner,
  .site-footer__legal,
  .site-mobile-nav__panel {
    padding-right: var(--space-3);
    padding-left: var(--space-3);
  }
}
`;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style href="site-shell" precedence="default">
        {SHELL_STYLES}
      </style>

      <div className="site-shell">
        {/* First focusable thing in the document: a keyboard user should reach
            the page, not the navigation, on the first Tab. */}
        <a className="site-skip-link" href="#main-content">
          Skip to main content
        </a>

        <Header />

        <main className="site-main" id="main-content">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}