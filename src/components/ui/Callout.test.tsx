import { render, screen } from "@testing-library/react";
import { Callout } from "./Callout";

describe("Callout", () => {
  it("renders informational content as a note", () => {
    render(<Callout>Practice answers are yours to keep.</Callout>);

    const callout = screen.getByRole("note");
    expect(callout).toHaveClass("ui-callout", "ui-callout--info");
    expect(callout).toHaveTextContent("Practice answers are yours to keep.");
  });

  it("announces success as a status, not as a silent colour change", () => {
    render(<Callout tone="success" title="Progress saved" />);

    const callout = screen.getByRole("status");
    expect(callout).toHaveClass("ui-callout--success");
    expect(callout).toHaveTextContent("Success");
    expect(callout).toHaveTextContent("Progress saved");
  });

  it("announces an error as an alert", () => {
    render(<Callout tone="error">That answer could not be saved.</Callout>);

    const callout = screen.getByRole("alert");
    expect(callout).toHaveClass("ui-callout--error");
    expect(callout).toHaveTextContent("Error");
  });

  it("states its tone in text so meaning never depends on colour alone", () => {
    render(<Callout tone="warning" />);

    const callout = screen.getByRole("note");
    expect(callout).toHaveTextContent("Warning");
    expect(callout.querySelector("[data-tone-label]")).not.toBeNull();
  });

  it("renders each supported tone", () => {
    const { rerender } = render(<Callout tone="info" />);
    expect(screen.getByRole("note")).toHaveClass("ui-callout--info");

    rerender(<Callout tone="success" />);
    expect(screen.getByRole("status")).toHaveClass("ui-callout--success");

    rerender(<Callout tone="warning" />);
    expect(screen.getByRole("note")).toHaveClass("ui-callout--warning");

    rerender(<Callout tone="error" />);
    expect(screen.getByRole("alert")).toHaveClass("ui-callout--error");
  });
});
