import type { Metadata } from "next";
import { AssessmentCoverageList } from "@/components/marketing/AssessmentCoverage";
import { assessmentsPageCopy } from "@/content/marketing/copy";
import { MARKETING_STYLES } from "../page";

/**
 * `/assessments` — the coverage page (R9, R3).
 *
 * The landing page carries a compact version of this list; this page is where
 * the sub-areas sit in full. Both render the same data, so the two cannot
 * disagree about what the practice holds questions for.
 *
 * Naming the assessments is the point of the page. Nothing here says who
 * publishes them, or that the practice has any connection to them.
 */
export const metadata: Metadata = {
  title: "Assessments",
  description:
    "The assessment families this practice is built around, and the reasoning areas each one exercises.",
  openGraph: {
    title: "Assessments · Heir of Wisdom",
    description:
      "The assessment families this practice is built around, and the reasoning areas each one exercises.",
  },
};

export default function AssessmentsPage() {
  return (
    <>
      <style href="marketing" precedence="default">
        {MARKETING_STYLES}
      </style>

      <h1>Assessments</h1>
      <p className="marketing-lede">{assessmentsPageCopy.lede}</p>

      <section className="marketing-section" aria-labelledby="coverage-heading">
        <h2 id="coverage-heading">What the practice holds questions for</h2>
        <AssessmentCoverageList />
      </section>
    </>
  );
}
