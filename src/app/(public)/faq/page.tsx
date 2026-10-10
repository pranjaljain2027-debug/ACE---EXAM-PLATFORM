import type { Metadata } from "next";

/**
 * U4 replaces this copy with the real questions and answers. The placeholder
 * promises nothing about the product, because a question answered in marketing
 * copy is a claim nobody has checked (R2).
 */
export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Common questions about how the practice works, what it covers, and what it does not claim.",
  openGraph: {
    title: "Frequently asked questions · Heir of Wisdom",
    description:
      "Common questions about how the practice works, what it covers, and what it does not claim.",
  },
};

export default function FaqPage() {
  return (
    <>
      <h1>Frequently asked questions</h1>
      <p>
        This page is a placeholder. The questions that belong here — what the
        practice does, how an explanation works, and what it makes no claim
        about — are still being written.
      </p>
    </>
  );
}