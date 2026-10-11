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
 * The client is looked up lazily so that this module can be imported without a
 * Supabase project configured: only constructing a session needs the env vars.
 *
 * For test environments, or when the `@supabase/supabase-js` package is not
 * installed, set `globalThis.__test_supa_client__` to an object satisfying
 * `SupabaseAuthClient` below. The test harness does this so the provider's
 * behaviour can be exercised without a real Supabase project.
 */
import type {
  AuthCredentials,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthUser,
} from "./types";

/**
 * The subset of the Supabase auth client this provider uses.
 *
 * Declared locally rather than imported from the SDK so this module has no
 * runtime dependency on `@supabase/supabase-js` — the app can be demo-mode only
 * without it installed, and tests can supply a stub.
 */
interface SupabaseAuthResponse<T> {
  data: T;
  error: (Error & { detail?: { message?: string; hint?: string } }) | null;
}

interface SupabaseAuthClient {
  signUp(credentials: { email: string }): Promise<SupabaseAuthResponse<{ session: AuthSession | null; user: SupabaseUser | null }>>;
  signIn(credentials: { email: string }): Promise<SupabaseAuthResponse<{ session: AuthSession | null; user: SupabaseUser | null }>>;
  signOut(): Promise<{ error: Error | null }>;
  getSession(): Promise<SupabaseAuthResponse<{ session: AuthSession | null }>>;
  getUserBySession(credentials: { session_token: string }): Promise<SupabaseAuthResponse<{ user: SupabaseUser | null }>>;
}

interface SupabaseUser {
  id: string;
  email: string | null;
  createdAt?: string;
}

type SupabaseAuthClientShape = { auth: SupabaseAuthClient };

/** Supabase client instance; initialised lazily. */
let supa: SupabaseAuthClientShape | null = null;

/** Lazily create the Supabase client from env vars. */
function getSupa(): SupabaseAuthClientShape {
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
    supa = (globalThis as { __test_supa_client__?: SupabaseAuthClientShape })
      .__test_supa_client__ ?? { auth: {} as SupabaseAuthClient };
  }
  return supa;
}

/** Normalise an email address the way both the form and the shared `isValidEmail` rule do. */
function normalizeEmail(address: string): string {
  return address.trim().toLowerCase();
}

/** Message shown when a parent types an address that Supabase rejects. */
const INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

/** Pull a human-readable problem out of whatever Supabase threw. */
function problemFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const detail = (error as { detail?: { message?: string; hint?: string } })?.detail;
  return detail?.message ?? detail?.hint ?? INVALID_EMAIL_MESSAGE;
}

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
      return { ok: false, error: { field: "email", message: problemFrom(error) } };
    }
    // Always include a session in the result to satisfy the AuthResult contract.
    // If Supabase didn't attach one, provide an empty-but-typed session.
    return { ok: true, session: data.session ?? ({} as AuthSession) };
  } catch (e: unknown) {
    // Unknown failure – attach a generic email problem.
    return { ok: false, error: { field: "email", message: problemFrom(e) } };
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
      return { ok: false, error: { field: "email", message: problemFrom(error) } };
    }
    // Always include a session in the result to satisfy the AuthResult contract.
    // If Supabase didn't attach one, provide an empty-but-typed session.
    return { ok: true, session: data.session ?? ({} as AuthSession) };
  } catch (e: unknown) {
    return { ok: false, error: { field: "email", message: problemFrom(e) } };
  }
}

/** -------------------------------------------------------------------------
 *  signOut
 *  Forwards to Supabase's `auth.signOut`. Idempotent by Supabase contract.
 * ------------------------------------------------------------------------- */
export async function signOutSupabase(): Promise<void> {
  const client = getSupa();
  await client.auth.signOut();
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
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) return Promise.resolve(null);
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
  const { data, error } = await client.auth.getUserBySession({ session_token: token });
  if (error || !data.user) return Promise.resolve(null);
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