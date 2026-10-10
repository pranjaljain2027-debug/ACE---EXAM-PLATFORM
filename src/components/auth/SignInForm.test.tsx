/**
 * The sign-in / sign-up form (U6, R17, R35).
 *
 * What a parent meets on these two pages is one email field, a button, and
 * whatever the app says back. Three things are asserted here, and they are the
 * three that matter:
 *
 *  - The field is labelled and reachable (KTD8).
 *  - A rejected address produces a problem attached to the email field, not a
 *    generic failure banner. A parent who typed the wrong thing has to be told
 *    which thing was wrong, next to where they typed it.
 *  - No field other than the parent's email exists. R17 forbids collecting a
 *    child's full legal name, and the cheapest place that can be enforced is the
 *    form itself.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./SignInForm";

/**
 * The server action. Stubbed with the same shape the real one returns so the
 * form can be driven through a submit; `src/app/(auth)/sign-up/actions.test.ts`
 * proves the action really produces this outcome for a rejected address.
 */
const { signUpAction } = vi.hoisted(() => ({ signUpAction: vi.fn() }));

vi.mock("@/app/(auth)/sign-up/actions", () => ({ signUpAction }));

beforeEach(() => {
  signUpAction.mockReset();
  signUpAction.mockResolvedValue({ ok: true });
});

describe("SignInForm", () => {
  it("labels the one field it asks for and gives it a submit button", () => {
    render(<SignInForm action={signUpAction} />);

    expect(screen.getByLabelText("Parent email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("collects the parent's email and nothing else", () => {
    const { container } = render(<SignInForm action={signUpAction} />);

    const fields = [...container.querySelectorAll("input, textarea, select")];
    const names = fields.map((field) => field.getAttribute("name"));

    expect(names).toEqual(["email"]);
    // A name field for a child would be the failure R17 exists to prevent.
    expect(names.some((name) => name !== null && /child|childName|firstName|lastName|birth|dob|age/i.test(name))).toBe(false);
  });

  it("says nothing about passwords, and offers no password field", () => {
    const { container } = render(<SignInForm action={signUpAction} />);

    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain("password");
  });

  it("puts a rejected address next to the email field, not in a generic failure message", async () => {
    const user = userEvent.setup();
    signUpAction.mockResolvedValue({
      ok: false,
      error: { field: "email", message: "Enter an email address like parent@example.com." },
    });

    render(<SignInForm action={signUpAction} />);

    await user.type(screen.getByLabelText("Parent email"), "not-an-address");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const email = await screen.findByLabelText("Parent email");
    const message = await screen.findByText(/enter an email address like/i);

    // The message is tied to the field: `aria-describedby` reaches it and the
    // field is marked invalid, so a screen reader user meets the problem where
    // it happened rather than being told about it somewhere else.
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email.getAttribute("aria-describedby") ?? "").toContain(message.id);
    expect(within(email.closest(".ui-field") as HTMLElement).getByText(message.textContent ?? "")).toBeInTheDocument();
  });

  it("does not show a generic failure message alongside the field error", async () => {
    const user = userEvent.setup();
    signUpAction.mockResolvedValue({
      ok: false,
      error: { field: "email", message: "Enter an email address like parent@example.com." },
    });

    render(<SignInForm action={signUpAction} />);

    await user.type(screen.getByLabelText("Parent email"), "not-an-address");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText(/enter an email address like/i);
    expect(
      screen.queryByText(/something went wrong|please try again|unknown error/i),
    ).not.toBeInTheDocument();
  });

  it("sends the typed address to the action when it is accepted", async () => {
    const user = userEvent.setup();
    render(<SignInForm action={signUpAction} />);

    await user.type(screen.getByLabelText("Parent email"), "parent@example.com");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await vi.waitFor(() => expect(signUpAction).toHaveBeenCalledTimes(1));
    expect(signUpAction.mock.calls[0]?.[0]).toMatchObject({ email: "parent@example.com" });
  });

  it("keeps the submit button disabled until there is something to submit", async () => {
    const user = userEvent.setup();
    render(<SignInForm action={signUpAction} />);

    const submit = screen.getByRole("button", { name: /continue/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Parent email"), "p");

    await vi.waitFor(() => expect(submit).toBeEnabled());
  });
});