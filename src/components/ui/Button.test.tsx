import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a primary button by default without being a submit control", () => {
    render(<Button>Start free diagnostic</Button>);

    const button = screen.getByRole("button", { name: "Start free diagnostic" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("ui-button");
    expect(button).toHaveClass("ui-button--primary");
    expect(button).not.toBeDisabled();
  });

  it("carries the disabled state on the element and in the class contract", () => {
    render(<Button disabled>Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("ui-button--disabled");
    expect(button).toHaveAttribute("data-state", "disabled");
  });

  it("marks a loading button busy, disables it, and keeps it announced", () => {
    render(<Button loading>Saving</Button>);

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("ui-button--loading");
    expect(button).toHaveAttribute("data-state", "loading");
    expect(button).toBeDisabled();
  });

  it("is reachable with Tab and operable with the keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit answer</Button>);

    await user.tab();
    const button = screen.getByRole("button", { name: "Submit answer" });
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does not fire onClick while loading or disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button loading onClick={onClick}>
        Continue
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button disabled onClick={onClick}>
        Continue
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders each variant and size through the class contract", () => {
    const { rerender } = render(
      <Button variant="secondary" size="sm">
        Back
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "ui-button--secondary",
      "ui-button--sm",
    );

    rerender(
      <Button variant="ghost" size="lg" fullWidth>
        Skip
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("ui-button--ghost", "ui-button--lg");
    expect(button).toHaveClass("ui-button--full");
  });
});
