import Link from "next/link";
import { POSITIONING_LINE, heroCopy } from "@/content/marketing/copy";

/**
 * The hero: the positioning line, one short paragraph, and the two ways in.
 *
 * The headline is the only H1 on the page and the only place
 * `POSITIONING_LINE` appears — every other section has to earn its own words
 * rather than repeating the slogan (R1).
 */
export function Hero() {
  return (
    <section className="marketing-hero" aria-labelledby="hero-heading">
      <h1 id="hero-heading" className="marketing-hero__title">
        {POSITIONING_LINE}
      </h1>

      <p className="marketing-hero__lede">{heroCopy.lede}</p>

      <p className="marketing-hero__actions">
        <Link
          className="ui-button ui-button--primary ui-button--lg"
          href={heroCopy.primaryAction.href}
        >
          {heroCopy.primaryAction.label}
        </Link>
        <Link className="marketing-hero__secondary" href={heroCopy.secondaryAction.href}>
          {heroCopy.secondaryAction.label}
        </Link>
      </p>
    </section>
  );
}
