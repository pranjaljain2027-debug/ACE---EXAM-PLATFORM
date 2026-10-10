import Link from "next/link";
import { Disclosure } from "@/components/ui";
import { faqCopy } from "@/content/marketing/copy";

/**
 * The questions, one disclosure each.
 *
 * The answer to the information-handling question is a link to the privacy page
 * rather than a summary of it. A marketing page is the wrong place to make a
 * claim about how data is handled, and the wording there would have to be true
 * on its own; the privacy page is where that belongs.
 */
export function FaqQuestions() {
  return (
    <div className="marketing-faq">
      {faqCopy.entries.map((entry) => (
        <Disclosure key={entry.question} summary={entry.question}>
          <p>{entry.answer}</p>
          {entry.link !== undefined && (
            <p>
              <Link href={entry.link.href}>{entry.link.label}</Link>
            </p>
          )}
        </Disclosure>
      ))}
    </div>
  );
}

/** The landing page's FAQ section. */
export function Faq() {
  return (
    <section className="marketing-section" aria-labelledby="faq-heading">
      <h2 id="faq-heading">{faqCopy.heading}</h2>
      <p className="marketing-lede">{faqCopy.lede}</p>
      <FaqQuestions />
    </section>
  );
}
