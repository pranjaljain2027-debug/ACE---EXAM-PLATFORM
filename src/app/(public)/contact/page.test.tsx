/**
 * The contact form's contracts (U9, R4, R12, R35).
 *
 * Two things are proven, and they are proven through the form a parent uses.
 *
 * First, the submission is checked at the server boundary. The browser's own
 * constraint validation is the first line and is asserted here as well, but a
 * form is not a boundary a stranger can be trusted to respect, so the action
 * re-checks everything and hands back the fields it rejected.
 *
 * Second, this build has no mail transport, so the honest outcome is that
 * nothing was delivered. That is what the adapter reports and what the page
 * says. A success message that no delivery backs is the failure this file exists
 * to prevent, so it is asserted absent as well as the honest message asserted
 * present.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactPage, { metadata } from "./page";

const { redirects } = vi.hoisted(() => ({ redirects: [] as string[] }));

// There is no router in jsdom. The action reports its outcome by redirecting, so
// `redirect` is the seam these tests watch — nothing about the action's own
// return value is stubbed out.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirects.push(url);
  },
}));

type SearchParams = Readonly<Record<string, string>>;

/**
 * Next hands a page its `searchParams` as a promise. React's `use()` reads a
 * thenable's status before it suspends, so marking it fulfilled is what lets the
 * page render in one pass here exactly as it does on a request.
 */
function searchParams(values: SearchParams): Promise<SearchParams> {
  const thenable = Promise.resolve(values) as Promise<SearchParams> & {
    status: string;
    value: SearchParams;
  };
  thenable.status = "fulfilled";
  thenable.value = values;
  return thenable;
}

function renderContact(params: SearchParams = {}) {
  return render(<ContactPage searchParams={searchParams(params)} />);
}

/** The text a field points a screen reader at through `aria-describedby`. */
function describedText(field: HTMLElement): string {
  const ids = (field.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
  return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
}

async function typeInto(label: string, value: string): Promise<void> {
  await userEvent.type(screen.getByLabelText(label), value);
}

async function fillAValidMessage(): Promise<void> {
  await typeInto("Your name", "Sam Okafor");
  await typeInto("Your email", "sam@example.com");
  await typeInto("Your message", "The third step of the explanation does nothing on our laptop.");
}

function submitForm(): void {
  fireEvent.submit(screen.getByRole("form", { name: "Send a message" }));
}

beforeEach(() => {
  redirects.length = 0;
});

describe("/contact", () => {
  it("renders exactly one H1 and a named form", () => {
    const { container } = renderContact();

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("form", { name: "Send a message" })).toBeInTheDocument();
  });

  it("asks a parent not to put identifying details about a child in the form", () => {
    renderContact();

    expect(
      screen.getByText(/do not include your child's name/i),
    ).toBeInTheDocument();
  });

  it("says up front that nothing is delivered, before anyone types anything", () => {
    renderContact();

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/no mail delivery|not send anything|does not send/i);
    expect(note).toHaveTextContent(/nothing you type is stored|is not stored|not stored/i);
  });

  it("holds the fields to constraints the browser enforces before sending", () => {
    renderContact();

    const name = screen.getByLabelText("Your name");
    const email = screen.getByLabelText("Your email");
    const message = screen.getByLabelText("Your message");
    const form = screen.getByRole("form", { name: "Send a message" });

    expect(name).toBeRequired();
    expect(email).toBeRequired();
    expect(email).toHaveAttribute("type", "email");
    expect(message).toBeRequired();
    expect(message).toHaveAttribute("minlength", "10");
    expect(message).toHaveAttribute("maxlength", "2000");

    // An empty form cannot be submitted: the required fields block it.
    expect((form as HTMLFormElement).checkValidity()).toBe(false);
  });

  it("rejects an invalid submission at the server boundary and names the fields", async () => {
    renderContact();

    await typeInto("Your name", "R");
    await typeInto("Your email", "not-an-email");
    await typeInto("Your message", "The third step does nothing on our laptop.");

    submitForm();

    await waitFor(() => expect(redirects).toEqual(["/contact?problem=name,email"]));
  });

  it("accepts a well-formed submission and does not treat it as a send", async () => {
    renderContact();

    await fillAValidMessage();

    submitForm();

    await waitFor(() => expect(redirects).toEqual(["/contact?delivery=none"]));
  });

  it("puts the rejection on the field it names, not only in a summary", () => {
    renderContact({ problem: "email" });

    const email = screen.getByLabelText("Your email");

    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(describedText(email)).toMatch(/error/i);
    expect(describedText(email)).toMatch(/email/i);
  });

  it("ignores a problem the page does not recognise", () => {
    renderContact({ problem: "not-a-field" });

    expect(screen.queryByText(/error:/i)).toBeNull();
    expect(screen.getByRole("form", { name: "Send a message" })).toBeInTheDocument();
  });

  it("says plainly that no message reached an inbox", () => {
    renderContact({ delivery: "none" });

    const report = screen.getByRole("alert");
    expect(report).toHaveTextContent(/not delivered/i);
    expect(report).toHaveTextContent(/no one received|nobody received/i);

    // No reassurance that nothing was asked for either — the page must not
    // imply that a message is on its way to somebody.
    expect(screen.queryByText(/we('ll| will) (reply|be in touch)/i)).toBeNull();
    expect(screen.queryByText(/thanks for (writing|getting in touch|your message)/i)).toBeNull();
  });

  it("ships a title, a description and its own social preview", () => {
    expect(typeof metadata.title).toBe("string");
    expect(String(metadata.title).trim()).not.toBe("");
    expect(typeof metadata.description).toBe("string");
    expect(String(metadata.description).trim()).not.toBe("");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
  });
});