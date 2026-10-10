import Link from "next/link";
import { finalCtaCopy } from "@/content/marketing/copy";

/**
 * The close: the one action, said once.
 *
 * The same words as the hero and no more — the promise here is "start the free
 * diagnostic", and it is repeated rather than restated differently in three
 * places (R11: nothing on this page mentions what anything costs).
 */
export function FinalCta() {
  return (
    <section className="marketing-section marketing-cta" aria-labelledby="final-cta-heading">
      <h2 id="final-cta-heading">{finalCtaCopy.heading}</h2>
      <p className="marketing-lede">{finalCtaCopy.lede}</p>

      <p>
        <Link className="ui-button ui-button--primary ui-button--lg" href={finalCtaCopy.action.href}>
          {finalCtaCopy.action.label}
        </Link>
      </p>
    </section>
  );
}
