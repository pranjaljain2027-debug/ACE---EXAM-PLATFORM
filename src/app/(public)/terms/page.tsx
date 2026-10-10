import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewBanner } from "@/components/legal/ReviewBanner";

/**
 * `/terms` (U9, R4, R13).
 *
 * The copy lives in `src/content/legal/terms.md` for the same reason the privacy
 * notice lives in a file: a qualified reviewer rewrites this text, and the
 * rewrite should not mean editing a component tree.
 *
 * A terms page that reads as settled is worse than one that admits it is not, so
 * the document leads with its own unapproved status and says which parts of a
 * terms document have not been written yet. It claims no legal status of any
 * kind; `legal-copy.test.ts` fails the build if it ever does.
 */
export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "What this service is, what practice results are not, and which parts of these terms have not been written. Unapproved draft copy.",
  openGraph: {
    title: "Terms of use · Heir of Wisdom",
    description:
      "What this service is, what practice results are not, and which parts of these terms have not been written. Unapproved draft copy.",
  },
};

/**
 * Read relative to the project root rather than to this module, so the same path
 * resolves during a build and at runtime. Under `output: "standalone"` this file
 * would need adding to the route's `outputFileTracingIncludes`.
 */
const DOCUMENT = readFileSync(
  join(process.cwd(), "src", "content", "legal", "terms.md"),
  "utf8",
);

/**
 * The legal page's own layer, shipped as a scoped style element because this unit
 * owns no stylesheet. It reads only the tokens in `src/styles/tokens.css`.
 *
 * `/privacy` ships the same layer for the same reason; neither page can reach for
 * a stylesheet this unit does not own.
 */
const LEGAL_STYLES = `
.legal-document {
  display: grid;
  gap: var(--space-4);
  max-width: var(--reading-max);
}

.legal-document h2 {
  margin-top: var(--space-5);
  font-size: var(--text-xl);
}

.legal-document p,
.legal-document li {
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.legal-document ul {
  display: grid;
  gap: var(--space-2);
  padding-left: var(--space-5);
  list-style: disc;
}

.legal-closing {
  max-width: var(--reading-max);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}
`;

/**
 * Renders the three shapes the legal documents are written in: a `## ` heading,
 * a `- ` list, and a paragraph. A list item may wrap onto a following line, which
 * is how the markdown files stay readable in a text editor.
 *
 * This is deliberately not a markdown parser: the documents are the only input,
 * they are written by this repository, and a general parser would be more surface
 * than the format needs.
 */
function renderDocument(markdown: string): ReactNode[] {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block !== "")
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim());
      const heading = lines[0] ?? "";

      if (heading.startsWith("## ")) {
        return <h2 key={heading}>{heading.slice(3)}</h2>;
      }

      if (heading.startsWith("- ")) {
        let current = "";
        const items: string[] = [];

        for (const line of lines) {
          if (line.startsWith("- ")) {
            if (current !== "") items.push(current);
            current = line.slice(2).trim();
          } else if (current !== "") {
            current += ` ${line}`;
          }
        }
        if (current !== "") items.push(current);

        return (
          <ul key={heading}>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      }

      return <p key={heading}>{lines.join(" ")}</p>;
    });
}

export default function TermsPage() {
  return (
    <>
      <style href="legal-document" precedence="default">
        {LEGAL_STYLES}
      </style>

      <h1>Terms of use</h1>

      <ReviewBanner documentName="terms of use" />

      <div className="legal-document">{renderDocument(DOCUMENT)}</div>

      <p className="legal-closing">
        Questions about anything here go to{" "}
        <Link href="/contact">contact and support</Link>, or read the{" "}
        <Link href="/privacy">privacy notice</Link> for what this build stores.
      </p>
    </>
  );
}