import type { Metadata } from "next";
import Link from "next/link";
import { FaqQuestions } from "@/components/marketing/Faq";
import { faqPageCopy } from "@/content/marketing/copy";
import { MARKETING_STYLES } from "../page";

/**
 * `/faq` — the same questions as the landing page's FAQ section, in full.
 *
 * A question answered in marketing copy is a claim nobody has checked (R2), so
 * the answers stay short and say what the practice actually does. The question
 * about how a child's information is handled is answered by linking to the
 * privacy page, not by summarising it here.
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
      <style href="marketing" precedence="default">
        {MARKETING_STYLES}
      </style>

      <h1>Frequently asked questions</h1>
      <p className="marketing-lede">{faqPageCopy.lede}</p>

      <FaqQuestions />

      <p className="marketing-note">
        {faqPageCopy.closing}{" "}
        <Link href={faqPageCopy.closingLink.href}>{faqPageCopy.closingLink.label}</Link>.
      </p>
    </>
  );
}
