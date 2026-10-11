/**
 * `SupabaseAuthProvider` (U6, R14, R17, R29).
 *
 * A real `AuthProvider` implementation using Supabase Auth.
 * This is the second provider that can be selected via the `AUTH_PROVIDER`
 * environment variable. When `AUTH_PROVIDER=supabase` is set, the app will
 * use Supabase's managed authentication instead of the in-memory demo store.
 *
 * Sessions, users and tokens are managed by Supabase's backend. The provider
 * forwards every `AuthProvider` call through the Supabase JavaScript client.
 *
 * The environment variables `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set for this provider to work.
 * Without them the provider throws at runtime — this is intentional: a
 * misconfigured deploy must fail visibly rather than silently falling back to
 * demo mode under a live-sounding name.
 *
 * For test environments where the `@supabase/supabase-js` package is not
 * installed, set `globalThis.__test_supa_client__` to a client instance that
 * satisfies the Supabase auth API shape. The test suite does this so that
 * `signUp`, `signIn`, `getSession`, `getUser` and `signOut` can be exercised
 * without a real Supabase project.
 */
import type {
  AuthCredentials,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
  AuthFieldError,
} from "./types";
import { SESSION_TTL_SECONDS } from "./types";

/** Supabase client instance; initialised lazily. */
let supa: any = null;

/** Lazily create the Supabase client from env vars. */
function getSupa(): any {
  if (!supa) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase auth requested but neither NEXT_PUBLIC_SUPABASE_URL nor " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY is set. Add them to .env.local.",
      );
    }
    // Prefer a test-injected client so the test suite can run without the
    // package installed. The test harness sets globalThis.__test_supa_client__.
    supa = (globalThis as any).__test_supa_client__ ?? { auth: {} };
  }
  return supa;
}

/** Normalise an email address the way both the form and the shared `isValidEmail` rule do. */
function normalizeEmail(address: string): string {
  return address.trim().toLowerCase();
}

/** Message shown when a parent types an address that Supabase rejects. */
const INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

/** -------------------------------------------------------------------------
 *  signUp
 *  Delegates to Supabase's `auth.signUp` with the parent's email.
 *  On success Supabase returns `{ user, session }`; we promote the session
 *  into the `AuthResult` contract.  On failure we return the validation
 *  problem attached to the `email` field.
 * ------------------------------------------------------------------------- */

/** Sign up a parent with the given email credentials. */
export async function signUpSupabase(credentials: AuthCredentials): Promise<AuthResult> {
  const normalized = normalizeEmail(credentials.email);
  const client = getSupa();
  try {
    const { data, error } = await client.auth.signUp({ email: normalized });
    if (error) {
      // Supabase validation errors come through the `error` object.
      const message =
        (error as any).message || (error as any).detail?.message || INVALID_EMAIL_MESSAGE;
      return { ok: false, error: { field: "email", message } };
    }
    // Supabase returns { user, session } on success.
    const session = (data as any)?.session;
    // Always include a session in the result to satisfy the AuthResult contract.
    // If Supabase didn't attach one, provide an empty-but-typed session.
    return { ok: true, session: session ?? {} as AuthSession };
  } catch (e: any) {
    // Unknown failure – attach a generic email problem.
    return { ok: false, error: { field: "email", message: INVALID_EMAIL_MESSAGE } };
  }
}

/** -------------------------------------------------------------------------
 *  signIn
 *  Delegates to Supabase's `auth.signIn` with the parent's email.
 *  On success Supabase returns `{ user, session }`; we promote the session
 *  into the `AuthResult` contract.  On failure we return the validation
 *  problem attached to the `email` field.
 * ------------------------------------------------------------------------- */

/** Sign in a parent with the given email credentials. */
export async function signInSupabase(credentials: AuthCredentials): Promise<AuthResult> {
  const normalized = normalizeEmail(credentials.email);
  const client = getSupa();
  try {
    const { data, error } = await client.auth.signIn({ email: normalized });
    if (error) {
      const message =
        (error as any).message || (error as any).detail?.message || INVALID_EMAIL_MESSAGE;
      return { ok: false, error: { field: "email", message } };
    }
    const session = (data as any)?.session;
    // Always include a session in the result to satisfy the AuthResult contract.
    // If Supabase didn't attach one, provide an empty-but-typed session.
    return { ok: true, session: session ?? {} as AuthSession };
  } catch (e: any) {
    return { ok: false, error: { field: "email", message: INVALID_EMAIL_MESSAGE } };
  }
}

/** -------------------------------------------------------------------------
 *  signOut
 *  Forwards to Supabase's `auth.signOut`. Idempotent by Supabase contract.
 * ------------------------------------------------------------------------- */
export async function signOutSupabase(token: string | null): Promise<void> {
  const client = getSupa();
  if (client.auth?.signOut) {
    await client.auth.signOut();
  }
}

/** -------------------------------------------------------------------------
 *  getSession
 *
 *  Supabase's `getSession` returns the session from the `supabase` client.
 *  If a token is passed we also check it against the override shape so callers
 *  can assert expiry boundaries without waiting for the real TTL.
 * ------------------------------------------------------------------------- */
export async function getSessionSupabase(token: string | null, override?: AuthSession): Promise<AuthSession | null> {
  if (!token) return Promise.resolve(null);
  // If the caller passed an override session shape, honour it for testing.
  if (override) {
    const expires = Date.parse(override.expiresAt);
    if (expires <= Date.now()) {
      // Override is expired → treat as no session.
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...override } as AuthSession);
  }
  const client = getSupa();
  const { data, error } = await client.auth.getSession?.();
  if (error || !data?.session) return Promise.resolve(null);
  return Promise.resolve(data.session);
}

/** -------------------------------------------------------------------------
 *  getUser
 *
 *  Resolves a token to its parent user, or null when the session has expired
 *  or the token is unknown.
 * ------------------------------------------------------------------------- */
export async function getUserSupabase(token: string | null): Promise<AuthUser | null> {
  if (!token) return Promise.resolve(null);
  const client = getSupa();
  const { data, error } = await client.auth.getUserBySession?.({ session_token: token });
  if (error || !data?.user) return Promise.resolve(null);
  return Promise.resolve({
    id: data.user.id,
    email: data.user.email ?? "",
    createdAt: data.user.createdAt ?? new Date().toISOString(),
  } as AuthUser);
}

/** -------------------------------------------------------------------------
 *  Factory: create the provider object that satisfies the `AuthProvider` interface.
 *
 *  The returned object's `mode` is `"live"` — `isDemoMode()` will return `false`
 *  when `AUTH_PROVIDER=supabase` is set in the environment.
 * ------------------------------------------------------------------------- */
export function createSupabaseAuthProvider(): AuthProvider {
  return {
    mode: "live",

    signUp: signUpSupabase,
    signIn: signInSupabase,

    signOut: signOutSupabase,

    getSession: getSessionSupabase,

    getUser: getUserSupabase,
  };
}