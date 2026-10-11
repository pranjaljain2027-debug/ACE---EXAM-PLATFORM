/**
 * The onboarding flow, driven through the UI (U7, R16, R18, AE5).
 *
 * The rules are tested twice on purpose. `reducer.test.ts` proves the logic is
 * right; this file proves the page is actually wired to that logic. A reducer
 * that is correct and a page that dispatches the wrong action is a flow that
 * does not work, and only one of those tests would notice.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockReset();
});

/** Choose a radio option by its visible label. */
async function chooseRadio(user: ReturnType<typeof userEvent.setup>, label: string | RegExp) {
  await user.click(screen.getByRole("radio", { name: label }));
}

/** Toggle a checkbox by its visible label. */
async function toggleCheckbox(user: ReturnType<typeof userEvent.setup>, label: string | RegExp) {
  await user.click(screen.getByRole("checkbox", { name: label }));
}

describe("the flow", () => {
  it("collects six answers in order and reaches the summary", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /introductory/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await chooseRadio(user, /new to reasoning/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await toggleCheckbox(user, /build confidence/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await chooseRadio(user, /evenings/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Interests, then the summary.
    expect(screen.getByRole("heading", { name: /what does your child enjoy/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: /ready to begin/i })).toBeInTheDocument();
  });

  it("cannot pass a required step with nothing chosen", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const next = screen.getByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();

    await chooseRadio(user, /developing/i);
    expect(next).toBeEnabled();
  });

  it("accepts 'Not sure yet' as a goal and lets the parent continue", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /introductory/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Not sure yet is a real answer, not an empty submission (spec §5.2).
    await toggleCheckbox(user, /not sure yet/i);
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: /when would your child practise/i })).toBeInTheDocument();
  });

  it("offers a Skip on interests and completes without choosing any (R18)", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /advanced/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /regularly practises/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /prepare for an assessment/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /any time works/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const skip = screen.getByRole("button", { name: /skip this step/i });
    expect(skip).toBeInTheDocument();

    await user.click(skip);

    // Straight to the summary, with nothing chosen and no error shown.
    expect(screen.getByRole("heading", { name: /ready to begin/i })).toBeInTheDocument();
    expect(screen.getByText(/none chosen/i)).toBeInTheDocument();
  });

  it("keeps every answer when stepping back to the first step (R16, AE5)", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /build confidence/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Back three times, to the very first step.
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("heading", { name: /how old is your child/i })).toBeInTheDocument();
    // The first answer survived the walk backwards.
    expect(screen.getByRole("radio", { name: /developing/i })).toBeChecked();
  });

  it("leaves a past answer editable after stepping back (AE5)", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Changing it now replaces the earlier value rather than adding to it.
    await chooseRadio(user, /advanced/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("radio", { name: /advanced/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /developing/i })).not.toBeChecked();
  });

  it("summarises what was chosen", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /build confidence/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /evenings/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /patterns and shapes/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("developing")).toBeInTheDocument();
    expect(screen.getByText("some_experience")).toBeInTheDocument();
    expect(screen.getByText("build_confidence")).toBeInTheDocument();
    expect(screen.getByText("1 chosen")).toBeInTheDocument();
  });

  it("does not call the path AI-personalised (spec §5.2)", async () => {
    const user = userEvent.setup();
    const { container } = render(<OnboardingPage />);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /build confidence/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /any time works/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(container.textContent ?? "").not.toMatch(/ai[- ]personal/i);
    // And the copy says where the recommendation comes from.
    expect(screen.getByText(/fixed set of rules/i)).toBeInTheDocument();
  });

  it("asks for an age band and never a date of birth (R17)", async () => {
    render(<OnboardingPage />);

    expect(screen.getByText(/age band rather than a date of birth/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  it("collects nothing that identifies a child", async () => {
    const user = userEvent.setup();
    const { container } = render(<OnboardingPage />);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /some experience/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await toggleCheckbox(user, /build confidence/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await chooseRadio(user, /evenings/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    const fieldNames = [...container.querySelectorAll("input, select, textarea")].map(
      (field) => field.getAttribute("name") ?? "",
    );

    for (const name of fieldNames) {
      expect(name).not.toMatch(/child|childName|firstName|lastName|birth|dob|fullName/i);
    }
  });
});

describe("accessibility of the stepper", () => {
  it("marks the current step for assistive technology", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    expect(screen.getAllByRole("listitem", { current: "step" })).toHaveLength(1);

    await chooseRadio(user, /developing/i);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const current = screen.getAllByRole("listitem", { current: "step" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(/experience/i);
  });

  it("gives each radio group a real legend", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("group", { name: /age band/i })).toBeInTheDocument();
  });

  it("keeps Back disabled on the first step", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });
});
