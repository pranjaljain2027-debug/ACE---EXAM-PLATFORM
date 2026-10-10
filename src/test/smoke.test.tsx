/**
 * Smoke test for the test harness itself (U1 Test scenarios).
 *
 * U1 wires Vitest, jsdom, the `@` path alias and the Testing Library matchers
 * together. Nothing else in the plan can be verified until that wiring works,
 * so this asserts the harness end to end rather than any product behavior.
 */
import { render, screen } from "@testing-library/react";

describe("test harness", () => {
  it("runs tests in a jsdom environment with the @ alias resolved", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });

  it("renders a component and exposes jest-dom matchers", () => {
    render(
      <button type="button" disabled>
        Scaffold
      </button>,
    );
    expect(screen.getByRole("button", { name: "Scaffold" })).toBeDisabled();
  });
});