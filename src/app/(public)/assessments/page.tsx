import type { Metadata } from "next";

/**
 * U4 replaces this copy with the approved assessment-coverage content (R9). The
 * placeholder says what the page is for and claims nothing about what the
 * practice covers, because a coverage claim is only ever as good as the
 * questions behind it.
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
      <h1>Assessments</h1>
      <p>
        This page is a placeholder. What belongs here — the assessment families
        the practice is built around, and the reasoning areas each one exercises
        — is still being written, and it will say only what the practice
        actually holds.
      </p>
    </>
  );
}