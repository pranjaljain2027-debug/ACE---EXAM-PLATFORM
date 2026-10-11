/**
 * `DemoAuthProvider` (U6, R14, R17, R29).
 *
 * The only provider that ships in this plan, and the only implementation the
 * app actually runs under. What it does is deliberately minimal: it collects a
 * parent's email address, hands back a session, and keeps nothing that would
 * survive a restart.
 *
 * It is not a security control and does not pretend to be. Sessions live in
 * process memory, nothing is verified, and no credential is checked — which is
 * why the banner states plainly that demo mode protects no real data (R14).
 */
import type {
  AuthCredentials,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
} from "./types";
import { SESSION_TTL_SECONDS } from "./types";
import { isValidEmail, normalizeEmail } from "./provider";

const INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

type StoredSession = { readonly session: AuthSession };

/** Opaque token material. Not a credential — nothing is checked against it. */
function newToken(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** An opaque id. Never the email address, never anything about a child (R17). */
function newUserId(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createDemoAuthProvider(): AuthProvider {
  const sessions = new Map<string, StoredSession>();
  const usersByEmail = new Map<string, AuthUser>();

  function issue(email: string): AuthSession {
    const normalized = normalizeEmail(email);

    let user = usersByEmail.get(normalized);
    if (!user) {
      user = {
        id: newUserId(),
        email: normalized,
        createdAt: new Date().toISOString(),
      };
      usersByEmail.set(normalized, user);
    }

    const issuedAt = new Date();
    const session: AuthSession = {
      token: newToken(),
      user,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
    };
    sessions.set(session.token, { session });
    return session;
  }

  function establish(credentials: AuthCredentials): Promise<AuthResult> {
    const normalized = normalizeEmail(credentials.email);
    if (!isValidEmail(normalized)) {
      return Promise.resolve({ ok: false, error: { field: "email", message: INVALID_EMAIL_MESSAGE } });
    }
    return Promise.resolve({ ok: true, session: issue(normalized) });
  }

  return {
    mode: "demo",

    signUp: establish,
    signIn: establish,

    signOut(token: string | null): Promise<void> {
      if (token) sessions.delete(token);
      return Promise.resolve();
    },

    /**
     * Resolve a token to a live session.
     *
     * An expired session reads as *no* session rather than as a session the
     * caller has to remember to check. A stored `session` argument lets a caller
     * assert against a session shape the provider no longer holds — used by the
     * expiry test to check the boundary without waiting a week for it.
     */
    getSession(
      token: string | null,
      override?: AuthSession,
    ): Promise<AuthSession | null> {
      if (!token) return Promise.resolve(null);

      const stored = override ? { session: override } : sessions.get(token);
      if (!stored) return Promise.resolve(null);

      if (Date.parse(stored.session.expiresAt) <= Date.now()) {
        sessions.delete(token);
        return Promise.resolve(null);
      }

      return Promise.resolve(stored.session);
    },

    getUser(token: string | null): Promise<AuthUser | null> {
      if (!token) return Promise.resolve(null);
      const stored = sessions.get(token);
      if (!stored) return Promise.resolve(null);
      if (Date.parse(stored.session.expiresAt) <= Date.now()) {
        sessions.delete(token);
        return Promise.resolve(null);
      }
      return Promise.resolve(stored.session.user);
    },
  };
}
