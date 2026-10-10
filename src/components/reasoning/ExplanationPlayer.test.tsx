/**
 * The landing demo's full sequence, driven the way a visitor drives it.
 *
 * Everything here goes through `ExplanationPlayer` — the real entry point the
 * landing page uses — rather than through the state hook, so a change that
 * breaks the walkthrough breaks these tests.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ExplanationPlayer } from "./ExplanationPlayer";
import { demoMatrixQuestion } from "@/content/demo/matrix-question";

/* -------------------------------------------------------------------------- */
/* Harness                                                                     */
/* -------------------------------------------------------------------------- */

interface HarnessProps {
  submitMode?: "direct" | "explicit";
  onExplanationViewed?: () => void;
}

function Harness({
  submitMode = "direct",
  onExplanationViewed,
}: HarnessProps) {
  const [key, setKey] = useState(0);
  return (
    <>
      <button type="button">Before</button>
      <ExplanationPlayer
        key={key}
        question={demoMatrixQuestion}
        submitMode={submitMode}
        onExplanationViewed={onExplanationViewed}
      />
      <button type="button" onClick={() => setKey((n) => n + 1)}>
        After
      </button>
    </>
  );
}

const steps = demoMatrixQuestion.explanation;

const player = () => screen.getByRole("region", { name: demoMatrixQuestion.prompt });
const stepPanel = () =>
  screen.getByRole("region", { name: new RegExp(`^Step \\d+ of ${steps.length}`) });
const feedback = () => screen.getByRole("status");
const choiceNamed = (name: RegExp) => screen.getByRole("radio", { name });

/**
 * Walks the explanation from the current step to the last, checking that each
 * step shows its own authored narration before moving on.
 */
