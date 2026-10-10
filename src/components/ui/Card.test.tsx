import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("renders a plain surface by default", () => {
    render(<Card>Recommended practice mix</Card>);

    const card = screen.getByText("Recommended practice mix");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveClass("ui-card");
    expect(card).not.toHaveClass("ui-card--interactive");
  });

  it("renders as a labelled section when the grouping needs a landmark", () => {
    render(
      <Card as="section" padding="lg" aria-label="Next action">
        <p>Try analogies next.</p>
      </Card>,
    );

    const card = screen.getByRole("region", { name: "Next action" });
    expect(card.tagName).toBe("SECTION");
    expect(card).toHaveClass("ui-card", "ui-card--lg");
  });

  it("marks an interactive card so the whole surface reads as a target", () => {
    render(
      <Card interactive padding="sm">
        <a href="/parent">Continue practice</a>
      </Card>,
    );

    const card = screen.getByRole("link", { name: "Continue practice" })
      .closest(".ui-card");
    expect(card).toHaveClass("ui-card--interactive", "ui-card--sm");
    expect(card).not.toBeNull();
  });

  it("renders a list-item card without inventing extra semantics", () => {
    render(
      <ul>
        <Card as="li">Nonverbal analogies</Card>
      </ul>,
    );

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Nonverbal analogies");
    expect(item).toHaveClass("ui-card");
  });
});
