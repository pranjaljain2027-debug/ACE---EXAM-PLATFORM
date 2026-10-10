import type { Metadata } from "next";
import { AssessmentCoverage } from "@/components/marketing/AssessmentCoverage";
import { Differentiation } from "@/components/marketing/Differentiation";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ParentValue } from "@/components/marketing/ParentValue";
import { ReasoningDemo } from "@/components/marketing/ReasoningDemo";
import { Trust } from "@/components/marketing/Trust";
import { POSITIONING_LINE } from "@/content/marketing/copy";

/**
 * The landing page (U4, R1).
 *
 * `/` lives in the `(public)` group, so it renders inside the shell: the
 * header, the `<main>` and the footer are already there, and this module adds
 * no landmark of its own. The U1 scaffold placeholder at `src/app/page.tsx`
 * has been deleted — two `page.tsx` files resolving to `/` is a build error,
 * not a merge conflict.
 *
 * The order is the design, not an accident. The demo is second so that the
 * product can be tried before it is described, and everything after it is
 * support for a visitor who has just tried it.
 */
export const metadata: Metadata = {
  title: "See why, not just what",
  description:
    "Help your child practise reasoning for CogAT, OLSAT and NNAT, with visual explanations that make the pattern behind each answer easier to understand.",
  openGraph: {
    title: `${POSITIONING_LINE} · Heir of Wisdom`,
    description:
      "Help your child practise reasoning for CogAT, OLSAT and NNAT, with visual explanations that make the pattern behind each answer easier to understand.",
  },
};

/**
 * The landing page's own layer.
 *
 * Shipped as one scoped style element rather than a stylesheet, because this
 * unit owns no CSS file; it reads only the tokens in `src/styles/tokens.css`,
 * so the palette, the type scale and the shared reduced-motion layer all still
 * apply. The shell does the same thing for the frame it owns.
 *
 * It is exported because `/assessments`, `/faq` and `/contact` render the same
 * marketing components and read the same class names — the route group's
 * layout owns the shell layer, and this owns the marketing layer above it.
 *
 * What it is trying to be: white space, one idea per section, and rules rather
 * than boxes. An earlier direction read as far too heavy — every element
 * carried an edge, which made a reasoning tool look like a dashboard. So there
 * is exactly one framed thing on the page (the demo), one hairline between the
 * assessments and between the two sides of the contrast, and nothing else
 * drawing a border.
 */
export const MARKETING_STYLES = `
.marketing {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.marketing-section,
.marketing-hero {
  display: grid;
  gap: var(--space-5);
}

.marketing-lede {
  max-width: 46ch;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  line-height: var(--line-height-body);
}

.marketing-note {
  max-width: var(--reading-max);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

/* --- Hero ---------------------------------------------------------------- */

.marketing-hero {
  padding-bottom: var(--space-6);
}

.marketing-hero__title {
  max-width: 22ch;
  font-family: var(--font-display);
  font-size: var(--text-display);
}

.marketing-hero__lede {
  max-width: 46ch;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  line-height: var(--line-height-body);
}

.marketing-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
}

.marketing-hero__secondary {
  font-weight: 600;
}

/* --- The demo ------------------------------------------------------------ */

.marketing-demo__frame {
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

/* --- Assessment coverage -------------------------------------------------- */

.marketing-coverage__list {
  display: grid;
  gap: var(--space-5);
}

.marketing-coverage__item {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.marketing-coverage__summary {
  max-width: var(--reading-max);
  color: var(--color-text-muted);
}

.marketing-coverage__areas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-5);
  list-style: none;
}

.marketing-coverage__area {
  flex: 1 1 12rem;
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.marketing-coverage__area-label {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: var(--tracking-wide);
}

.marketing-coverage__area-detail {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  line-height: var(--line-height-body);
}

/* --- How it works -------------------------------------------------------- */

.marketing-steps {
  display: grid;
  gap: var(--space-5);
  list-style: none;
}

.marketing-steps__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-1) var(--space-4);
  align-items: start;
}

.marketing-steps__marker {
  padding-top: 0.35em;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.marketing-steps__body {
  display: grid;
  gap: var(--space-1);
  max-width: var(--reading-max);
}

.marketing-steps__name {
  font-size: var(--text-lg);
}

/* --- Differentiation ----------------------------------------------------- */

.marketing-contrast {
  display: grid;
  gap: var(--space-4);
}

.marketing-contrast__row {
  display: grid;
  grid-template-columns: minmax(7rem, 9rem) minmax(0, 1fr);
  gap: var(--space-2) var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.marketing-contrast__label {
  font-weight: 650;
}

.marketing-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  list-style: none;
}

.marketing-flow__step {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-muted);
}

.marketing-flow__arrow {
  color: var(--color-text-subtle);
}

/* --- Term lists (parent value, trust) ------------------------------------- */

.marketing-terms {
  display: grid;
  gap: var(--space-4);
}

.marketing-terms__pair {
  display: grid;
  gap: var(--space-1);
  max-width: var(--reading-max);
}

.marketing-terms__term {
  font-weight: 650;
}

.marketing-terms__detail {
  margin: 0;
  color: var(--color-text-muted);
}

/* --- FAQ and links -------------------------------------------------------- */

.marketing-faq {
  max-width: var(--reading-max);
}

.marketing-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
}

/* --- Narrow viewports -----------------------------------------------------
   320px is the floor (R34): tighten the measure, never clip the content.    */

@media (max-width: 47.99rem) {
  .marketing {
    gap: var(--space-7);
  }

  .marketing-demo__frame {
    padding: var(--space-4);
  }

  .marketing-contrast__row {
    grid-template-columns: minmax(0, 1fr);
  }

  .marketing-hero__lede,
  .marketing-lede {
    font-size: var(--text-base);
  }
}
`;

export default function LandingPage() {
  return (
    <>
      <style href="marketing" precedence="default">
        {MARKETING_STYLES}
      </style>

      <div className="marketing">
        <Hero />
        <ReasoningDemo />
        <AssessmentCoverage />
        <HowItWorks />
        <Differentiation />
        <ParentValue />
        <Trust />
        <Faq />
        <FinalCta />
      </div>
    </>
  );
}
