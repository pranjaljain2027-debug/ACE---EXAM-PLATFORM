/**
 * The route guard (R29).
 *
 * App routes are checked server-side, before the request reaches a page, so a
 * parent without a session cannot render a protected page and then be redirected
 * out of it. A client-side check would let the protected data reach the browser
 * first, which is the failure the requirement is actually about.
 *
 * The second half of this file is the part that can hurt someone: public routes
 * must stay open. A guard that over-matched would send a parent trying to read
 * the privacy notice to a sign-in form — the worst possible outcome for the page
 * whose job is to explain what happens to their data. Every public path is
 * asserted open in `middleware.test.ts` so a matcher that grows too wide fails
 * the suite rather than shipping.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/types";

/** The app routes this plan builds behind a parent account. */
export const PROTECTED_APP_PATHS = [
  "/parent",
  "/onboarding",
  "/settings",
  "/practice",
  "/diagnostic",
  "/session",
] as const;

const SIGN_IN_PATH = "/sign-in";

/**
 * Whether a path is an app route.
 *
 * The prefixes are matched in full rather than with `startsWith`, so
 * `/settings-help` and `/sessions` are treated as the unrelated public paths
 * they are rather than being swallowed by `/settings` and `/session`.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next();
  }

  const signIn = request.nextUrl.clone();
  signIn.pathname = SIGN_IN_PATH;
  signIn.search = "";
  return NextResponse.redirect(signIn);
}

export default middleware;

export const config = {
  matcher: PROTECTED_APP_PATHS.map((path) => `${path}/:path*`),
};
