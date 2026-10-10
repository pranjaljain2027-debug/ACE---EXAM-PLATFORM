import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("labels the checkbox and keeps the native input in the accessibility tree", () => {
    render(<Checkbox label="Email me a weekly summary" />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Email me a weekly summary",
    });
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(checkbox).toHaveClass("ui-checkbox__input");
    expect(checkbox).not.toBeChecked();
  });

  it("carries the disabled state on the element and in the class contract", () => {
    render(<Checkbox label="Send me reminders" disabled />);

    const checkbox = screen.getByRole("checkbox", { name: "Send me reminders" });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveClass("ui-checkbox__input--disabled");
  });

  it("toggles when the label is clicked, not only the box", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Checkbox label="I agree to the practice reminder" onChange={onChange} />,
    );

    await user.click(screen.getByText("I agree to the practice reminder"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("associates an error with the checkbox and marks it invalid", () => {
    render(
      <Checkbox label="I agree to the practice reminder" error="Confirmation needed." />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription(/Confirmation needed\./);
    expect(screen.getByText("Confirmation needed.")).toHaveAttribute(
      "data-slot",
      "error",
    );
  });

  it("is reachable with Tab and toggles with Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Checkbox label="Turn on reminders" onChange={onChange} />,
    );

    await user.tab();
    const checkbox = screen.getByRole("checkbox", { name: "Turn on reminders" });
    expect(checkbox).toHaveFocus();

    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
