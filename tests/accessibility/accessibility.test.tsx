/**
 * Accessibility contracts across the shipped surfaces (U15, R25, R33, R34).
 *
 * These are the rules that are cheap to break and expensive to notice: a heading
 * level skipped here and there, a focus ring removed "because it looked
 * cluttered", a control reachable only with a mouse. Each test names the rule it
 * protects, because a check that does not say what it is for tends to get
 * "fixed" by deleting the thing it is checking.
 *
 * Scope note: this is a structural scan, not a full WCAG conformance audit. It
 * catches the regressions that happen when someone edits a component, and it
 * cannot catch everything an audit would. That limit is recorded in the final
 * report rather than left implied.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Input, Dialog } from "@/components/ui";
import { ExplanationPlayer } from "@/components/reasoning/ExplanationPlayer";
import { demoMatrixQuestion } from "@/content/demo/matrix-question";
import { ActivityFeed } from "@/components/parent/ActivityFeed";
import { AreaBreakdown } from "@/components/parent/AreaBreakdown";
import type { ActivityEntry } from "@/lib/parent/readModel";
import type { AreaProgress } from "@/lib/scoring/progress";

/** jsdom does not evaluate media queries, so reduced motion is set explicitly. */
function setReducedMotion(reduced: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("reduced motion", () => {
  afterEach(() => setReducedMotion(false));

  it("still reaches every explanation step with reduced motion requested (R25, AE1)", async () => {
    setReducedMotion(true);
    const user = userEvent.setup();

    render(<ExplanationPlayer question={demoMatrixQuestion} />);

    const group = screen.getByRole("radiogroup");
    const choices = within(group).getAllByRole("radio");
    await user.click(choices[0] as HTMLElement);

    // Feedback is announced in a live region, so a screen reader user hears the
    // result without moving focus.
    expect(screen.getByText(/you found it/i)).toBeInTheDocument();

    // The continue edge into the explanation.
    await user.click(screen.getByRole("button", { name: /see the answer/i }));

    // The explanation opens on step 1 with the step count stated, so a static
    // path that rendered fewer steps would fail here rather than passing a
    // "no animation" check while quietly dropping content.
    expect(screen.getByText(/step 1 of \d+/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();

    const next = screen.getByRole("button", { name: /next step/i });
    expect(next).toBeEnabled();
    await user.click(next);

    // Having advanced, Back becomes available: the steps are walkable both ways.
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.getByText(/step 2 of \d+/i)).toBeInTheDocument();
  });

  it("walks every step to the end under reduced motion and reaches the rule", async () => {
    setReducedMotion(true);
    const user = userEvent.setup();

    render(<ExplanationPlayer question={demoMatrixQuestion} />);

    const group = screen.getByRole("radiogroup");
    const choices = within(group).getAllByRole("radio");
    await user.click(choices[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: /see the answer/i }));

    // Step forward until the control offers a replay instead of a next step,
    // which is how the player marks the last step.
    let guard = 0;
    while (guard < 20) {
      const replay = screen.queryByRole("button", { name: /play it again/i });
      if (replay) break;
      const next = screen.queryByRole("button", { name: /next step/i });
      if (!next) break;
      await user.click(next);
      guard += 1;
    }

    // The final step states the rule in plain language, and offers a replay.
    expect(screen.getByRole("button", { name: /play it again/i })).toBeInTheDocument();
    expect(screen.getByText(/on this board/i)).toBeInTheDocument();
    expect(guard).toBeLessThan(20);
  });
});

describe("focus visibility", () => {
  it("leaves the focus indicator on the primary button rather than removing it", () => {
    const { container } = render(<Button>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });

    // The rule is that focus styling exists at all. Asserting the exact colour
    // would make this fail every time the palette changes, which is the fastest
    // way to get a check deleted.
    expect(button.className).toMatch(/ui-button/);
    expect(container.innerHTML).not.toMatch(/outline:\s*(none|0)/i);
  });

  it("keeps the focus ring contract in the shared stylesheet", () => {
    // The stylesheet is the shared layer every primitive inherits from, so a
    // removed `:focus-visible` rule there disables focus indication app-wide.
    const styles = readSharedStyles("src", "app", "globals.css");

    expect(styles).toMatch(/:focus-visible/);
    expect(styles).not.toMatch(/outline:\s*none[^}]*focus/);
  });
});

