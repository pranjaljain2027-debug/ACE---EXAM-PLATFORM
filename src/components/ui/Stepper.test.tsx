import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper } from "./Stepper";

const steps = [
  { id: "age", label: "Age" },
  { id: "experience", label: "Experience" },
  { id: "goal", label: "Goal" },
  { id: "schedule", label: "Schedule" },
  { id: "interests", label: "Interests" },
  { id: "begin", label: "Begin" },
];

describe("Stepper", () => {
  it("renders every step as an ordered list with a progress label", () => {
    render(<Stepper steps={steps} currentIndex={2} label="Setup progress" />);

    const nav = screen.getByRole("navigation", { name: "Setup progress" });
    expect(nav).toHaveClass("ui-stepper");
    expect(screen.getAllByRole("listitem")).toHaveLength(steps.length);
    expect(nav).toHaveTextContent("Age");
    expect(nav).toHaveTextContent("Begin");
  });

  it("marks exactly the current step with aria-current", () => {
    render(<Stepper steps={steps} currentIndex={2} />);

    const current = screen.getByRole("listitem", { current: "step" });
    expect(current).toHaveClass("ui-stepper__item--current");
    expect(current).toHaveTextContent("Goal");
    expect(screen.getAllByRole("listitem", { current: "step" })).toHaveLength(1);
  });

  it("labels completed and upcoming steps without relying on colour", () => {
    render(<Stepper steps={steps} currentIndex={1} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveClass("ui-stepper__item--complete");
    expect(items[0]).toHaveTextContent("Completed: Age");
    expect(items[2]).toHaveClass("ui-stepper__item--upcoming");
    expect(items[2]).toHaveTextContent("Not started: Goal");
  });

  it("lets a completed step be revisited by clicking it", async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(
      <Stepper steps={steps} currentIndex={2} onStepSelect={onStepSelect} />,
    );

    await user.click(screen.getByRole("button", { name: "Completed: Age" }));
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it("lets a completed step be revisited from the keyboard", async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(
      <Stepper steps={steps} currentIndex={2} onStepSelect={onStepSelect} />,
    );

    const previous = screen.getByRole("button", { name: "Completed: Age" });
    await user.tab();
    expect(previous).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it("never exposes a control that can jump past the current step", () => {
    render(<Stepper steps={steps} currentIndex={1} onStepSelect={() => {}} />);

    // R15: onboarding must not be skippable by navigating around it.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Current: Experience" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Not started: Goal" }),
    ).not.toBeInTheDocument();
  });

  it("renders no navigation controls at all when onStepSelect is omitted", () => {
    render(<Stepper steps={steps} currentIndex={3} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Schedule",
    );
  });
});
