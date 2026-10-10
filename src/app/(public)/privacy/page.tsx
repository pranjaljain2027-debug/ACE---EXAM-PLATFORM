import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewBanner } from "@/components/legal/ReviewBanner";

/**
 * `/privacy` (U9, R4, R13).
 *
 * The copy lives in `src/content/legal/privacy.md` as a markdown document rather
 * than as JSX, because a qualified reviewer is going to rewrite it and rewriting
 * prose does not mean editing a component tree. The file is read at module scope:
 * it is part of the page's content, and reading it once per process is enough.
 *
 * The document says what this build does and nothing more. It claims no legal
 * status of any kind, and `legal-copy.test.ts` fails the build if it ever does.
 */
export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What a child's record holds, what this build stores, and what it does not claim about itself. Unapproved draft copy.",
  openGraph: {
    title: "Privacy notice · Heir of Wisdom",
    description:
      "What a child's record holds, what this build stores, and what it does not claim about itself. Unapproved draft copy.",
  },
};

/**
 * Read relative to the project root rather than to this module, so the same
 * path resolves during a build and at runtime. If the app is ever deployed with
 * `output: "standalone"`, add this file to the route's
 * `outputFileTracingIncludes` — the tracing pass cannot see a path built at
 * runtime.
 */
const DOCUMENT = readFileSync(
  join(process.cwd(), "src", "content", "legal", "privacy.md"),
  "utf8",
);

/**
 * The legal page's own layer, shipped as a scoped style element because this unit
 * owns no stylesheet. It reads only the tokens in `src/styles/tokens.css`.
 *
 * The measure is what matters here: legal prose set across the full 72rem column
 * is hard to read, and this page is read once, carefully.
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
 * This is deliberately not a markdown parser. The documents are the only input,
 * they are written by this repository, and a dependency or a general parser would
 * be more surface than the format needs.
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

export default function PrivacyPage() {
  return (
    <>
      <style href="legal-document" precedence="default">
        {LEGAL_STYLES}
      </style>

      <h1>Privacy notice</h1>

      <ReviewBanner documentName="privacy notice" />

      <div className="legal-document">{renderDocument(DOCUMENT)}</div>

      <p className="legal-closing">
        Something here not answered? <Link href="/contact">Contact and support</Link>.
      </p>
    </>
  );
}