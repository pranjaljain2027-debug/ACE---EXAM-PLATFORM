/**
 * Public-route contracts for U3 (R13, R35).
 *
 * Every public page this unit owns must ship a real title and description,
 * social preview metadata, and exactly one H1 — the structure R13 asks for and
 * the thing a screen-reader user navigates by. Later units (U4 marketing copy,
 * U9 legal copy) replace the placeholder bodies; the contract they inherit is
 * what these tests hold in place.
 */
import { render, screen } from "@testing-library/react";
import type { Metadata } from "next";
import AssessmentsPage, { metadata as assessmentsMetadata } from "./assessments/page";
import ContactPage, { metadata as contactMetadata } from "./contact/page";
import FaqPage, { metadata as faqMetadata } from "./faq/page";

interface PublicRoute {
  readonly path: string;
  readonly Page: () => React.ReactElement;
  readonly metadata: Metadata;
}

const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: "/assessments", Page: AssessmentsPage, metadata: assessmentsMetadata },
  { path: "/contact", Page: ContactPage, metadata: contactMetadata },
  { path: "/faq", Page: FaqPage, metadata: faqMetadata },
];

/**
 * Claim types no page may contain (R2, R4, R5). Scoped to the words that can
 * only ever be a promise — a later unit can honestly write "not affiliated
 * with", so that phrasing is not on this list.
 */
const PROHIBITED_CLAIMS = [
  "guaranteed",
  "clinically proven",
  "coppa",
  "gdpr",
  "ferpa",
  "certified",
  "official partner",
  "success rate",
  "% improvement",
];

describe("public routes", () => {
  it("covers every route this unit owns", () => {
    expect(PUBLIC_ROUTES.map((route) => route.path)).toEqual([
      "/assessments",
      "/contact",
      "/faq",
    ]);
  });

  it.each(PUBLIC_ROUTES)("$path renders exactly one non-empty H1", ({ Page }) => {
    const { container } = render(<Page />);
    const headings = container.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent?.trim()).toBeTruthy();
  });

  it.each(PUBLIC_ROUTES)(
    "$path ships a title, a description and its own social preview description",
    ({ metadata }) => {
      expect(typeof metadata.title).toBe("string");
      expect(String(metadata.title).trim()).not.toBe("");
      expect(typeof metadata.description).toBe("string");
      expect(String(metadata.description).trim()).not.toBe("");
      expect(metadata.openGraph?.title).toBeTruthy();
      expect(metadata.openGraph?.description).toBeTruthy();
    },
  );

  it("promises nothing no unit is allowed to promise", () => {
    for (const { Page } of PUBLIC_ROUTES) {
      const { container } = render(<Page />);
      const text = (container.textContent ?? "").toLowerCase();

      for (const claim of PROHIBITED_CLAIMS) {
        expect(text).not.toContain(claim);
      }
    }

    // Guard the guard: the scan must have rendered real copy, not nothing.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(PUBLIC_ROUTES.length);
  });
});