/**
 * `/privacy` — what the page has to be for a parent reading it cold (R4, R13).
 *
 * Three things are held in place: exactly one H1, the review banner that marks
 * the copy as unapproved, and metadata that makes the page findable without
 * pretending to be more finished than it is. The content itself is scanned in
 * `src/content/legal/legal-copy.test.ts`, which reads the document file this
 * page renders.
 */
import { render, screen } from "@testing-library/react";
import PrivacyPage, { metadata } from "./page";

describe("/privacy", () => {
  it("renders exactly one H1", () => {
    const { container } = render(<PrivacyPage />);

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent?.trim()).toBeTruthy();
  });

  it("carries the review banner while the copy is unapproved", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("note")).toHaveTextContent(/not approved/i);
  });

  it("renders the sections of the document it publishes", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { level: 2, name: /who holds the account/i }),
    ).toBeInTheDocument();
  });

  it("ships a title, a description, a social preview, and stays indexable", () => {
    expect(typeof metadata.title).toBe("string");
    expect(String(metadata.title).trim()).not.toBe("");
    expect(typeof metadata.description).toBe("string");
    expect(String(metadata.description).trim()).not.toBe("");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();

    // Indexable is the route group's default (R13). Setting this page to
    // noindex is the failure worth catching here.
    const robots = metadata.robots;
    expect(typeof robots === "object" && robots !== null ? robots.index : undefined).not.toBe(
      false,
    );
  });
});