/**
 * One scan over every word of legal copy, wherever it is written (R4).
 *
 * R4 is the rule this product cannot get wrong twice: a children's service may
 * not say it complies with anything until a qualified reviewer has written that
 * sentence. The scan below runs over the two markdown documents *and* over the
 * pages that render them, so copy cannot dodge it by moving between the file
 * and the component.
 *
 * The banned words are deliberately blunt. "compliant" in any form is out, as
 * are the names of the statutes themselves: a page that cannot say "COPPA" also
 * cannot drift into "COPPA compliant" through an edit nobody read carefully. A
 * reviewed document replaces this copy wholesale, and replaces this list with it.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@testing-library/react";
import PrivacyPage from "@/app/(public)/privacy/page";
import TermsPage from "@/app/(public)/terms/page";

const HERE = dirname(fileURLToPath(import.meta.url));

const privacy = readFileSync(join(HERE, "privacy.md"), "utf8");
const terms = readFileSync(join(HERE, "terms.md"), "utf8");

const PAGES: readonly {
  name: string;
  Page: () => React.ReactElement;
  source: string;
}[] = [
  { name: "/privacy", Page: PrivacyPage, source: privacy },
  { name: "/terms", Page: TermsPage, source: terms },
];

/** Words that can only ever be a claim about legal standing. */
const FORBIDDEN = [
  "compliant",
  "compliance",
  "certified",
  "coppa",
  "gdpr",
  "ferpa",
  "hipaa",
  "guarantee",
  "endorsed by us",
];

describe("legal copy", () => {
  it("ships two real documents rather than empty placeholders", () => {
    expect(privacy.trim().length).toBeGreaterThan(800);
    expect(terms.trim().length).toBeGreaterThan(800);
  });

  it.each([
    ["src/content/legal/privacy.md", privacy],
    ["src/content/legal/terms.md", terms],
  ])("%s claims no legal status", (_file, copy) => {
    const text = copy.toLowerCase();

    for (const word of FORBIDDEN) {
      expect(text).not.toContain(word);
    }
  });

  it.each(PAGES)("$name claims no legal status either", ({ Page }) => {
    const { container } = render(<Page />);
    const text = (container.textContent ?? "").toLowerCase();

    // Guard the guard: a page that rendered nothing would pass the scan.
    expect(text.length).toBeGreaterThan(800);

    for (const word of FORBIDDEN) {
      expect(text).not.toContain(word);
    }
  });

  it.each(PAGES)("$name renders every bullet as exactly one list item", ({ Page, source }) => {
    const { container } = render(<Page />);
    const bullets = source.match(/^- /gm) ?? [];

    // Guard the guard: a document with no bullets would pass vacuously.
    expect(bullets.length).toBeGreaterThan(2);
    expect(container.querySelectorAll("li")).toHaveLength(bullets.length);

    // A bullet whose text wraps onto the next line in the file must still read
    // as a sentence. If the renderer ever stops joining those lines, a reader
    // sees a stray "- " instead.
    expect(container.textContent).not.toMatch(/(?:^|\s)- /);
  });

  it("tells a parent that demo mode stores nothing securely", () => {
    // KTD6 settles it: demo mode is surfaced, not hidden, and the privacy page
    // has to agree with the label the app shows. Both halves are checked, because
    // a copy edit that drops either one leaves a parent deciding on incomplete
    // information.
    expect(privacy).toMatch(/demo mode/i);
    expect(privacy).toMatch(/securely/i);
  });

  it("does not send a parent to a deletion control that does not exist", () => {
    expect(privacy).toMatch(/delet\w*/i);
    expect(privacy).toMatch(/does not exist yet|not built|not yet/i);
  });

  it("says the practice result is not an official score", () => {
    expect(terms).toMatch(/official score/i);
    expect(terms).toMatch(/gifted/i);
  });

  it("says the terms themselves are not settled", () => {
    expect(terms).toMatch(/not been written|not settled|not yet agreed/i);
  });
});