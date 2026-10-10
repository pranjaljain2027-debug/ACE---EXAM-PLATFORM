import { howItWorksCopy } from "@/content/marketing/copy";

/**
 * How it works: three steps in a numbered sequence.
 *
 * An ordered list, not three cards. The steps are a run of one activity, and a
 * grid of boxes would say "three separate features" instead.
 *
 * The section carries `id="how-it-works"` because the shell header and the
 * footer both link to `/#how-it-works`; without the target that is a dead link
 * on every page of the site (R35).
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="marketing-section"
      aria-labelledby="how-it-works-heading"
    >
      <h2 id="how-it-works-heading">{howItWorksCopy.heading}</h2>
      <p className="marketing-lede">{howItWorksCopy.lede}</p>

      <ol className="marketing-steps">
        {howItWorksCopy.steps.map((step, index) => (
          <li key={step.name} className="marketing-steps__item">
            <span className="marketing-steps__marker" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="marketing-steps__body">
              <h3 className="marketing-steps__name">{step.name}</h3>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
