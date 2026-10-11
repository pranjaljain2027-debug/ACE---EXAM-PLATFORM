/**
 * The deployment guard (build time).
 *
 * The demo-mode decision requires that a demo build is never served from a
 * public origin. This script is what enforces it, and it runs before every
 * production build so a misconfigured deploy fails at build time rather than
 * shipping a demo app under a live-sounding URL.
 *
 * Two things are checked:
 *
 * 1. Demo mode on a public host. If `AUTH_PROVIDER` is unset or "demo" and this
 *    is a real deployment (Vercel sets `VERCEL_ENV`), the build stops. In demo
 *    mode there is no real auth, no persistence and no parental data boundary
 *    worth the name, and none of that is acceptable on a public URL.
 *
 * 2. Supabase mode without credentials. If `AUTH_PROVIDER` names a provider
 *    this build does not implement, or names Supabase without the pair of env
 *    vars it needs, the build stops. `getAuthProvider()` would throw on the
 *    first request otherwise; failing here means it fails before anyone can see
 *    a broken page.
 *
 * Local development is never blocked. `next dev` does not run this script, and
 * `npm run build` locally has no `VERCEL_ENV`, so the first check cannot fire.
 */
const demoMode = () =>
  process.env.AUTH_PROVIDER === undefined ||
  process.env.AUTH_PROVIDER === "" ||
  process.env.AUTH_PROVIDER === "demo";

const onVercel = () => Boolean(process.env.VERCEL_ENV);

const KNOWN_PROVIDERS = ["demo", "supabase"];

function fail(message) {
  console.error(`\nDEPLOYMENT BLOCKED: ${message}\n`);
  process.exit(1);
}

const provider = process.env.AUTH_PROVIDER;

if (provider !== undefined && provider !== "" && !KNOWN_PROVIDERS.includes(provider)) {
  fail(
    `AUTH_PROVIDER is "${provider}", which this build does not implement. ` +
      `Known providers: ${KNOWN_PROVIDERS.join(", ")}.`,
  );
}

if (demoMode() && onVercel()) {
  fail(
    "This build is in demo mode (no AUTH_PROVIDER set) and is deploying to a " +
      "hosted environment. Demo mode keeps no real accounts and enforces no " +
      "real parental data boundary. Set AUTH_PROVIDER=supabase and provide " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before " +
      "deploying.",
  );
}

if (provider === "supabase") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    fail(
      "AUTH_PROVIDER is \"supabase\" but NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set.",
    );
  }
}

console.log(
  `Validation passed (provider: ${provider ?? "demo"}${onVercel() ? `, vercel: ${process.env.VERCEL_ENV}` : ""}).`,
);