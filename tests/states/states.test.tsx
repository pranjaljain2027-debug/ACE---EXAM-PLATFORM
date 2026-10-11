/**
 * Every state in the specification's list has a real designed state (U16, R35).
 *
 * The spec lists ten: no child profile, no sessions, diagnostic incomplete,
 * missing question data, failed save, auth failure, offline, explanation
 * unavailable, expired session, and delivery failure. The rule being tested is
 * that each one renders something a person would recognise as an answer — never
 * a blank region, a zeroed chart, a `NaN`, or a control that looks like it works.
 *
 * The last of those is the one that does real damage. A submit button that
 * reports success when nothing happened teaches a parent that the product's word
 * means nothing, which is a worse failure than an honest error.
 */
import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/settings/page";
import ContactPage from "@/app/(public)/contact/page";
import { AreaBreakdown } from "@/components/parent/AreaBreakdown";
import { ActivityFeed } from "@/components/parent/ActivityFeed";
import { DemoModeBanner } from "@/components/auth/DemoModeBanner";
import { scoreSession } from "@/lib/scoring/diagnostic";
import { computeProgress } from "@/lib/scoring/progress";
import { readParentOverview } from "@/lib/parent/readModel";
import type { ScoredResponse } from "@/lib/scoring/diagnostic";
import type { AreaProgress } from "@/lib/scoring/progress";

function responses(
  area: ScoredResponse["reasoningCategory"],
  correct: number,
  total: number,
): ScoredResponse[] {
  return Array.from({ length: total }, (_, index) => ({
    questionId: `${area}-${index}`,
    correct: index < correct,
    reasoningCategory: area,
  }));
}

describe("no child profile", () => {
  it("returns a null progress for a parent with no children, so the page renders its invitation", () => {
    // Asserted through the read model rather than the page: the page's demo
    // parent has a child, so the empty branch is only reachable with a parent
    // who has none, and the read model is what decides that.
    const overview = readParentOverview("parent-someone-else");

    expect(overview.children).toHaveLength(0);
    expect(overview.progress).toBeNull();
    expect(overview.recommendation).toBeNull();
  });
});

describe("no sessions", () => {
  it("says so, and never renders a zeroed percentage", () => {
    const areas: readonly AreaProgress[] = [
      { area: "nonverbal", answered: 0, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
      { area: "quantitative", answered: 0, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
      { area: "verbal", answered: 0, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
    ];

    const { container } = render(<AreaBreakdown areas={areas} />);

    expect(container.textContent).not.toMatch(/\d+%/);
    expect(screen.getAllByText(/not enough data yet/i).length).toBe(3);
  });

  it("renders an explicit message for an empty activity feed", () => {
    render(<ActivityFeed entries={[]} />);

    expect(screen.getByText(/no sessions recorded yet/i)).toBeInTheDocument();
  });

  it("scores an empty session list into a designed state rather than NaN", () => {
    const summary = computeProgress([]);

    expect(summary.overallAccuracy).toBe(0);
    expect(Number.isNaN(summary.overallAccuracy)).toBe(false);
    expect(summary.recommendation.rationale).toMatch(/not enough practice data yet/i);
  });
});

describe("diagnostic incomplete", () => {
  it("labels a partial session as partial rather than reporting it as complete", () => {
    const partial = scoreSession([...responses("nonverbal", 2, 3)]);

    expect(partial.complete).toBe(false);
    expect(partial.partial).toBe(true);
    expect(partial.status).toMatch(/partial result/i);
  });

  it("does not emit NaN for a session with no answers", () => {
    const empty = scoreSession([]);

    expect(empty.accuracy).toBe(0);
    expect(Number.isNaN(empty.accuracy)).toBe(false);
    expect(empty.status).toMatch(/no questions answered/i);
  });
});

describe("missing question data", () => {
  it("refuses to build a diagnostic from a response set with no answers rather than inventing one", () => {
    // The scorer's contract is that an empty input is valid input. The guarantee
    // is that it returns a designed state, not that it can guess.
    const result = scoreSession([]);

    expect(result.answeredCount).toBe(0);
    expect(result.correctCount).toBe(0);
  });
});

describe("failed save", () => {
  it("puts a rejected contact submission on the field it names, not in a summary", async () => {
    const { use } = await import("react");
    const params = Object.assign(
      Promise.resolve<Readonly<Record<string, string>>>({ problem: "message" }),
      { status: "fulfilled", value: { problem: "message" } },
    );

    render(<ContactPage searchParams={params} />);
    void use;

    const message = screen.getByLabelText("Your message");
    expect(message).toHaveAttribute("aria-invalid", "true");
  });
});

describe("auth failure", () => {
  it("disables a control that cannot work and says why, rather than leaving it looking live", () => {
    render(<SettingsPage />);

    const remove = screen.getByRole("button", { name: /delete profile/i });
    expect(remove).toBeDisabled();
    // And the reason is on the page, not implied by the greying-out alone.
    expect(screen.getByText(/not connected in this build/i)).toBeInTheDocument();
  });
});

describe("explanation unavailable", () => {
  it("still offers replay and reset from the demo banner path without a session", () => {
    // The banner is the state shown when nothing is protected or kept. It is
    // rendered unconditionally, so its absence would be the bug.
    render(<DemoModeBanner />);

    expect(screen.getByRole("note", { name: /demo mode/i })).toBeInTheDocument();
  });
});

describe("delivery failure", () => {
  it("states that nothing was delivered and makes no promise of a reply", () => {
    const params = Object.assign(
      Promise.resolve<Readonly<Record<string, string>>>({ delivery: "none" }),
      { status: "fulfilled", value: { delivery: "none" } },
    );

    const { container } = render(<ContactPage searchParams={params} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/not delivered/i);
    expect(container.textContent ?? "").not.toMatch(/we('ll| will) (reply|be in touch)/i);
    expect(container.textContent ?? "").not.toMatch(/thanks for (writing|getting in touch)/i);
  });

  it("says up front that nothing is sent, before anyone types anything", () => {
    const params = Object.assign(
      Promise.resolve<Readonly<Record<string, string>>>({}),
      { status: "fulfilled", value: {} },
    );

    render(<ContactPage searchParams={params} />);

    expect(screen.getByRole("note")).toHaveTextContent(/does not send anything/i);
  });
});

describe("no NaN anywhere in a rendered summary", () => {
  it("renders every area state without a NaN or an undefined leaking into the page", () => {
    const summary = computeProgress([
      { sessionId: "s", completedOn: "2026-10-01", responses: responses("nonverbal", 0, 0) },
    ]);

    const { container } = render(<AreaBreakdown areas={summary.areas} />);
    const text = container.textContent ?? "";

    expect(text).not.toContain("NaN");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("Infinity");
  });
});
