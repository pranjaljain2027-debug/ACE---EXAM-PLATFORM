/**
 * Sitemap contracts for U3 (R13).
 *
 * The sitemap is what a crawler is told to index, so it is held to two rules
 * at once: every public route is in it, and nothing that sits behind an
 * account is. The first rule is checked against the routes that exist on disk,
 * which means a public page added later fails here until the sitemap catches
 * up. The second is checked against the private prefixes the app reserves.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sitemap from "./sitemap";

const HERE = dirname(fileURLToPath(import.meta.url));

interface RouteOnDisk {
  /** The path a browser sees. */
  readonly path: string;
  /** Whether the route is filed under the `(public)` group. */
  readonly isPublic: boolean;
}

function routesOnDisk(dir: string = HERE, segments: readonly string[] = []): RouteOnDisk[] {
  const routes: RouteOnDisk[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...routesOnDisk(full, [...segments, entry.name]));
      continue;
    }
    if (entry.name !== "page.tsx") continue;

    const publicSegments = segments.filter((segment) => segment === "(public)");
    const path = segments
      .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
      .join("/");

    routes.push({
      path: path === "" ? "/" : `/${path}`,
      // The root route is the marketing landing page; everything else counts as
      // public only when it is filed inside the `(public)` group.
      isPublic: segments.length === 0 || publicSegments.length > 0,
    });
  }

  return routes;
}

const PRIVATE_PREFIXES = [
  "/parent",
  "/onboarding",
  "/session",
  "/settings",
  "/practice",
  "/diagnostic",
  "/sign-in",
  "/sign-up",
];

async function sitemapPaths(): Promise<string[]> {
  const entries = await sitemap();
  return entries.map((entry) => new URL(entry.url).pathname.replace(/\/$/, "") || "/");
}

describe("sitemap", () => {
  it("lists every public route that exists", async () => {
    const publicRoutes = routesOnDisk()
      .filter((route) => route.isPublic)
      .map((route) => route.path);

    // Guard the guard: an empty scan would pass vacuously.
    expect(publicRoutes.length).toBeGreaterThan(0);

    expect(await sitemapPaths()).toEqual(expect.arrayContaining(publicRoutes));
  });

  it("lists no route behind an account", async () => {
    const paths = await sitemapPaths();

    for (const path of paths) {
      for (const prefix of PRIVATE_PREFIXES) {
        expect(path === prefix || path.startsWith(`${prefix}/`)).toBe(false);
      }
    }
  });

  it("has no duplicate entries and only absolute URLs", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it("builds its list without importing a route module", () => {
    const source = readFileSync(join(HERE, "sitemap.ts"), "utf8");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1] ?? "");

    // Only Next's own metadata types may be imported. Importing a page module
    // would pull an authenticated route's component into the sitemap.
    expect(imports).toEqual(["next"]);
  });
});