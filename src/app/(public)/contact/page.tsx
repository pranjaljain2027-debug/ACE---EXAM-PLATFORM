import type { Metadata } from "next";
import Link from "next/link";
import { contactPageCopy } from "@/content/marketing/copy";
import { MARKETING_STYLES } from "../page";

/**
 * `/contact`.
 *
 * The contact form belongs to U9, which will replace this file rather than
 * create it. Until then the page does the only honest thing available: it
 * points at the two pages that do answer something, and it says plainly that it
 * is not receiving messages — a page that looks like it is receiving messages
 * and is not would cost a parent more than one that says so.
 */
export const metadata: Metadata = {
  title: "Contact and support",
  description: "Questions, problems, and feedback for Heir of Wisdom.",
  openGraph: {
    title: "Contact and support · Heir of Wisdom",
    description: "Questions, problems, and feedback for Heir of Wisdom.",
  },
};

export default function ContactPage() {
  return (
    <>
      <style href="marketing" precedence="default">
        {MARKETING_STYLES}
      </style>

      <h1>Contact and support</h1>
      <p className="marketing-lede">{contactPageCopy.lede}</p>

      <section className="marketing-section" aria-labelledby="contact-where-to-go-heading">
        <h2 id="contact-where-to-go-heading">Where to go first</h2>

        <dl className="marketing-terms">
          <div className="marketing-terms__pair">
            <dt className="marketing-terms__term">
              <Link href={contactPageCopy.faqLink.href}>{contactPageCopy.faqLink.label}</Link>
            </dt>
            <dd className="marketing-terms__detail">{contactPageCopy.faqLine}</dd>
          </div>

          <div className="marketing-terms__pair">
            <dt className="marketing-terms__term">
              <Link href={contactPageCopy.privacyLink.href}>{contactPageCopy.privacyLink.label}</Link>
            </dt>
            <dd className="marketing-terms__detail">{contactPageCopy.privacyLine}</dd>
          </div>
        </dl>

        <p className="marketing-note">{contactPageCopy.formNote}</p>
      </section>
    </>
  );
}
