import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Disclosure } from "./Disclosure";

const PANEL_TEXT = "Practice is written for children roughly five to thirteen.";

function Harness({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Disclosure summary="What ages is this designed for?" defaultOpen={defaultOpen}>
      {PANEL_TEXT}
    </Disclosure>
  );
}

const panel = () => screen.getByText(PANEL_TEXT);

describe("Disclosure", () => {
  it("renders the summary as a collapsed toggle wired to a labelled region", () => {
    render(<Harness />);

    const toggle = screen.getByRole("button", {
      name: "What ages is this designed for?",
    });
    expect(toggle).toHaveClass("ui-disclosure__trigger");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", panel().id);
    expect(panel()).toHaveAttribute("role", "region");
    expect(panel()).toHaveAttribute("aria-labelledby", toggle.id);
    expect(panel()).not.toBeVisible();
  });

  it("reveals the panel on click and hides it again", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const toggle = screen.getByRole("button");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel()).toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel()).not.toBeVisible();
  });

  it("starts open when defaultOpen is set", () => {
    render(<Harness defaultOpen />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(panel()).toBeVisible();
  });

  it("toggles from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("stays controlled when open and onOpenChange are supplied", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Disclosure
          summary="How long does a session take?"
          open={open}
          onOpenChange={setOpen}
        >
          About ten minutes.
        </Disclosure>
      );
    }

    render(<Controlled />);
    const toggle = screen.getByRole("button");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
