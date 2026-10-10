/**
 * U2 Test scenario 1: every primitive renders, in its default state and in the
 * disabled state its role admits, without leaking a React or jsdom warning.
 *
 * A primitive that warns on render is a primitive every later unit inherits a
 * warning from, so this is checked once here rather than in each later unit.
 */
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";
import { Callout } from "./Callout";
import { Card } from "./Card";
import { Checkbox } from "./Checkbox";
import { Disclosure } from "./Disclosure";
import { Dialog } from "./Dialog";
import { Input } from "./Input";
import { Select } from "./Select";
import { Stepper } from "./Stepper";

function captureConsole() {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  return {
    assertClean() {
      expect({ error: error.mock.calls, warn: warn.mock.calls }).toEqual({
        error: [],
        warn: [],
      });
    },
    restore() {
      error.mockRestore();
      warn.mockRestore();
    },
  };
}

describe("primitives render without console errors", () => {
  let console_: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    console_ = captureConsole();
  });

  afterEach(() => {
    console_.assertClean();
    console_.restore();
  });

  it("renders every primitive in its default state", () => {
    render(
      <div>
        <Button>Continue</Button>
        <Input label="Child age band" />
        <Select label="Goal" options={[{ value: "a", label: "Option A" }]} />
        <Checkbox label="Send reminders" />
        <Stepper steps={[{ id: "age", label: "Age" }]} currentIndex={0} />
        <Card>Grouped content</Card>
        <Disclosure summary="What ages is this for?">Ages five to thirteen.</Disclosure>
        <Dialog open onClose={() => {}} title="Review">
          Body
        </Dialog>
        <Callout>Progress saved.</Callout>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByLabelText("Child age band")).toBeInTheDocument();
    expect(screen.getByLabelText("Goal")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Send reminders" })).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("renders every form primitive in its disabled state", () => {
    render(
      <div>
        <Button disabled>Continue</Button>
        <Input label="Child age band" disabled />
        <Select label="Goal" options={[{ value: "a", label: "Option A" }]} disabled />
        <Checkbox label="Send reminders" disabled />
      </div>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.getByLabelText("Child age band")).toBeDisabled();
    expect(screen.getByLabelText("Goal")).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Send reminders" })).toBeDisabled();
  });
});