async function walkToTheEnd(user: ReturnType<typeof userEvent.setup>) {
  for (const [index, step] of steps.entries()) {
    expect(within(stepPanel()).getByText(step.narration)).toBeInTheDocument();
    expect(stepPanel()).toHaveTextContent(`Step ${index + 1} of ${steps.length}`);
    if (index < steps.length - 1) {
      await user.click(screen.getByRole("button", { name: "Next step" }));
    }
  }
  expect(screen.getByRole("button", { name: "Play it again" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next step" })).not.toBeInTheDocument();
}

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                             */
/* -------------------------------------------------------------------------- */

const originalMatchMedia = window.matchMedia;

/**
 * jsdom never evaluates `prefers-reduced-motion`, so the reduced-motion path is
 * only reachable by giving the browser object a media query list to read.
 */
function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

/* -------------------------------------------------------------------------- */
/* Scenario 2 — the full sequence                                             */
/* -------------------------------------------------------------------------- */

describe("the demo walkthrough", () => {
  it("shows the board, takes a choice, and steps the explanation to the rule", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // The board is on screen before anything is answered.
    expect(screen.getByRole("img", { name: /Row 1:.*empty square/ })).toBeInTheDocument();
    expect(feedback().textContent).toBe("");

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    expect(feedback()).toHaveTextContent(/You found it/);
    expect(feedback()).toHaveTextContent(/row 3/);

    await user.click(screen.getByRole("button", { name: "See the answer" }));
    await walkToTheEnd(user);
  });

  it("replays the explanation and resets back to an unanswered board", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    await walkToTheEnd(user);

    await user.click(screen.getByRole("button", { name: "Play it again" }));
    expect(stepPanel()).toHaveTextContent("Step 1 of");

    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.queryByRole("region", { name: /^Step \d+ of/ })).not.toBeInTheDocument();
    expect(feedback().textContent).toBe("");
    expect(choiceNamed(/an outlined arrow pointing up/)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("reports the explanation as read only once the last step is reached", async () => {
    const user = userEvent.setup();
    let timesReported = 0;
    render(<Harness onExplanationViewed={() => (timesReported += 1)} />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    expect(timesReported).toBe(0);

    await walkToTheEnd(user);
    expect(timesReported).toBe(1);
  });

  it("fills the empty square at the reveal step and keeps it there", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    expect(screen.getByRole("img", { name: /empty square/ })).toBeInTheDocument();

    const revealIndex = steps.findIndex((step) => step.operation === "reveal");
    for (let index = 0; index < revealIndex; index += 1) {
      expect(screen.getByRole("img", { name: /empty square/ })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next step" }));
    }

    expect(screen.queryByRole("img", { name: /empty square/ })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /an outlined arrow pointing up/ })).toBeInTheDocument();

    // Stepping on to the rule does not take the answer back out of the square.
    await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.queryByRole("img", { name: /empty square/ })).not.toBeInTheDocument();
  });

  it("waits for an explicit check when the host asks for one", async () => {
    const user = userEvent.setup();
    render(<Harness submitMode="explicit" />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    expect(feedback().textContent).toBe("");
    expect(screen.queryByRole("button", { name: "See the answer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(feedback()).toHaveTextContent(/You found it/);
  });
});

/* -------------------------------------------------------------------------- */
/* Scenario 3 — reduced motion                                                */
/* -------------------------------------------------------------------------- */

describe("with prefers-reduced-motion: reduce", () => {
  it("takes the static path and still reaches every step", async () => {
    setReducedMotion(true);
    const user = userEvent.setup();
    render(<Harness />);

    expect(player()).toHaveAttribute("data-motion", "static");

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    await walkToTheEnd(user);
  });

  it("plays motion on the animated path", async () => {
    setReducedMotion(false);
    render(<Harness />);

    expect(player()).toHaveAttribute("data-motion", "animated");
  });

  it("draws the transformation already turned, with no transition to run", async () => {
    setReducedMotion(true);
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    const transformIndex = steps.findIndex((step) => step.operation === "transform");
    for (let index = 0; index < transformIndex; index += 1) {
      await user.click(screen.getByRole("button", { name: "Next step" }));
    }

    expect(screen.getByText("The turn on its own")).toBeInTheDocument();

    const turned = document.querySelector('[data-glyph-id="glyph-r3c2"] [data-slot="turn"]');
    expect(turned).not.toBeNull();
    const style = turned?.getAttribute("style") ?? "";
    expect(style).toContain("rotate(0deg)");
    expect(style).not.toContain("transition");
  });
});

/* -------------------------------------------------------------------------- */
/* Scenario 4 — keyboard only                                                 */
/* -------------------------------------------------------------------------- */

describe("keyboard-only operation", () => {
  it("reaches every control in a logical order and never traps focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // One tab stop for the whole answer group: the roving tabindex.
    await user.tab();
    expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
    await user.tab();
    expect(choiceNamed(/an outlined arrow pointing up/)).toHaveFocus();

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));

    // Focus moves into the explanation, which now owns the arrow keys.
    expect(stepPanel()).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(stepPanel()).toHaveTextContent("Step 1 of");
    await user.keyboard("{ArrowRight}");
    expect(stepPanel()).toHaveTextContent("Step 2 of");

    await user.tab();
    expect(screen.getByRole("button", { name: "Back" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next step" })).toHaveFocus();

    // Tabbing forward leaves the player for the page after it, and tabbing
    // back comes straight in again: nothing here holds focus.
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next step" })).toHaveFocus();
  });

  it("moves between choices with the arrow keys without choosing one", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.tab();
    expect(choiceNamed(/an outlined arrow pointing up/)).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(choiceNamed(/an outlined arrow pointing left/)).toHaveFocus();
    expect(feedback().textContent).toBe("");

    await user.keyboard("{ArrowRight}");
    expect(choiceNamed(/an outlined arrow pointing down/)).toHaveFocus();
    expect(feedback().textContent).toBe("");

    await user.keyboard("{ArrowLeft}");
    expect(choiceNamed(/an outlined arrow pointing left/)).toHaveFocus();
    expect(feedback().textContent).toBe("");
  });

  it("selects the focused choice with Space and with Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(feedback()).toHaveTextContent(/direction/);

    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(choiceNamed(/an outlined arrow pointing up/)).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(choiceNamed(/a solid arrow pointing up/)).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(choiceNamed(/a solid arrow pointing up/)).toHaveAttribute("aria-checked", "true");
    expect(feedback()).toHaveTextContent(/outline/i);
  });

  it("takes the arrow keys out of the answer group once the explanation is showing", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));

    await user.keyboard("{ArrowRight}");
    expect(stepPanel()).toHaveTextContent("Step 2 of");

    // The choices can still be re-read by pointer, but they are never a tab
    // stop and never a target for the arrow keys while they belong to the
    // explanation.
    expect(screen.getByRole("radiogroup")).toHaveAttribute("inert");
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("tabindex", "-1");
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Scenario 5 — the live region                                               */
/* -------------------------------------------------------------------------- */

describe("feedback", () => {
  it("is announced through a polite live region that is already on the page", () => {
    render(<Harness />);

    const region = feedback();
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region.textContent).toBe("");
  });

  it("says what to look at, not just right or wrong", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing up/));

    const text = feedback().textContent ?? "";
    expect(text).toMatch(/You found it/);
    expect(text).toMatch(/quarter turn/);
    expect(text.length).toBeGreaterThan(40);
  });
});

