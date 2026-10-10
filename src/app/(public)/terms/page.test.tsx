/**
 * `/terms` — the same three contracts as `/privacy` (R4, R13): one H1, the
 * review banner while the copy is unapproved, and indexable metadata. The
 * content is scanned alongside the privacy copy in
 * `src/content/legal/legal-copy.test.ts`.
 */
import { render, screen } from "@testing-library/react";
import TermsPage, { metadata } from "./page";

describe("/terms", () => {
  it("renders exactly one H1", () => {
    const { container } = render(<TermsPage />);

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent?.trim()).toBeTruthy();
  });

  it("carries the review banner while the copy is unapproved", () => {
    render(<TermsPage />);

    expect(screen.getByRole("note")).toHaveTextContent(/not approved/i);
  });

  it("renders the sections of the document it publishes", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { level: 2, name: /what this service is/i }),
    ).toBeInTheDocument();
  });

  it("ships a title, a description, a social preview, and stays indexable", () => {
    expect(typeof metadata.title).toBe("string");
    expect(String(metadata.title).trim()).not.toBe("");
    expect(typeof metadata.description).toBe("string");
    expect(String(metadata.description).trim()).not.toBe("");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();

    const robots = metadata.robots;
    expect(typeof robots === "object" && robots !== null ? robots.index : undefined).not.toBe(
      false,
    );
  });
});