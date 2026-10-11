/**
 * Per-area performance (U14, R28, R33).
 *
 * Every figure has a text equivalent, because a chart a screen reader cannot
 * read is not a chart — it is a picture of data. The table is the source of
 * truth and the bars are decoration on top of it.
 *
 * An area with too few answers renders the insufficient-data state rather than a
 * bar. A zero-height bar next to a label reading "0%" says "your child did
 * badly at this", which is not what "we have not assessed this" means.
 */
import type { AreaProgress } from "@/lib/scoring/progress";

const AREA_LABELS: Record<string, string> = {
  nonverbal: "Nonverbal reasoning",
  quantitative: "Quantitative reasoning",
  verbal: "Verbal reasoning",
};

/**
 * The same numbers, in a sentence.
 *
 * Kept next to the chart rather than generated from it so the wording is part of
 * the component and can be reviewed, instead of being derived from a rounding
 * decision made somewhere else.
 */
export function describeAreas(areas: readonly AreaProgress[]): string {
  const reported = areas.filter((area) => area.sufficient && area.accuracy !== undefined);
  if (reported.length === 0) {
    return "Not enough answers yet in any reasoning area to report a percentage.";
  }

  const parts = reported.map(
    (area) =>
      `${AREA_LABELS[area.area] ?? area.area}: ${Math.round((area.accuracy ?? 0) * 100)}% from ${area.answered} questions`,
  );
  return `${parts.join(". ")}.`;
}

export interface AreaBreakdownProps {
  readonly areas: readonly AreaProgress[];
}

export function AreaBreakdown({ areas }: AreaBreakdownProps) {
  return (
    <section aria-labelledby="area-breakdown-heading">
      <h2 id="area-breakdown-heading">Progress by reasoning area</h2>

      {/* The text equivalent, always present, read by assistive technology
          before the visual bars. */}
      <p className="ui-visually-hidden">{describeAreas(areas)}</p>

      <table className="parent-area-table">
        <caption className="ui-visually-hidden">
          Percentage of practice questions answered correctly, by reasoning area.
        </caption>
        <thead>
          <tr>
            <th scope="col">Reasoning area</th>
            <th scope="col">Questions</th>
            <th scope="col">Correct</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.area}>
              <th scope="row">{AREA_LABELS[area.area] ?? area.area}</th>
              <td>{area.answered}</td>
              <td>{area.correct}</td>
              <td>
                {area.sufficient && area.accuracy !== undefined ? (
                  <>
                    <span className="parent-area-value">
                      {Math.round(area.accuracy * 100)}%
                    </span>
                    <span
                      className="parent-area-bar"
                      role="presentation"
                      aria-hidden="true"
                      style={{ inlineSize: `${Math.round(area.accuracy * 100)}%` }}
                    />
                  </>
                ) : (
                  <span className="parent-area-insufficient">Not enough data yet</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
