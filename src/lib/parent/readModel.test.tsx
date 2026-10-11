/**
 * Parent dashboard contracts (U14, R27, R28, R30, AE3, AE4).
 *
 * The two things worth proving here are the empty state and the ownership
 * boundary. Everything else — the numbers matching a fixture — is the
 * calculator's job and is tested there.
 *
 * The empty state matters because it is the one that is easy to get wrong: a
 * dashboard with no practice can render a chart of zeroes, and zeroes read as
 * "your child did badly" rather than "there is nothing yet".
 */
import { render, screen } from "@testing-library/react";
import ParentPage from "@/app/parent/page";
import { readChild, readParentOverview } from "./readModel";
import { DEMO_CHILD_ID } from "@/lib/data/mock";

const OWNING_PARENT = "parent-demo-1";
const OTHER_PARENT = "parent-someone-else";

describe("readChild", () => {
  it("returns a child the parent owns", () => {
    expect(readChild(OWNING_PARENT, DEMO_CHILD_ID)?.id).toBe(DEMO_CHILD_ID);
  });

  it("returns null for another parent's child id (AE4)", () => {
    expect(readChild(OTHER_PARENT, DEMO_CHILD_ID)).toBeNull();
  });

  it("returns null rather than an empty result, so an unowned child is not mistaken for a child with no history", () => {
    // An empty ChildRecord would render the same "no sessions" state a real
    // child with no practice renders. Null is what keeps those distinguishable.
    expect(readChild(OTHER_PARENT, DEMO_CHILD_ID)).not.toBeInstanceOf(Object);
  });
});

describe("readParentOverview", () => {
  it("scopes to the requested child when the parent owns them", () => {
    const overview = readParentOverview(OWNING_PARENT, DEMO_CHILD_ID);

    expect(overview.activeChild?.id).toBe(DEMO_CHILD_ID);
    expect(overview.progress).not.toBeNull();
  });

  it("returns no active child when asked for one the parent does not own (R30)", () => {
    const overview = readParentOverview(OTHER_PARENT, DEMO_CHILD_ID);

    expect(overview.activeChild).toBeNull();
    expect(overview.progress).toBeNull();
    expect(overview.activity).toHaveLength(0);
  });

  it("defaults to the parent's first child", () => {
    const overview = readParentOverview(OWNING_PARENT);

    expect(overview.activeChild?.id).toBe(DEMO_CHILD_ID);
  });

  it("reports a null progress rather than a zeroed summary for a parent with no children", () => {
    const overview = readParentOverview(OTHER_PARENT);

    expect(overview.children).toHaveLength(0);
    expect(overview.progress).toBeNull();
    expect(overview.recommendation).toBeNull();
  });

  it("derives activity from stored sessions, newest first", () => {
    const overview = readParentOverview(OWNING_PARENT, DEMO_CHILD_ID);

    expect(overview.activity.length).toBeGreaterThan(0);
    expect(overview.activity[0]?.completedOn).toBe("2026-10-05");
  });
});

describe("ParentPage", () => {
  it("renders exactly one H1", () => {
    const { container } = render(<ParentPage />);

    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("offers exactly one primary recommended action", () => {
    render(<ParentPage />);

    const primary = screen.getAllByRole("link", { name: /practice|harder|basics/i });
    const recommended = screen
      .getByRole("region", { name: /what to do next/i })
      .querySelectorAll(".button--primary");

    // One primary action inside the recommendation region. The dashboard has
    // other links; what matters is that the recommendation itself does not
    // offer a choice between three equally-weighted suggestions.
    expect(recommended.length).toBe(1);
    expect(primary.length).toBeGreaterThan(0);
  });

  it("labels demo data as demo data rather than showing it as a real child's practice", () => {
    render(<ParentPage />);

    expect(screen.getByRole("note")).toHaveTextContent(/demo data/i);
  });

  it("never states a compliance or assessment status", () => {
    const { container } = render(<ParentPage />);
    const text = (container.textContent ?? "").toLowerCase();

    for (const prohibited of ["coppa", "gdpr", "ferpa", "compliant", "percentile", "iq score"]) {
      expect(text).not.toContain(prohibited);
    }
  });
});
