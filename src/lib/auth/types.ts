/**
 * The vocabulary the auth layer speaks.
 *
 * This module is deliberately free of imports. It is read by the pages, by the
 * server session helpers, by the server actions, and by `src/middleware.ts` —
 * and the last of those runs at the network boundary, before a request reaches
 * the app, where nothing that touches a request-scoped API is available. Keeping
 * the shape here means the guard can be written against the same constants the
 * app uses without dragging a server-only dependency into the guard.
 */

/**
 * The cookie the demo session is written to.
 *
 * The name is shared rather than duplicated so the guard and the session code
 * cannot drift into disagreeing about where the session lives — a guard reading
 * a different name from the one the app writes is a guard that always fails.
 */
export const SESSION_COOKIE = "how_demo_session";

/**
 * How long a demo session lasts, in seconds.
 *
 * Long enough to cross a session of use; short enough that a shared machine is
 * not left signed in. It is not a security control — nothing here is (R14) — it
 * is just a reasonable lifetime for a cookie nobody is relying on.
 */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** The parent account. The only thing the sign-up and sign-in forms collect. */
export interface AuthUser {
  /** Opaque, generated server-side. Never the email address, never a child's name. */
  readonly id: string;
  /** The parent's own address, normalised. */
  readonly email: string;
  readonly createdAt: string;
}

/** An established demo session. */
export interface AuthSession {
  /** The opaque value written to the session cookie. */
  readonly token: string;
  readonly user: AuthUser;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

/** What the forms collect: the parent's email address and nothing else (R17). */
export interface AuthCredentials {
  readonly email: string;
}

/**
 * A problem with one named field.
 *
 * Carrying the field name rather than only a message is what lets the form put
 * the problem next to the input it belongs to instead of announcing a generic
 * failure somewhere above the fold.
 */
export interface AuthFieldError {
  readonly field: "email";
  readonly message: string;
}

/** The outcome of establishing a session. */
export type AuthResult =
  | { readonly ok: true; readonly session: AuthSession }
  | { readonly ok: false; readonly error: AuthFieldError };

/**
 * The seam a real provider will be dropped into.
 *
 * Exactly one implementation ships in this plan — `DemoAuthProvider` — because
 * no provider has been chosen. This interface is what makes that reversible: a
 * chosen vendor arrives as a second file implementing these five methods, and
 * nothing else in the app has to change.
 *
 * Session tokens are passed in and returned rather than read from a request
 * object, so an implementation never has to know which framework is calling it.
 */
export interface AuthProvider {
  /** Which mode the app is running in. Drives the demo banner (R14). */
  readonly mode: "demo" | "live";

  /** Creates a session for a parent who is setting up an account. */
  signUp(credentials: AuthCredentials): Promise<AuthResult>;

  /** Creates a session for a parent who says they already have one. */
  signIn(credentials: AuthCredentials): Promise<AuthResult>;

  /** Ends the session a token belongs to. Idempotent. */
  signOut(token: string | null): Promise<void>;

  /** Resolves a token to a live session, or null if there is not one. */
  getSession(token: string | null): Promise<AuthSession | null>;

  /** Resolves a token to its parent, or null if there is no session. */
  getUser(token: string | null): Promise<AuthUser | null>;
}

/** The shape `useActionState` carries through the sign-in and sign-up forms. */
export type AuthActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: AuthFieldError };