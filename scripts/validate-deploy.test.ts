/**
 * The deployment guard's decision table (launch blocker: demo build on a public
 * origin).
 *
 * The script is run as a child process with a controlled environment rather
 * than by importing it, because the thing being tested is precisely what it
 * decides about the environment it is handed. Importing it would test a
 * function; running it tests the gate.
 *
 * Two rules are checked, and the second matters more than it looks:
 *
 * - Demo mode on a hosted platform is blocked. Without real auth there is no
 *   parent/child data boundary worth the name, and none of that belongs on a
 *   public URL.
 * - Supabase mode without credentials is blocked, so a deploy with a missing
 *   env var fails at build time instead of on the first request that touches a
 *   session.
 *
 * Local development is never blocked: `VERCEL_ENV` is what distinguishes a real
 * deployment from a laptop, not the site URL.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const SCRIPT = resolve(__dirname, "..", "scripts", "validate-deploy.mjs");

interface Outcome {
  readonly status: number;
  readonly output: string;
}

/** Run the guard with the given environment; returns status and combined output. */
function runGuard(env: Record<string, string>): Outcome {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT], {
      encoding: "utf8",
      // `cleanEnv()` copies `process.env` and deletes, rather than assembling a
      // fresh object: an `env` option replaces the environment wholesale, so a
      // hand-built one would take `PATH` with it and the child would fail to
      // start for a reason unrelated to the case under test.
      env: { ...cleanEnv(), ...env },
    });
    return { status: 0, output: stdout };
  } catch (error: unknown) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: typeof failure.status === "number" ? failure.status : 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
}

/**
 * The environment the guard sees, with the variables it reads removed.
 *
 * Built by copying `process.env` and deleting, rather than by assembling a
 * fresh object. Two reasons, and the first is a bug this shape avoids: a
 * hand-built `env` replaces the environment wholesale rather than extending it,
 * so `PATH` and `HOME` would go with it and the child process would fail to
 * start for a reason that looks nothing like a credential problem.
 *
 * The second is that the guard reads four variables, and each is removed so a
 * developer running the suite with a local `.env`, or on a CI machine with
 * `VERCEL_ENV` set, does not get a result driven by their shell rather than by
 * the case under test.
 */
function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.VERCEL_ENV;
  delete env.AUTH_PROVIDER;
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return env;
}

const SUPABASE_PAIR = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

describe("the deployment guard", () => {
  it("allows a local build in demo mode", () => {
    // No VERCEL_ENV: this is a laptop, and demo mode is the intended default.
    const outcome = runGuard({ AUTH_PROVIDER: "demo" });

    expect(outcome.status).toBe(0);
    expect(outcome.output).toMatch(/Validation passed/);
  });

  it("allows a local build with no provider configured at all", () => {
    // Unset is demo mode by default, which is the state the repo ships in.
    const outcome = runGuard({});

    expect(outcome.status).toBe(0);
  });

  it("blocks demo mode on a hosted platform", () => {
    const outcome = runGuard({ AUTH_PROVIDER: "demo", VERCEL_ENV: "production" });

    expect(outcome.status).toBe(1);
    expect(outcome.output).toMatch(/DEPLOYMENT BLOCKED/);
    expect(outcome.output).toMatch(/demo mode/i);
  });

  it("blocks an unconfigured deployment, not only an explicitly demo one", () => {
    // The dangerous case is not AUTH_PROVIDER=demo — it is nobody having set it.
    const outcome = runGuard({ VERCEL_ENV: "production" });

    expect(outcome.status).toBe(1);
  });

  it("blocks a preview deployment in demo mode too", () => {
    // Preview URLs are public. A demo build on one is the same failure.
    const outcome = runGuard({ VERCEL_ENV: "preview" });

    expect(outcome.status).toBe(1);
  });

  it("allows supabase mode on a hosted platform when both env vars are present", () => {
    const outcome = runGuard({
      AUTH_PROVIDER: "supabase",
      VERCEL_ENV: "production",
      ...SUPABASE_PAIR,
    });

    expect(outcome.status).toBe(0);
    expect(outcome.output).toMatch(/supabase/);
  });

  it("blocks supabase mode without the url", () => {
    const outcome = runGuard({
      AUTH_PROVIDER: "supabase",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(outcome.status).toBe(1);
    expect(outcome.output).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("blocks supabase mode without the key", () => {
    const outcome = runGuard({
      AUTH_PROVIDER: "supabase",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    expect(outcome.status).toBe(1);
    expect(outcome.output).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("blocks a provider this build does not implement, even locally", () => {
    // A typo in AUTH_PROVIDER must fail loudly rather than serve demo mode
    // under a name that says otherwise — this is the same rule the runtime
    // `getAuthProvider()` enforces, checked earlier so the failure is cheaper.
    const outcome = runGuard({ AUTH_PROVIDER: "supabase-typo" });

    expect(outcome.status).toBe(1);
    expect(outcome.output).toMatch(/does not implement/i);
  });

  it("blocks supabase mode without credentials even on a laptop", () => {
    // The asymmetry with the demo-mode check is deliberate. Demo mode on a
    // laptop is the normal development state — the repo ships with no
    // AUTH_PROVIDER — so scoping that check to hosted platforms keeps local
    // builds working. Supabase without credentials is different: the app cannot
    // function at all, so there is no legitimate local state to preserve, and
    // failing the build is cheaper than `getSupa()` throwing on the first
    // request that tries to resolve a session.
    const outcome = runGuard({ AUTH_PROVIDER: "supabase" });

    expect(outcome.status).toBe(1);
    expect(outcome.output).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});