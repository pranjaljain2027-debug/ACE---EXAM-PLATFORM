/**
 * Per-area rendering contracts (U14, R28, R33).
 *
 * Two rules, and the second is the one that matters most.
 *
 * Every figure has a text equivalent. A chart a screen reader cannot read is not
 * a chart — it is a picture of data, and this component's whole reason for
 * existing is to be the opposite of that.
 *
 * An area with too few answers renders "not enough data yet", never a zero.
 * A zero-height bar beside a label reading "0%" says "your child did badly at
 * this", when the truth is "we have not assessed this yet". The second reading
 * is worse than showing nothing, which is why it is tested explicitly.
 */
import { render, screen } from "@testing-library/react";
import { AreaBreakdown, describeAreas } from "./AreaBreakdown";
import type { AreaProgress } from "@/lib/scoring/progress";

const MIXED: readonly AreaProgress[] = [
  { area: "nonverbal", answered: 6, correct: 5, sufficient: true, accuracy: 5 / 6, reason: undefined },
  { area: "quantitative", answered: 2, correct: 1, sufficient: false, accuracy: undefined, reason: "Not enough data yet — 2 of 3 questions needed." },
  { area: "verbal", answered: 4, correct: 4, sufficient: true, accuracy: 1, reason: undefined },
];

const NONE_SUFFICIENT: readonly AreaProgress[] = [
  { area: "nonverbal", answered: 1, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
  { area: "quantitative", answered: 0, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
  { area: "verbal", answered: 2, correct: 2, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
];

describe("AreaBreakdown", () => {
  it("reports a percentage only for areas with a sufficient sample", () => {
    render(<AreaBreakdown areas={MIXED} />);

    // Nonverbal 5/6 and verbal 4/4 are reportable.
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders the insufficient-data state rather than 0% for a thin area (AE3)", () => {
    render(<AreaBreakdown areas={MIXED} />);

    // Quantitative answered 1 of 3. The row must not claim 0% — and must not
    // claim 50% either. It must say the sample is too small.
    const quantitativeRow = screen.getByRole("row", { name: /quantitative/i });

    expect(quantitativeRow).toHaveTextContent(/not enough data yet/i);
    // Scoped to the row: `100%` elsewhere on the page legitimately contains the
    // substring `0%`, so a page-wide check would fail for the wrong reason.
    expect(quantitativeRow).not.toHaveTextContent(/\d+%/);
  });

  it("renders no percentages at all when no area has a sufficient sample", () => {
    const { container } = render(<AreaBreakdown areas={NONE_SUFFICIENT} />);

    expect(container.textContent).not.toMatch(/\d+%/);
    expect(screen.getAllByText(/not enough data yet/i).length).toBe(3);
  });

  it("gives every chart a text equivalent naming each figure (R33)", () => {
    render(<AreaBreakdown areas={MIXED} />);

    // The prose summary exists whether or not anyone looks at the table, and
    // carries the same numbers rather than a vague description.
    expect(screen.getByText(describeAreas(MIXED))).toBeInTheDocument();
    expect(describeAreas(MIXED)).toContain("83%");
    expect(describeAreas(MIXED)).toContain("100%");
  });

  it("says plainly that nothing can be reported when no area has enough answers", () => {
    render(<AreaBreakdown areas={NONE_SUFFICIENT} />);

    expect(describeAreas(NONE_SUFFICIENT)).toMatch(/not enough answers yet/i);
  });

  it("uses a table with row and column headers, so the figures are navigable", () => {
    render(<AreaBreakdown areas={MIXED} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("rowheader")).toHaveLength(3);
  });

  it("hides the decorative bars from assistive technology", () => {
    const { container } = render(<AreaBreakdown areas={MIXED} />);

    const bars = container.querySelectorAll(".parent-area-bar");
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar).toHaveAttribute("aria-hidden", "true");
    }
  });
});
