/**
 * The fabricated-claims scan (U16, R2, R4, R12).
 *
 * This is the automated guard behind the product's honesty requirements. The
 * requirements say the site must not claim an outcome, an endorsement, a
 * partnership, or a compliance status it has not earned; this file is what stops
 * a future copy edit from quietly breaching that.
 *
 * Two properties matter more than the pattern list itself.
 *
 * It scans the *source*, not the built output, so it runs without a build and
 * fails at the moment the claim is typed rather than at deploy time.
 *
 * And it has an escape that is deliberately awkward. A term the product genuinely
 * needs — "guarantee" in a sentence about *not* guaranteeing anything — must be
 * allowed through with a written reason, so the exception is visible in the diff
 * rather than being a regex tweak nobody notices.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Claims the product has not earned (R2, R4, R12).
 *
 * Patterns rather than exact sentences, so that rephrasing cannot slip past. The
 * groups are ordered most-specific first because several of these appear inside
 * longer phrases.
 */
const PROHIBITED: ReadonlyArray<{ readonly pattern: RegExp; readonly label: string }> = [
  // Endorsement and affiliation — naming the assessments is required, implying
  // endorsement is not.
  { pattern: /officially\s+(approved|endorsed|partnered|affiliated)/i, label: "official endorsement" },
  { pattern: /endorsed\s+by\s+(the\s+)?(cogat|olsat|nnat)/i, label: "endorsement by an assessment publisher" },
  { pattern: /in\s+partnership\s+with\s+(the\s+)?(cogat|olsat|nnat)/i, label: "assessment partnership" },
  { pattern: /official\s+(test\s+)?partner/i, label: "official partnership" },

  // Compliance status — the plan's hardest constraint (R4).
  { pattern: /\b(coppa|gdpr|ferpa|hipaa)\s*[-–]?\s*(compliant|approved|audited)/i, label: "compliance status" },
  { pattern: /\b(fully\s+)?compliant\b/i, label: "compliance status" },
  { pattern: /\bcertified\b/i, label: "certification claim" },

  // Outcomes and efficacy — the product teaches reasoning, it does not raise a
  // score, and nothing here is evidence of that either way.
  { pattern: /\bguarantee[sd]?\b/i, label: "guarantee" },
  { pattern: /\bguaranteed\s+(score|improv|placement|gifted)/i, label: "outcome guarantee" },
  { pattern: /\b\d+%\s*(improvement|increase|higher|faster|better)/i, label: "outcome statistic" },
  { pattern: /\b(clinically|research)\s+(proven|validated|studied)/i, label: "clinical efficacy claim" },
  { pattern: /\bproven\s+to\s+(improve|increase|boost)/i, label: "efficacy claim" },
  { pattern: /\b(raises?|boosts?|increases?)\s+(your\s+child'?s?\s+)?(iq|score|scores)\b/i, label: "score claim" },

  // Assessment-result framing — the product is practice, not a test (R5, R20).
  { pattern: /\bpercentile\b/i, label: "percentile framing" },
  { pattern: /\biq\s+(score|test|range)\b/i, label: "IQ framing" },
  { pattern: /\bgifted\s+(programme|program|placement)\b/i, label: "gifted placement claim" },
  { pattern: /\bdiagnos(is|e|ed)\b/i, label: "clinical framing" },

  // Social proof the product has none of (R12).
  //
  // The adoption pattern requires a number big enough to only appear in a real
  // claim. A looser `\d+` also matched ordinary list text ("One demo parent and
  // one demo child" renders as "1, parents"), and a check that fires on the
  // project's own comments gets switched off rather than fixed.
  { pattern: /\b(trusted by|used by|loved by)\s+[\d,]+/i, label: "unverified user count" },
  {
    pattern: /\b\d{1,3}(,\d{3})+|\b\d{4,}\s+(schools|districts|parents|families|students)\b/i,
    label: "unverified adoption claim",
  },
  { pattern: /\b(testimonials?|reviews?\s+from)\b/i, label: "testimonial reference" },

  // Security claims the demo mode cannot support (R14).
  { pattern: /\b(bank|military|industry)\s*-?\s*grade\b/i, label: "security grade claim" },
  { pattern: /\bend-to-end\s+encrypt/i, label: "encryption claim" },
  { pattern: /\bstate-of-the-art\s+security\b/i, label: "security claim" },
];

/**
 * Text that must be stripped before scanning.
 *
 * Three categories, each for a specific reason rather than as a blanket
 * exemption, because a scan that exempts everything it does not understand is
 * not a scan.
 *
 *  1. Test files. A test asserting that the banner says no "COPPA compliant" has
 *     to contain the string "COPPA compliant" for the assertion to bite. Holding
 *     the tests to the same rule as the copy would force the honesty checks out
 *     of the suite.
 *  2. Prose comments. A rationale that reads "never an IQ score" is a
 *     commitment to not making the claim, and it is exactly the text a future
 *     maintainer needs to read.
 *  3. Negations. The shipped copy must be able to say what it is *not* — "not an
 *     IQ score" is the R5 disclaimer, and removing that phrasing to satisfy the
 *     scan would remove the honesty the scan exists to protect.
 */
const NEGATION_PHRASES: readonly string[] = [
  "not an iq score",
  "not an official assessment result",
  "no compliance status",
  "does not claim",
  "never an iq score",
  "not a prediction",
  "no guarantee",
  "does not guarantee",
  "there are no",
];

/** Remove comments and negations, leaving only the copy that reaches a page. */
function scannableText(content: string): string {
  // Block and line comments. A `//` inside a URL is not a comment, so the line
  // form requires whitespace or start-of-line before it.
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1 ");

  let text = withoutComments;
  for (const phrase of NEGATION_PHRASES) {
    text = text.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  }
  return text;
}

/** Whether a file's content is shipped to a parent rather than asserted about. */
function isShippedSource(file: string): boolean {
  return !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file);
}

/**
 * Deliberate, reviewed exceptions.
 *
 * Each entry is a file plus the reason the term is legitimate there. Adding one
 * is a decision someone has to make on purpose, which is the whole point — the
 * alternative is a pattern quietly loosened until it no longer catches anything.
 */
const ALLOWED: ReadonlyArray<{ readonly file: string; readonly contains: string; readonly reason: string }> = [
  {
    file: "src/content/legal/terms.md",
    contains: "gifted",
    reason:
      "States that results do not predict gifted placement. The claim is refused rather than made, and removing the sentence would leave the disclaimer weaker.",
  },
  {
    file: "src/content/marketing/copy.ts",
    contains: "Diagnose",
    reason:
      "One of the three plain-language step names — Diagnose, Practise, Track. A step a parent performs is not a clinical claim; the pattern matches the word, not the usage.",
  },
  {
    file: "src/components/marketing/Trust.tsx",
    contains: "testimonial",
    reason:
      "A comment recording that no testimonials appear on this page. The scan strips comments, so this entry is belt-and-braces for the source as written.",
  },
];

/** Source files worth scanning: everything the app ships from. */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, found);
    } else if (/\.(ts|tsx|md|mdx)$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

describe("fabricated-claims scan", () => {
  const allFiles = sourceFiles(join(process.cwd(), "src"));
  const files = allFiles.filter(isShippedSource);

  it("has source files to scan", () => {
    // Guard the guard: an empty scan passes vacuously, which is the failure
    // mode a content scan is most likely to have.
    expect(files.length).toBeGreaterThan(20);
  });

  it("excludes test files, which must contain the terms they assert are absent", () => {
    const testFiles = allFiles.filter((file) => !isShippedSource(file));
    expect(testFiles.length).toBeGreaterThan(0);
    expect(files.every(isShippedSource)).toBe(true);
  });

  it("finds no prohibited claim in any shipped source file", () => {
    const offences: string[] = [];

    for (const file of files) {
      const relPath = relative(process.cwd(), file).replace(/\\/g, "/");

      const exemptions = ALLOWED.filter((entry) => entry.file === relPath);
      let content = scannableText(readFileSync(file, "utf8"));

      // An exemption removes the term from consideration for that file only. It
      // does not switch the scan off, and it does not excuse any other term.
      for (const exemption of exemptions) {
        content = content.replace(
          new RegExp(exemption.contains.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          " ",
        );
      }

      for (const { pattern, label } of PROHIBITED) {
        const match = content.match(pattern);
        if (match) {
          offences.push(`${relPath}: ${label} — "${match[0]}"`);
        }
      }
    }

    expect(offences).toEqual([]);
  });

  it("strips comments, so a rationale is not mistaken for shipped copy", () => {
    const source = `/** Never an IQ score. */\nexport const copy = "Visit us";`;

    expect(scannableText(source)).not.toContain("IQ score");
    expect(scannableText(source)).toContain("Visit us");
  });

  it("strips negations, so the required disclaimers survive the scan", () => {
    // The R5 disclaimer has to be able to say what the results are not.
    expect(scannableText("These are not an IQ score or a placement prediction.")).not.toContain(
      "IQ score",
    );
    expect(scannableText("This page does not claim compliance with any regulation.")).not.toContain(
      "claim compliance",
    );
  });

  it("keeps every reviewed exception justified by text that is actually present", () => {
    // An exception whose justification no longer matches the file is a stale
    // permission, and the pattern behind it is switched off for no reason.
    for (const allowance of ALLOWED) {
      const full = join(process.cwd(), allowance.file.replace(/\//g, "\\"));
      expect(() => readFileSync(full, "utf8")).not.toThrow();
      expect(readFileSync(full, "utf8")).toContain(allowance.contains);
      expect(allowance.reason.length).toBeGreaterThan(20);
    }
  });

  it("bites — a prohibited claim written into a source file fails the scan", () => {
    // Proving the guard bites, so a passing scan means something. If the
    // patterns were too weak to match a blatant example, the scan above would
    // be reporting success for the wrong reason.
    const blatant = "Our platform is COPPA compliant and clinically proven to boost scores.";
    const caught = PROHIBITED.filter(({ pattern }) => pattern.test(blatant));

    expect(caught.length).toBeGreaterThanOrEqual(3);
    expect(caught.map((entry) => entry.label)).toEqual(
      expect.arrayContaining(["compliance status", "clinical efficacy claim", "score claim"]),
    );
  });

  it("lets honest disclaimer wording through the scan as a whole", () => {
    // The other direction: a scan that rejects "this is not an assessment
    // result" would force the honesty out of the copy to keep the build green.
    // Asserted through `scannableText` — the same path the real scan takes —
    // rather than against the raw patterns, because a pattern can only ever be
    // negated afterwards by the stripping step.
    const honest = [
      "These results reflect your performance on Heir of Wisdom's own practice questions. They are not an IQ score, an official assessment result, or a predictor of placement.",
      "There are no real accounts in this build.",
      "Nothing was delivered.",
      "This page does not claim compliance with any regulation.",
    ].join(" ");

    const scannable = scannableText(honest);
    for (const { pattern, label } of PROHIBITED) {
      expect(pattern.test(scannable), `"${label}" must not fire on honest copy`).toBe(false);
    }
  });
});