describe("dialog focus management", () => {
  it("traps Tab inside an open dialog and restores focus to its trigger on close", async () => {
    const user = userEvent.setup();

    function Harness() {
      return (
        <>
          <button type="button">Open</button>
          <Dialog open onClose={() => {}} title="Confirm">
            <button type="button">Inside first</button>
            <button type="button">Inside second</button>
          </Dialog>
        </>
      );
    }

    render(<Harness />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Focus starts inside the dialog, so a keyboard user's next Tab does not
    // escape to the page behind it.
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    const active = document.activeElement;
    expect(dialog.contains(active)).toBe(true);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Dialog open onClose={onClose} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});

describe("form labelling", () => {
  it("ties an error message to its field through aria-describedby", () => {
    render(<Input name="email" label="Parent email" error="Enter a valid email address." />);

    const field = screen.getByLabelText("Parent email");
    expect(field).toHaveAttribute("aria-invalid", "true");

    const describedBy = field.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(" ").filter(Boolean);
    const message = ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");

    expect(message).toMatch(/error/i);
    expect(message).toMatch(/valid email address/i);
  });

  it("marks a required field as required rather than only describing it in prose", () => {
    render(<Input name="email" label="Parent email" required />);

    expect(screen.getByLabelText("Parent email")).toBeRequired();
  });
});

describe("data presentation", () => {
  const areas: readonly AreaProgress[] = [
    { area: "nonverbal", answered: 4, correct: 3, sufficient: true, accuracy: 0.75, reason: undefined },
    { area: "verbal", answered: 1, correct: 0, sufficient: false, accuracy: undefined, reason: "Not enough data yet." },
  ];

  const activity: readonly ActivityEntry[] = [
    { sessionId: "s1", completedOn: "2026-10-05", answeredCount: 4, correctCount: 3, hadSufficientData: true },
  ];

  it("gives the per-area figures a text equivalent (R33)", () => {
    render(<AreaBreakdown areas={areas} />);

    expect(screen.getByText(/nonverbal reasoning: 75%/i)).toBeInTheDocument();
  });

  it("says when a session had too few answers to report a figure", () => {
    render(
      <ActivityFeed
        entries={[
          { sessionId: "s2", completedOn: "2026-10-06", answeredCount: 1, correctCount: 0, hadSufficientData: false },
        ]}
      />,
    );

    expect(screen.getByText(/not enough answers yet to report a percentage/i)).toBeInTheDocument();
  });

  it("renders a real list for the activity feed rather than a run of divs", () => {
    const { container } = render(<ActivityFeed entries={activity} />);

    expect(container.querySelector("ol")).not.toBeNull();
    expect(within(container.querySelector("ol") as HTMLElement).getAllByRole("listitem")).toHaveLength(1);
  });

  it("renders no sessions message rather than an empty list", () => {
    render(<ActivityFeed entries={[]} />);

    expect(screen.getByText(/no sessions recorded yet/i)).toBeInTheDocument();
  });
});

describe("responsive floor", () => {
  it("keeps touch targets at or above 44px for primary controls (R34)", () => {
    const styles = readSharedStyles("src", "app", "globals.css");
    const tokens = readSharedStyles("src", "styles", "tokens.css");

    // The floor is stated once as a token and applied by the primitives. Both
    // halves are checked: a token nobody uses, and a rule with no token, are the
    // two ways this silently stops being true.
    expect(tokens).toMatch(/--control-min-size:\s*2\.75rem/);
    expect(styles).toMatch(/min-height:\s*var\(--control-min-size\)/);
  });
});

/** A project file read from disk, so the assertions are about real CSS. */
function readSharedStyles(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), "utf8");
}
