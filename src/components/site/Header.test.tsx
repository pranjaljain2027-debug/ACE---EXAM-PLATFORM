/**
 * Site-shell contracts for U3 (R13, R33, R34, R35).
 *
 * Two things are proven here. First, the header offers the navigation the plan
 * asks for — wordmark, three links, the primary call to action, and sign-in —
 * and offers it in a way a keyboard can reach. Second, every link it renders
 * goes somewhere real: the destinations are resolved against the routes that
 * actually exist under `src/app`, so a typo or a private route leaking into
 * the public shell fails here rather than in front of a visitor.
 *
 * The mobile menu is driven through `<Header />` rather than in isolation, so
 * these tests exercise the component a page actually renders.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

const { currentPath } = vi.hoisted(() => ({ currentPath: { value: "/" } }));

// The menu closes when the route changes, which it reads from the router. No
// App Router context exists in jsdom, so the router is the one thing stubbed.
vi.mock("next/navigation", () => ({
  usePathname: () => currentPath.value,
}));

// Resolved from the module's own path rather than `new URL(..., import.meta.url)`
// with a literal, which the bundler rewrites into an asset URL.
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app");

/** Every route `src/app` actually serves, route groups excluded from the path. */
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

/**
 * Routes this unit links to that a later unit in the same plan owns: the
 * parent account routes (U6) and the legal pages (U9). They are absent from
 * `src/app` today, so they are named here rather than waved through, and every
 * other href still has to resolve against a route that exists. `Header.tsx`
 * records why the shell links them before they are built.
 */
const ROUTES_OWNED_BY_LATER_UNITS = ["/sign-in", "/sign-up", "/privacy", "/terms"];

function resolvedTargets(): Set<string> {
  return new Set([...routesOnDisk(), ...ROUTES_OWNED_BY_LATER_UNITS]);
}

function hrefsWithin(container: HTMLElement): string[] {
  return [...container.querySelectorAll("a[href]")].map((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    return href.split("#")[0] ?? href;
  });
}

/**
 * The region the trigger controls. Resolved through `aria-controls` rather than
 * by class name, so the test also proves the trigger points at the panel it
 * opens — a broken reference here is invisible until a screen reader hits it.
 */
function menuPanel(trigger: HTMLElement): HTMLElement {
  const id = trigger.getAttribute("aria-controls");
  const panel = id ? document.getElementById(id) : null;

  if (!panel) throw new Error("The menu trigger controls no element");
  return panel;
}

beforeEach(() => {
  currentPath.value = "/";
});

describe("Header", () => {
  it("renders the wordmark linking home, the three nav links, sign-in and the primary CTA", () => {
    render(<Header />);

    const wordmark = screen.getByRole("link", { name: "Heir of Wisdom" });
    expect(wordmark).toHaveAttribute("href", "/");

    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    expect(nav.getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
    expect(nav.getByRole("link", { name: "Assessments" })).toHaveAttribute(
      "href",
      "/assessments",
    );
    expect(nav.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/faq");

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Start free diagnostic" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("links only to routes that exist or are owned by a named later unit", () => {
    const { container } = render(<Header />);

    const targets = resolvedTargets();
    const unresolved = hrefsWithin(container).filter((href) => !targets.has(href));

    expect(unresolved).toEqual([]);
    // Guard the guard: an empty scan would pass vacuously.
    expect(hrefsWithin(container).length).toBeGreaterThan(0);
  });

  it("reports the menu as collapsed, and keeps it out of the page until it opens", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();
  });

  it("moves focus into the menu when it opens", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);

    expect(menuPanel(trigger).contains(document.activeElement)).toBe(true);
  });

  it("keeps Tab inside the open menu and cycles back past the last link", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    const panel = menuPanel(trigger);

    // Twice round the menu: every stop has to stay inside it.
    for (let index = 0; index < 8; index += 1) {
      await user.tab();
      expect(panel.contains(document.activeElement)).toBe(true);
    }

    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  });

  it("keeps Shift+Tab inside the open menu and cycles back past the first link", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    const panel = menuPanel(trigger);

    for (let index = 0; index < 4; index += 1) {
      await user.tab({ shift: true });
      expect(panel.contains(document.activeElement)).toBe(true);
    }
  });

  it("closes on Escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when the route changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Header />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();

    currentPath.value = "/faq";
    rerender(<Header />);

    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });
});