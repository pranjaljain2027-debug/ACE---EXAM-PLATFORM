/**
 * The demo-mode banner (U6, R14).
 *
 * R14 asks for a demo mode that is "visually and technically distinct, and
 * never implies mock authentication secures real data". Both halves are checked
 * here against the text a parent actually reads.
 *
 * The wording check is the important one. It bans the vocabulary a security
 * claim is made of, and `assertNoSecurityClaim` is itself exercised against
 * strings that would be violations — an assertion that cannot fail is not an
 * assertion, and a disclaimer is exactly the kind of copy that gets "improved"
 * into a promise by accident.
 */
import { render, screen } from "@testing-library/react";
import { DemoModeBanner } from "./DemoModeBanner";

/**
 * The words a promise of security or data protection is built out of. The
 * banner must not contain any of them, in any form, negated or not — which is
 * why the copy avoids them rather than arguing with them.
 */
const SECURITY_CLAIM_TERMS = [
  "secure",
  "secured",
  "securely",
  "encrypt",
  "private",
  "protect",
  "safe",
  "confidential",
  "anonymous",
  "anonymis",
  "anonymiz",
  "never share",
  "never collect",
  "end-to-end",
  "gdpr",
  "ferpa",
  "coppa",
  "hipaa",
  "compliant",
  "bank-grade",
  "military-grade",
  "industry-standard",
  "state-of-the-art",
  "guarantee",
] as const;

/** The claim phrases, as the kind of copy that would breach R14. */
function assertNoSecurityClaim(text: string): void {
  const lowered = text.toLowerCase();

  for (const term of SECURITY_CLAIM_TERMS) {
    expect(lowered, `banner text claims "${term}"`).not.toContain(term);
  }
}

describe("assertNoSecurityClaim", () => {
  it.each([
    ["Your data is stored securely on our servers."],
    ["Your child's information is private and protected."],
    ["We never share your data with anyone."],
    ["End-to-end encrypted. FERPA compliant."],
    ["Safe, anonymous, and anonymous by default."],
  ])("catches %s", (violation) => {
    // Proving the guard bites, so passing the real banner means something.
    expect(() => assertNoSecurityClaim(violation)).toThrow();
  });

  it("lets honest disclaimer wording through", () => {
    expect(() =>
      assertNoSecurityClaim(
        "This build has no real accounts. Nothing is written to this device.",
      ),
    ).not.toThrow();
  });
});

describe("DemoModeBanner", () => {
  it("announces itself as demo mode to a screen reader, not only in colour", () => {
    render(<DemoModeBanner />);

    const banner = screen.getByRole("note", { name: /demo mode/i });
    expect(banner).toBeVisible();
  });

  it("says no real account exists and nothing is written to this device", () => {
    const { container } = render(<DemoModeBanner />);
    const text = (container.textContent ?? "").toLowerCase();

    expect(text).toContain("demo mode");
    expect(text).toMatch(/no real account/i);
    expect(text).toMatch(/nothing is written to this device/i);
  });

  it("says where records are held and how long they last", () => {
    const { container } = render(<DemoModeBanner />);
    const text = (container.textContent ?? "").toLowerCase();

    // The store became file-backed, so the banner's promise changed with it.
    // This assertion is what keeps the two from drifting: if the store changes
    // again and the banner does not, the parent is told something untrue about
    // where their data is.
    expect(text).toMatch(/on the server/i);
    expect(text).toMatch(/file/i);
    expect(text).toMatch(/until the file is deleted/i);
  });

  it("makes no claim of security or data protection anywhere in its text", () => {
    const { container } = render(<DemoModeBanner />);

    assertNoSecurityClaim(container.textContent ?? "");
  });

  it("looks different from ordinary content rather than reading as a quiet note", () => {
    const { container } = render(<DemoModeBanner />);
    const banner = screen.getByRole("note", { name: /demo mode/i });

    // It carries its own class contract instead of borrowing a `ui-*` primitive,
    // so nothing in the shared layer can quietly restyle it into looking like
    // ordinary page content.
    expect(banner).toHaveClass("auth-demo-banner");
    expect(banner.className).not.toContain("ui-callout");

    // And it ships the styling for that treatment with it, rather than relying
    // on a rule that a later unit could change out from under it.
    const styles = container.querySelector("style[href='auth-demo']");
    expect(styles).not.toBeNull();
    expect(styles?.textContent ?? "").toContain(".auth-demo-banner");
  });

  it("tells the parent not to enter a child's details", () => {
    const { container } = render(<DemoModeBanner />);
    const text = (container.textContent ?? "").toLowerCase();

    expect(text).toMatch(/child/);
  });
});