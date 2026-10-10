import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("associates its visible label with the field", () => {
    render(<Input label="Child age band" name="age" />);

    const input = screen.getByLabelText("Child age band");
    expect(input).toHaveAttribute("name", "age");
    expect(input).toHaveClass("ui-input");
  });

  it("generates a unique id per field so each label points at its own control", () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );

    const first = screen.getByLabelText("First");
    const second = screen.getByLabelText("Second");

    expect(first.id).not.toBe("");
    expect(first.id).not.toBe(second.id);
    expect(document.querySelector(`label[for="${first.id}"]`)).not.toBeNull();
  });

  it("carries the disabled state on the element and in the class contract", () => {
    render(<Input label="Parent email" disabled />);

    const input = screen.getByLabelText("Parent email");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("ui-input--disabled");
  });

  it("describes the field with its hint when no error is present", () => {
    render(<Input label="Age band" hint="We never ask for a date of birth." />);

    const input = screen.getByLabelText("Age band");
    expect(input).toHaveAccessibleDescription(
      "We never ask for a date of birth.",
    );
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("associates an error with the field and marks it invalid", () => {
    render(
      <Input
        label="Parent email"
        hint="Used to reach you about practice."
        error="Enter an email address that includes an @."
      />,
    );

    const input = screen.getByLabelText("Parent email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("ui-input--error");
    expect(
      screen.getByText("Enter an email address that includes an @."),
    ).toHaveAttribute("data-slot", "error");
    expect(input).toHaveAccessibleDescription(
      /Enter an email address that includes an @\./,
    );
  });

  it("prefers the error over the success message when both are supplied", () => {
    render(
      <Input
        label="Answer"
        successMessage="The answer was stored."
        error="Answer a question."
      />,
    );

    const input = screen.getByLabelText("Answer");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Answer a question.")).toBeInTheDocument();
    expect(screen.queryByText("The answer was stored.")).not.toBeInTheDocument();
  });

  it("announces a success message without marking the field invalid", () => {
    render(
      <Input
        label="Child nickname"
        defaultValue="Ari"
        successMessage="The nickname is stored."
      />,
    );

    const input = screen.getByLabelText("Child nickname");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveClass("ui-input--success");
    expect(input).toHaveAccessibleDescription("Saved: The nickname is stored.");
  });

  it("is reachable with Tab and accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Input label="Parent email" />);

    await user.tab();
    const input = screen.getByLabelText("Parent email");
    expect(input).toHaveFocus();

    await user.keyboard("a@b.co");
    expect(input).toHaveValue("a@b.co");
  });
});
