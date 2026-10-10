import { parentValueCopy } from "@/content/marketing/copy";

/**
 * What a parent sees, described rather than drawn.
 *
 * There is no chart here on purpose. A sample chart with invented numbers on a
 * marketing page is the easiest thing in this unit to build and the least
 * honest, and the plan reserves an "Example data" chart for a product that
 * labels it — so the section says what each view contains instead of faking
 * one (R10).
 *
 * The last item says plainly that change over time appears only once there are
 * enough sessions to compare, because a graph drawn from two sessions would
 * mean nothing.
 */
export function ParentValue() {
  return (
    <section className="marketing-section" aria-labelledby="parent-value-heading">
      <h2 id="parent-value-heading">{parentValueCopy.heading}</h2>
      <p className="marketing-lede">{parentValueCopy.lede}</p>

      <dl className="marketing-terms">
        {parentValueCopy.items.map((item) => (
          <div key={item.term} className="marketing-terms__pair">
            <dt className="marketing-terms__term">{item.term}</dt>
            <dd className="marketing-terms__detail">{item.detail}</dd>
          </div>
        ))}
      </dl>

      <p className="marketing-note">{parentValueCopy.note}</p>
    </section>
  );
}
