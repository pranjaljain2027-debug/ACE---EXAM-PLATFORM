import Link from "next/link";
import { assessmentCoverage, assessmentCoverageCopy } from "@/content/marketing/copy";
import type { AssessmentCoverageEntry } from "@/content/marketing/copy";

/**
 * One assessment: its name, one line about it, and the sub-areas the practice
 * holds questions for.
 *
 * The sub-areas carry the reasoning area behind them in the data rather than in
 * the sentence, and `copy.test.ts` checks every one of those against the
 * shipped corpus — so this list cannot claim an area the content does not
 * exist for (R9). Nothing here says who publishes the assessments or what
 * connection the product has to them, because it has none (R3).
 */
function AssessmentEntry({ assessment }: { readonly assessment: AssessmentCoverageEntry }) {
  const headingId = `coverage-${assessment.id}`;

  return (
    <section className="marketing-coverage__item" aria-labelledby={headingId}>
      <h3 id={headingId} className="marketing-coverage__name">
        {assessment.name}
      </h3>
      <p className="marketing-coverage__summary">{assessment.summary}</p>

      <ul className="marketing-coverage__areas">
        {assessment.areas.map((area) => (
          <li key={area.label} className="marketing-coverage__area">
            <p className="marketing-coverage__area-label">{area.label}</p>
            <p className="marketing-coverage__area-detail">{area.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The coverage list without a section heading, so `/assessments` can put it
 * under the page's own H1 instead of repeating a second one.
 */
export function AssessmentCoverageList() {
  return (
    <>
      <div className="marketing-coverage__list">
        {assessmentCoverage.map((assessment) => (
          <AssessmentEntry key={assessment.id} assessment={assessment} />
        ))}
      </div>

      <p className="marketing-note">{assessmentCoverageCopy.note}</p>

      <p>
        <Link href={assessmentCoverageCopy.link.href}>{assessmentCoverageCopy.link.label}</Link>
      </p>
    </>
  );
}

/** The landing page's third section. */
export function AssessmentCoverage() {
  return (
    <section className="marketing-section" aria-labelledby="assessment-coverage-heading">
      <h2 id="assessment-coverage-heading">{assessmentCoverageCopy.heading}</h2>
      <p className="marketing-lede">{assessmentCoverageCopy.lede}</p>
      <AssessmentCoverageList />
    </section>
  );
}
