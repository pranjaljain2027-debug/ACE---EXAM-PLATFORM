import Link from "next/link";
import { trustCopy } from "@/content/marketing/copy";

/**
 * The trust section: facts only.
 *
 * What the learning approach is, what the demo on this page actually is, where
 * progress comes from, and where to read about information handling. No
 * testimonial block, no logo strip, no outcome figure — there is nothing here
 * to put in any of them (R12).
 */
export function Trust() {
  return (
    <section className="marketing-section" aria-labelledby="trust-heading">
      <h2 id="trust-heading">{trustCopy.heading}</h2>
      <p className="marketing-lede">{trustCopy.lede}</p>

      <dl className="marketing-terms">
        {trustCopy.points.map((point) => (
          <div key={point.term} className="marketing-terms__pair">
            <dt className="marketing-terms__term">{point.term}</dt>
            <dd className="marketing-terms__detail">{point.detail}</dd>
          </div>
        ))}
      </dl>

      <p className="marketing-links">
        {trustCopy.links.map((link) => (
          <Link key={link.href} href={link.href} className="ui-button ui-button--secondary">
            {link.label}
          </Link>
        ))}
      </p>
    </section>
  );
}
