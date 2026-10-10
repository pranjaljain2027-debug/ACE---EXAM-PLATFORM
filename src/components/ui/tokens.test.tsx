/**
 * Style-layer contracts for U2.
 *
 * These tests read the two stylesheets as text because jsdom does not resolve
 * the authored cascade: a `var(--token)` typo or a deleted focus rule is
 * invisible to a DOM assertion but breaks the product the moment it renders.
 * The rules asserted here are the ones every later unit inherits.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

/** Comments carry prose, not declarations; scanning them would invent tokens. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

const tokensCss = stripComments(read("../../styles/tokens.css"));
const globalsCss = stripComments(read("../../app/globals.css"));

function definedTokens(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]!));
}

function consumedTokens(css: string): Set<string> {
  return new Set(
    [...css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1]!),
  );
}

describe("design tokens", () => {
  it("defines every custom property globals.css consumes", () => {
    const defined = definedTokens(tokensCss);
    const consumed = consumedTokens(globalsCss);

    // Guard the guard: an empty scan would pass vacuously.
    expect(consumed.size).toBeGreaterThan(10);

    const undefinedTokens = [...consumed].filter((token) => !defined.has(token));
    expect(undefinedTokens).toEqual([]);
  });

  it("defines the named palette, type, and control tokens the direction depends on", () => {
    const defined = definedTokens(tokensCss);

    const required = [
      "--color-canvas",
      "--color-surface",
      "--color-surface-sunken",
      "--color-border",
      "--color-text",
      "--color-text-muted",
      "--color-accent",
      "--color-accent-strong",
      "--color-accent-muted",
      "--color-success",
      "--color-danger",
      "--color-warning",
      "--color-focus-ring",
      "--font-sans",
      "--font-display",
      "--line-height-body",
      "--radius-md",
      "--control-min-size",
      "--duration-base",
    ];

    expect(required.filter((token) => !defined.has(token))).toEqual([]);
  });

  it("keeps the palette restrained: one accent, no rainbow of hues", () => {
    const defined = [...definedTokens(tokensCss)];
    const colorTokens = defined.filter((token) => token.startsWith("--color-"));

    // Status and focus colours carry information, not decoration.
    const decorative = colorTokens.filter(
      (token) => !/(success|danger|warning|info|focus)/.test(token),
    );

    // Any decorative color must resolve to the canvas/surface/border/ink/accent set.
    const allowedRoots = [
      "--color-canvas",
      "--color-surface",
      "--color-border",
      "--color-text",
      "--color-accent",
    ];
    const stray = decorative.filter(
      (token) =>
        !allowedRoots.some((root) => token === root || token.startsWith(`${root}-`)),
    );

    expect(stray).toEqual([]);
    expect(decorative.length).toBeLessThanOrEqual(20);
  });

  it("derives the focus ring from the palette instead of introducing a hue", () => {
    const focusRing = tokensCss.match(/--color-focus-ring:\s*([^;]+);/)?.[1]?.trim();
    expect(focusRing).toBeDefined();

    const derived = /^var\((--[A-Za-z0-9_-]+)\)$/.exec(focusRing ?? "");
    expect(derived).not.toBeNull();
    expect(definedTokens(tokensCss).has(derived![1]!)).toBe(true);
  });

  it("never removes a focus indicator without replacing it", () => {
    const rules = [...globalsCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const focusRules = rules.filter(([, selector]) =>
      selector?.includes(":focus-visible"),
    );

    expect(focusRules.length).toBeGreaterThan(0);
    for (const [, , body] of focusRules) {
      expect(body).toMatch(/outline:/);
      expect(body).not.toMatch(/outline:\s*(none|0)\b/);
    }
    expect(globalsCss).not.toMatch(/outline:\s*none\b/);
  });

  it("neutralizes motion in the shared layer when reduced motion is requested", () => {
    const marker = globalsCss.indexOf("prefers-reduced-motion");
    expect(marker).toBeGreaterThan(-1);

    const reducedMotionBlock = globalsCss.slice(marker);
    expect(reducedMotionBlock).toMatch(/--duration-base:\s*0ms/);
    expect(reducedMotionBlock).toMatch(/animation-iteration-count:\s*1/);
  });

  it("imports the token layer before any rule that uses it", () => {
    const importIndex = globalsCss.indexOf("@import");
    expect(importIndex).toBeGreaterThan(-1);

    const firstTokenUse = globalsCss.search(/var\(\s*--/);
    expect(firstTokenUse).toBeGreaterThan(-1);
    expect(importIndex).toBeLessThan(firstTokenUse);
  });
});
