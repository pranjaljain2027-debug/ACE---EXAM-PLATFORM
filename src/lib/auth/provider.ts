/**
 * Provider selection and the one email rule (U6).
 *
 * `isDemoMode()` is the switch the whole app reads. `isValidEmail()` lives here
 * rather than in the form so the client and the server cannot disagree about
 * what a valid address is — a form that accepts what the server rejects shows a
 * parent an error they cannot act on.
 */
import type { AuthProvider } from "./types";
import { createDemoAuthProvider } from "./demoProvider";
import { createSupabaseAuthProvider } from "./supabaseProvider";

/**
 * Provider selection and the one email rule (U6).
 *
 * `isDemoMode()` is the switch the whole app reads. `isValidEmail()` lives here
 * rather than in the form so the client and the server cannot disagree about
 * what a valid address is — a form that accepts what the server rejects shows a
 * parent an error they cannot act on.
 */
let cached: AuthProvider | null = null;

/**
 * Whether the app is running in demo mode.
 *
 * Demo mode is the default and the only mode this build contains unless
 * `AUTH_PROVIDER` is set to a vendor this build implements (currently `"supabase"`).
 * An `AUTH_PROVIDER` naming an unimplemented vendor is *not* demo mode: it is a
 * misconfiguration, and reporting it as "live" makes the deployment fail
 * visibly instead of appearing to work.
 */
export function isDemoMode(): boolean {
  const configured = process.env.AUTH_PROVIDER;
  if (configured === undefined || configured === "") return true;
  return configured === "demo";
}

/**
 * The configured provider.
 *
 * Throws on an unrecognised `AUTH_PROVIDER` rather than falling back to demo.
 * A deploy that names a vendor this build does not contain has a real problem,
 * and silently serving demo mode under a live-sounding name would hide it until
 * someone noticed the data was not being kept.
 */
export function getAuthProvider(): AuthProvider {
  if (!isDemoMode()) {
    if (process.env.AUTH_PROVIDER === "supabase") {
      return createSupabaseAuthProvider();
    }
    throw new Error(
      `AUTH_PROVIDER is set to "${process.env.AUTH_PROVIDER}", which this build does not implement. ` +
        "Only the demo and supabase providers ship in this plan. Unset AUTH_PROVIDER to run in demo mode.",
    );
  }
  cached ??= createDemoAuthProvider();
  return cached;
}

/**
 * Normalise a typed address: trim, and lowercase the whole thing.
 *
 * Lowercasing the entire address rather than only the domain is the simpler rule
 * and the one every mainstream provider treats domains as. The local part is not
 * case-sensitive in practice, and a half-normalised address is worse than either
 * consistent choice.
 */
export function normalizeEmail(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * True when a character may not appear anywhere in an address.
 *
 * Whitespace, the C0 control range and DEL are all excluded. A trailing newline
 * is the case that actually bites: it survives the browser's own check and then
 * breaks the header the moment the address is used.
 *
 * Written as a code-point test rather than a regex literal so the rule reads as
 * a rule and so the source file stays plain text.
 */
function isForbiddenInAddress(code: number): boolean {
  if (code >= 0x00 && code <= 0x20) return true; // C0 controls and space
  if (code === 0x7f) return true; // DEL
  if (code >= 0x80 && code <= 0x9f) return true; // C1 controls
  return false;
}

function hasForbiddenCharacter(address: string): boolean {
  for (let index = 0; index < address.length; index += 1) {
    if (isForbiddenInAddress(address.charCodeAt(index))) return true;
  }
  return false;
}

/**
 * A deliberately conservative address check.
 *
 * This is a typo check, not RFC 5322. The only addresses that reach it are ones
 * a parent typed a moment ago, and the goal is to catch "parent@example" before
 * a session is created for an address that can never receive one. Anything more
 * permissive starts rejecting addresses that work.
 */
export function isValidEmail(address: string): boolean {
  if (address.length === 0 || address.length > 254) return false;
  if (hasForbiddenCharacter(address)) return false;

  const at = address.lastIndexOf("@");
  if (at <= 0 || at === address.length - 1) return false;

  const local = address.slice(0, at);
  const domain = address.slice(at + 1);

  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;

  // The domain needs at least one dot and a real-looking suffix, so that
  // "parent@example" and "parent@example." are both rejected.
  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === domain.length - 1) return false;

  const tld = domain.slice(lastDot + 1);
  if (tld.length < 2) return false;

  return true;
}
