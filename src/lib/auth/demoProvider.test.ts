/**
 * `DemoAuthProvider` behaviour (U6, R14, R17, R29).
 *
 * The demo provider is the only provider that ships in this plan, so these are
 * the account rules the app actually runs under. What is asserted here is what
 * a parent can observe: the address is collected and nothing else, a valid one
 * yields a session, an invalid one yields a problem attached to the email
 * field rather than a generic failure, and signing out ends the session.
 *
 * The store is process memory. That is the point — it is why the banner says
 * records are erased when the app restarts — so `signOut` and a fresh read are
 * the only things standing between a session and its absence.
 */
import { getAuthProvider } from "./provider";
import type { AuthSession } from "./types";

function uniqueEmail(label: string): string {
  return `${label}-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

describe("DemoAuthProvider", () => {
  it("keeps no password and asks for nothing but the parent's email", async () => {
    const result = await getAuthProvider().signUp({ email: uniqueEmail("fields") });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The account is the address and nothing else: no name, no child's details,
    // no credential of any kind (R17).
    expect(Object.keys(result.session.user).sort()).toEqual(["createdAt", "email", "id"]);
  });

  it("returns a session that resolves back to the same parent", async () => {
    const email = uniqueEmail("roundtrip");

    const signedUp = await getAuthProvider().signUp({ email });
    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;

    const session = await getAuthProvider().getSession(signedUp.session.token);

    expect(session?.user.email).toBe(email);
    expect(session?.user.id).toBe(signedUp.session.user.id);
  });

  it("normalises the address the parent typed", async () => {
    const local = Math.random().toString(36).slice(2, 10);

    const result = await getAuthProvider().signUp({ email: `  Parent.${local}@Example.COM ` });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.session.user.email).toBe(`parent.${local}@example.com`);
  });

  it("refuses an invalid address with a problem attached to the email field", async () => {
    const result = await getAuthProvider().signUp({ email: "not-an-address" });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    // Not a generic failure: the message names the field the parent has to fix.
    expect(result.error.field).toBe("email");
    expect(result.error.message).toMatch(/email address/i);
  });

  it("reports an expired session as no session rather than as a session", async () => {
    const result = await getAuthProvider().signUp({ email: uniqueEmail("expired") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { session } = result;
    const token = session.token;
    const expired: AuthSession = {
      ...session,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    expect(await getAuthProvider().getSession(token, expired)).toBeNull();
  });

  it("clears the session on sign-out", async () => {
    const result = await getAuthProvider().signUp({ email: uniqueEmail("out") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await getAuthProvider().signOut(result.session.token);

    expect(await getAuthProvider().getSession(result.session.token)).toBeNull();
    expect(await getAuthProvider().getUser(result.session.token)).toBeNull();
  });

  it("reads the parent out of a session without a second lookup for the user", async () => {
    const result = await getAuthProvider().signUp({ email: uniqueEmail("user") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const user = await getAuthProvider().getUser(result.session.token);

    expect(user?.email).toBe(result.session.user.email);
  });

  it("has no session for a token it never issued", async () => {
    expect(await getAuthProvider().getSession("not-a-token-this-server-issued")).toBeNull();
  });
});