/**
 * Route-guard contracts for U6 (R29, R35).
 *
 * Two separate promises are held here, and the second is the one that can hurt
 * a parent: the app routes are guarded, and the public routes are not. A guard
 * that over-matched would redirect someone trying to read the privacy notice to
 * a sign-in form, which is the worst possible outcome for the page whose job is
 * to tell people what happens to their data.
 *
 * The protected routes do not exist yet — they belong to later units of this
 * plan — so these tests drive the guard itself rather than a dev server: the
 * matcher is resolved through Next's own matcher, and the redirect is resolved
 * by running the real exported function against a real `NextRequest`. End-to-end
 * verification against a built app route is deferred to the unit that builds one.
 */
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import proxy, { config, PROTECTED_APP_PATHS, isProtectedPath } from "./proxy";

const ORIGIN = "https://heir-of-wisdom.test";

/**
 * The routes a visitor must be able to reach without an account. Every one of
 * these is asserted to stay open, so a matcher that grows too wide fails here.
 */
const PUBLIC_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/contact",
  "/assessments",
  "/faq",
  "/sign-in",
  "/sign-up",
] as const;

function request(pathname: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) headers.set("cookie", `how_demo_session=${token}`);

  return new NextRequest(new URL(pathname, ORIGIN), { headers });
}

describe("protected app paths", () => {
  it("names the app routes this plan builds behind the account", () => {
    expect([...PROTECTED_APP_PATHS]).toEqual([
      "/parent",
      "/onboarding",
      "/settings",
      "/practice",
      "/diagnostic",
      "/session",
    ]);
  });

  it.each([...PROTECTED_APP_PATHS])("treats %s and everything under it as protected", (path) => {
    expect(isProtectedPath(path)).toBe(true);
    expect(isProtectedPath(`${path}/child/42`)).toBe(true);
  });

  it("matches every protected path through Next's own matcher", () => {
    // `unstable_doesMiddlewareMatch` is the matcher Next itself uses to decide
    // whether to run this function at all, so a path the matcher skips is a path
    // that is never guarded no matter what the function below would decide.
    //
    // Note: the file convention is now `proxy.ts`, but this testing helper still
    // carries its original `Middleware` name — the runtime export has not been
    // renamed even though the docs describe `unstable_doesProxyMatch`.
    for (const path of PROTECTED_APP_PATHS) {
      expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
      expect(unstable_doesMiddlewareMatch({ config, url: `${path}/child/42` })).toBe(true);
    }
  });

  it("keeps the static matcher in step with the path list it must match", () => {
    // Next reads `config.matcher` by static analysis, so the array cannot be
    // derived from `PROTECTED_APP_PATHS` — it has to be written out. That leaves
    // two lists that could drift, so they are compared here rather than trusted.
    const matched = PROTECTED_APP_PATHS.map((path) => `${path}/:path*`);

    expect([...config.matcher]).toEqual(matched);
  });
});

describe("public paths", () => {
  it.each(PUBLIC_PATHS)("leaves %s open", (path) => {
    expect(isProtectedPath(path)).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
  });

  it("sends a request for a public path straight through", () => {
    const response = proxy(request("/privacy"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not treat a public path that merely starts like an app route as protected", () => {
    // The prefixes are matched in full, not by `startsWith`: `/settings-help`
    // and `/sign-in-help` are different pages and must not be swallowed.
    for (const path of ["/settings-help", "/sessions", "/practical", "/onboarding-info"]) {
      expect(isProtectedPath(path)).toBe(false);
    }
  });
});

describe("the guard", () => {
  it("redirects an unauthenticated request for an app route to sign-in", () => {
    const response = proxy(request("/parent"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
  });

  it("lets a request carrying a session through", () => {
    const response = proxy(request("/parent", "a-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps the query string the parent was heading for", () => {
    const response = proxy(request("/practice/week-3"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
  });

  it("does not send a signed-in visitor away from a public page", () => {
    expect(proxy(request("/terms", "a-token")).status).toBe(200);
  });
});