/* -------------------------------------------------------------------------- */
/* Scenario 6 — a wrong answer is still a lesson                              */
/* -------------------------------------------------------------------------- */

describe("choosing a wrong picture", () => {
  it("never punishes, and still hands over the rule", async () => {
    const user = userEvent.setup();

    // Both kinds of wrong answer: one that breaks the turning rule, one that
    // breaks the filling rule. Neither may turn into a scolding or a red wall.
    for (const wrong of [/an outlined arrow pointing left/, /a solid arrow pointing up/]) {
      const { unmount } = render(<Harness />);
      await user.click(choiceNamed(wrong));

      const text = feedback().textContent ?? "";
      expect(text).not.toMatch(/\b(fail|failed|wrong|incorrect|sorry|oops|stupid|try again)\b/i);
      expect(text.length).toBeGreaterThan(40);
      unmount();
    }

    render(<Harness />);
    await user.click(choiceNamed(/a solid arrow pointing up/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    await walkToTheEnd(user);
    expect(screen.getByText(steps[steps.length - 1]?.narration ?? "")).toBeInTheDocument();
  });

  it("names which rule was missed, whichever one the wrong picture broke", async () => {
    const user = userEvent.setup();

    const { unmount } = render(<Harness />);
    await user.click(choiceNamed(/an outlined arrow pointing left/));
    expect(feedback()).toHaveTextContent(/direction/);
    unmount();

    render(<Harness />);
    await user.click(choiceNamed(/a solid arrow pointing up/));
    expect(feedback()).toHaveTextContent(/outline/i);
    expect(feedback()).not.toHaveTextContent(/direction/);
  });

  it("marks the answer with an icon and words, never colour alone", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(choiceNamed(/an outlined arrow pointing left/));
    await user.click(screen.getByRole("button", { name: "See the answer" }));
    await walkToTheEnd(user);

    const correct = choiceNamed(/The answer/);
    expect(correct).toHaveAttribute("aria-checked", "false");
    expect(correct).toHaveTextContent("The answer");
    expect(correct.querySelector('[data-slot="state-icon"]')).not.toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Landmarks                                                                  */
/* -------------------------------------------------------------------------- */

describe("the player's landmarks", () => {
  it("is a labelled region that reads the board as one picture", () => {
    render(<Harness />);

    expect(player().tagName).toBe("SECTION");

    const board = within(player()).getByRole("img");
    expect(board.tagName.toLowerCase()).toBe("svg");
    expect(board.getAttribute("aria-label")).toMatch(/Row 1:.*Row 2:.*Row 3:/);
  });

  it("keeps the answer group a named radio group", () => {
    render(<Harness />);

    expect(
      screen.getByRole("radiogroup", { name: "Choose a picture" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});