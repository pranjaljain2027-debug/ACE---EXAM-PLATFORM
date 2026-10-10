/**
 * Provider selection and the email rule (U6).
 *
 * Two things live here. `isDemoMode()` is the switch the whole app reads: with
 * no auth environment configured the app is in demo mode, and that fact is what
 * the banner and the session copy are built on. `isValidEmail()` is the one
 * address rule, shared by the sign-up form and the provider so the two can
 * never disagree about what a valid address is.
 */
import { getAuthProvider, isDemoMode, isValidEmail, normalizeEmail } from "./provider";

describe("auth provider selection", () => {
  const original = process.env.AUTH_PROVIDER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AUTH_PROVIDER;
    } else {
      process.env.AUTH_PROVIDER = original;
    }
  });

  it("is in demo mode when no provider is configured", () => {
    delete process.env.AUTH_PROVIDER;

    expect(isDemoMode()).toBe(true);
  });

  it("is in demo mode when the configuration names the demo provider", () => {
    process.env.AUTH_PROVIDER = "demo";

    expect(isDemoMode()).toBe(true);
  });

  it("refuses to run when a provider is configured that this build does not contain", () => {
    process.env.AUTH_PROVIDER = "some-vendor-never-implemented";

    // Failing loudly beats silently running demo mode under a name that says
    // something else: a misconfigured deploy must not look like a working one.
    expect(() => getAuthProvider()).toThrow(/AUTH_PROVIDER/i);
    expect(isDemoMode()).toBe(false);
  });

  it("hands back one stable demo provider as the only implementation that ships", () => {
    delete process.env.AUTH_PROVIDER;

    const provider = getAuthProvider();

    expect(provider.mode).toBe("demo");
    expect(getAuthProvider()).toBe(provider);
  });
});

describe("email validation", () => {
  it.each([
    "parent@example.com",
    "parent.name+tag@sub.example.co.uk",
  ])("accepts %s", (address) => {
    expect(isValidEmail(address)).toBe(true);
  });

  it.each([
    ["", "an empty string"],
    ["parent", "no @"],
    ["parent@example", "no domain suffix"],
    ["parent @example.com", "an embedded space"],
    ["@example.com", "no local part"],
    ["parent@example.com\n", "a trailing newline"],
  ])("rejects %s (%s)", (address) => {
    expect(isValidEmail(address)).toBe(false);
  });

  it("ignores the casing and surrounding space a parent types", () => {
    expect(normalizeEmail("  Parent@Example.COM ")).toBe("parent@example.com");
  });
});