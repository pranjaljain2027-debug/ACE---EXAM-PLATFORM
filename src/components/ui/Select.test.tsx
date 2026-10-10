import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const options = [
  { value: "daily", label: "A few minutes each day" },
  { value: "weekly", label: "A couple of sessions a week" },
  { value: "unsure", label: "Not sure yet" },
];

describe("Select", () => {
  it("renders every option under a visible label", () => {
    render(<Select label="Preferred schedule" options={options} />);

    const select = screen.getByLabelText("Preferred schedule");
    expect(select).toHaveClass("ui-select__control");
    expect(screen.getByRole("option", { name: "Not sure yet" })).toHaveValue(
      "unsure",
    );
  });

  it("carries the disabled state on the element and in the class contract", () => {
    render(<Select label="Goal" options={options} disabled />);

    const select = screen.getByLabelText("Goal");
    expect(select).toBeDisabled();
    expect(select).toHaveClass("ui-select__control--disabled");
  });

  it("supports an unselected affordance as a disabled first option", () => {
    render(
      <Select
        label="Goal"
        value=""
        onChange={() => {}}
        options={[{ value: "", label: "Choose one", disabled: true }, ...options]}
      />,
    );

    const first = screen.getAllByRole("option")[0]!;
    expect(first).toBeDisabled();
    expect(first).toHaveTextContent("Choose one");
  });

  it("marks an invalid select and associates the error", () => {
    render(
      <Select
        label="Goal"
        options={options}
        error="Pick the goal that fits best."
      />,
    );

    const select = screen.getByLabelText("Goal");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveClass("ui-select__control--error");
    expect(
      screen.getByText("Pick the goal that fits best."),
    ).toHaveAttribute("data-slot", "error");
  });

  it("is keyboard reachable and changes value with the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Goal"
        defaultValue="daily"
        onChange={onChange}
        options={options}
      />,
    );

    await user.tab();
    const select = screen.getByLabelText("Goal");
    expect(select).toHaveFocus();
    expect(select).toHaveValue("daily");

    await user.selectOptions(select, "weekly");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue("weekly");
  });
});
