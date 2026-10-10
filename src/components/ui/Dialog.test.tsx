import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open review
      </button>
      <button type="button">Outside control</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Review your answers"
        description="Check each step before continuing."
        footer={
          <button type="button" onClick={() => setOpen(false)}>
            Confirm
          </button>
        }
      >
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>
    </>
  );
}

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Open review" }));
  return screen.getByRole("dialog", { name: "Review your answers" });
};

const dialogContainsFocus = () => {
  const dialog = screen.getByRole("dialog", { hidden: true });
  return dialog.contains(document.activeElement);
};

describe("Dialog", () => {
  it("renders nothing while closed", () => {
    render(<Harness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it("exposes an accessible name, description, and modal semantics", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await openDialog(user);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("ui-dialog");
    expect(dialog).toHaveAccessibleDescription("Check each step before continuing.");
    expect(dialog).toHaveAttribute("aria-labelledby", screen.getByText("Review your answers").id);
  });

  it("moves focus into the dialog when it opens", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);
    expect(dialogContainsFocus()).toBe(true);
  });

  it("traps Tab inside the dialog, cycling forward past the last control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);

    await user.tab();
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "First action" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();

    // Past the last control focus must wrap back inside, never to the page.
    await user.tab();
    expect(close).toHaveFocus();
    expect(dialogContainsFocus()).toBe(true);
  });

  it("traps Shift+Tab inside the dialog, cycling backward past the first control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);

    const close = screen.getByRole("button", { name: "Close" });
    close.focus();

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
    expect(dialogContainsFocus()).toBe(true);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger after closing on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open review" });
    await openDialog(user);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("returns focus to the trigger after closing with the close button", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open review" });
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("locks background scrolling while open and releases it after", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});
