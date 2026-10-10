import { differentiationCopy } from "@/content/marketing/copy";

/**
 * What makes this different from the ordinary shape of practice.
 *
 * The contrast is drawn against a shape, not a rival: nobody is named, and
 * nothing is said about anyone else's product. Two ruled rows and two flows —
 * no cards, no logos, nothing that would need a competitor's name to make the
 * point.
 */
function Flow({ label, steps }: { readonly label: string; readonly steps: readonly string[] }) {
  return (
    <div className="marketing-contrast__row">
      <p className="marketing-contrast__label">{label}</p>
      <ol className="marketing-flow">
        {steps.map((step, index) => (
          <li key={step} className="marketing-flow__step">
            {index > 0 && (
              <span className="marketing-flow__arrow" aria-hidden="true">
                →
              </span>
            )}
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Differentiation() {
  return (
    <section className="marketing-section" aria-labelledby="differentiation-heading">
      <h2 id="differentiation-heading">{differentiationCopy.heading}</h2>
      <p className="marketing-lede">{differentiationCopy.lede}</p>

      <div className="marketing-contrast">
        <Flow label={differentiationCopy.typical.label} steps={differentiationCopy.typical.steps} />
        <Flow label={differentiationCopy.here.label} steps={differentiationCopy.here.steps} />
      </div>
    </section>
  );
}
