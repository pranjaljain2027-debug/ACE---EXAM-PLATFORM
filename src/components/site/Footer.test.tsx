/**
 * Footer contracts for U3 (R13, R35).
 *
 * The copyright year is the interesting one: it must be produced at render
 * time, never written into the source. The test pins the clock to a year the
 * file never mentions, so a hardcoded one fails it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen, within } from "@testing-library/react";
import { Footer } from "./Footer";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(HERE, "..", "..", "app");

function routesOnDisk(dir: string = APP_DIR, segments: readonly string[] = []): string[] {
  const routes: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...routesOnDisk(full, [...segments, entry.name]));
      continue;
    }
    if (entry.name !== "page.tsx") continue;

    const path = segments
      .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
      .join("/");
    routes.push(path === "" ? "/" : `/${path}`);
  }

  return routes;
}

/** Routes owned by later units in the same plan: U6 auth, U9 legal. */
const ROUTES_OWNED_BY_LATER_UNITS = ["/sign-in", "/sign-up", "/privacy", "/terms"];

describe("Footer", () => {
  it("renders the wordmark and every content link, with no external or social links", () => {
    render(<Footer />);

    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", { name: "Heir of Wisdom" }),
    ).toHaveAttribute("href", "/");

    const nav = within(screen.getByRole("navigation", { name: "Footer" }));
    const links = nav.getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "How it works",
      "Assessments",
      "FAQ",
      "Contact and support",
      "Privacy",
      "Terms",
    ]);

    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("/")).toBe(true);
      expect(href).not.toContain("//");
    }
  });

  it("resolves every footer link to a real route or an owned later-unit route", () => {
    const { container } = render(<Footer />);

    const targets = new Set([...routesOnDisk(), ...ROUTES_OWNED_BY_LATER_UNITS]);
    const hrefs = [...container.querySelectorAll("a[href]")].map((anchor) => {
      const href = anchor.getAttribute("href") ?? "";
      return href.split("#")[0] ?? href;
    });

    expect(hrefs.filter((href) => !targets.has(href))).toEqual([]);
    expect(hrefs.length).toBeGreaterThan(0);
  });

  it("reads the year from the clock at render time rather than from the source", () => {
    // Only Date is faked: faking the scheduling timers would stall React.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-06-15T12:00:00Z"));

    try {
      const { container } = render(<Footer />);

      expect(container.textContent).toContain("2031");
      // The year the repository was authored must not appear: that is exactly
      // what a hardcoded year would render.
      expect(container.textContent).not.toContain("2026");
    } finally {
      vi.useRealTimers();
    }
  });

  it("hardcodes no year anywhere in its source", () => {
    const source = readFileSync(join(HERE, "Footer.tsx"), "utf8");

    expect(source).not.toMatch(/\b(19|20)\d{2}\b/);
  });
});