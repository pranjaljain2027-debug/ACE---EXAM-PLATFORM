/**
 * The landing page's contracts (U4).
 *
 * Everything here reads the real page — the same module Next renders at `/` —
 * so a change to the copy or the section order fails here rather than shipping.
 *
 * The claim scan is the important one. A marketing page is the one place where
 * a promise the product cannot keep looks cheapest to write, so the categories
 * the plan rules out are scanned as patterns rather than as the handful of
 * sentences that happened to appear in the brief: a guarantee, an unevidenced
 * proof claim, a percentage or a user count, a compliance status, a
 * certification, an endorsement or testimonial, a partnership, an "official"
 * claim, and any promise about a child's own result. New copy written in a new
 * sentence shape is still caught.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage, { MARKETING_STYLES, metadata } from "./page";
import AssessmentsPage from "./assessments/page";
import ContactPage from "./contact/page";
import FaqPage from "./faq/page";
import { demoMatrixQuestion } from "@/content/demo/matrix-question";
import { POSITIONING_LINE, assessmentCoverage } from "@/content/marketing/copy";

/* -------------------------------------------------------------------------- */
/* Claim scan                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Categories of claim the product may not make anywhere, each as a pattern.
 * Scoped to words that can only ever be a promise: a page can honestly write
 * "not endorsed by", so the negations are not what is banned here.
 */
const PROHIBITED_CLAIMS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  {
    label: "a guarantee",
    pattern: /\bguarantee\w*\b|\bpromis(e|es|ed)\s+(a\s+)?(score|place|result|pass)\b/,
  },
  {
    label: "an unevidenced proof claim",
    pattern:
      /\b(proven|proves|proving|validated|clinically|evidence-based|research-backed|science-backed|peer-reviewed)\b/,
  },
  {
    label: "a percentage or an outcome statistic",
    pattern: /\d\s*(%|percent\b|per\s+cent\b)|\bpercent(age)?\b/,
  },
  {
    label: "a user count",
    pattern:
      /\b\d[\d,.]*\s*(children|kids|famil\w+|students|learners|parents|schools|districts|users|members)\b/,
  },
  {
    label: "a compliance status",
    pattern: /\b(coppa|ferpa|gdpr|ccpa|hipaa|iso\s?27001|soc\s?2)\b/,
  },
  {
    label: "a certification",
    pattern: /\b(compliant|compliance|certif\w+|accredited|audited)\b/,
  },
  {
    label: "an endorsement or a testimonial",
    pattern:
      /\b(endors\w+|testimonial\w*|reviews?|rated|recommended by|trusted by)\b|\b\d(\.\d)?\s*stars?\b|★/,
  },
  {
    label: "a partnership or an affiliation",
    pattern:
      /\b(partners?|partnership|partnered|affiliat\w+|collaborat\w+|in association with|in partnership)\b/,
  },
  { label: "an official claim", pattern: /\bofficial\w*\b/ },
  {
    label: "a promise about a child's own result",
    pattern:
      /\b(scores?|scoring|placements?|admissions?|gifted|improve\w*|boost\w*|raises? (his|her|their|the))\b/,
  },
];

/** Every page whose copy ships publicly. */
const PUBLIC_PAGES: readonly { readonly path: string; readonly Page: () => React.ReactElement }[] = [
  { path: "/", Page: LandingPage },
  { path: "/assessments", Page: AssessmentsPage },
  { path: "/faq", Page: FaqPage },
  { path: "/contact", Page: ContactPage },
];

function renderText(Page: () => React.ReactElement): string {
  const { container, unmount } = render(<Page />);
  const text = (container.textContent ?? "").toLowerCase();
  unmount();
  return text;
}

/* -------------------------------------------------------------------------- */
/* Page structure                                                              */
/* -------------------------------------------------------------------------- */

/** The order the landing page is required to read in. */
const SECTION_ORDER = [
  "Try this one yourself",
  "What your child practises",
  "How it works",
  "These tests ask how your child reasons",
  "What a parent sees",
  "What we can tell you",
  "Questions",
  "Start with one question.",
] as const;

describe("the landing page", () => {
  it("ships a title and a description of its own", () => {
    expect(typeof metadata.title).toBe("string");
    expect(String(metadata.title).trim()).not.toBe("");
    expect(typeof metadata.description).toBe("string");
    expect(String(metadata.description).trim()).not.toBe("");
  });

  it("renders exactly one H1, and it is the positioning line (R1)", () => {
    const { container } = render(<LandingPage />);
    const headings = container.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent?.trim()).toBe(POSITIONING_LINE);
  });

  it("reads in the order the page was designed around, with the demo second", () => {
    const { container } = render(<LandingPage />);
    const sectionHeadings = [...container.querySelectorAll("h2")].map(
      (heading) => heading.textContent?.trim() ?? "",
    );

    expect(sectionHeadings).toEqual(SECTION_ORDER);
  });

  it("adds no second main region to the shell's own (R33)", () => {
    const { container } = render(<LandingPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("renders the anchor the shell header and footer both link to", () => {
    render(<LandingPage />);

    // `/#how-it-works` is linked from Header.tsx and Footer.tsx. A missing
    // target is a dead link on every page of the site.
    expect(document.querySelector("#how-it-works")).not.toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* The demo — the page's dominant visual                                        */
/* -------------------------------------------------------------------------- */

describe("the landing page's reasoning demo", () => {
  it("mounts the real player on the real demo question", () => {
    render(<LandingPage />);

    const player = screen.getByRole("region", { name: demoMatrixQuestion.prompt });
    expect(player).toBeInTheDocument();
    expect(within(player).getAllByRole("radio")).toHaveLength(
      demoMatrixQuestion.choices.length,
    );
  });

  it("takes the first visitor to an answer they can read the reasoning for", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole("radio", { name: "an outlined arrow pointing up" }));
    await user.click(screen.getByRole("button", { name: "See the answer" }));

    expect(screen.getByRole("region", { name: /^Step 1 of/ })).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/* Assessment coverage                                                         */
/* -------------------------------------------------------------------------- */

describe("assessment coverage", () => {
  it("names CogAT, OLSAT and NNAT with their sub-areas (R9, R3)", () => {
    render(<LandingPage />);

    for (const assessment of assessmentCoverage) {
      const section = screen.getByRole("region", { name: assessment.name });
      for (const area of assessment.areas) {
        expect(within(section).getByText(area.label, { exact: true })).toBeInTheDocument();
      }
    }
  });

  it("describes a real reasoning area for every sub-area it claims", () => {
    for (const assessment of assessmentCoverage) {
      for (const area of assessment.areas) {
        expect(area.category.length).toBeGreaterThan(0);
        expect(area.detail.length).toBeGreaterThan(20);
      }
    }
  });

  it("says nothing about who makes the assessments", () => {
    const text = renderText(LandingPage);

    for (const pattern of [
      /\b(official\w*|endors\w+|partner\w*|affiliat\w+|accredit\w+|licens\w+)\b/,
      /\b(cognit\w*|pearson|gifted|rt\b|nagl|woodcock|mccar\w+)\b/,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Claims, pricing, and the parent view                                         */
/* -------------------------------------------------------------------------- */

describe("public marketing copy", () => {
  it("makes no claim the product has not earned (R2, R3, R12)", () => {
    for (const { path, Page } of PUBLIC_PAGES) {
      const text = renderText(Page);

      // Guard the guard: an empty scan would pass vacuously.
      expect(text.length, `${path} rendered no copy to scan`).toBeGreaterThan(200);

      for (const { label, pattern } of PROHIBITED_CLAIMS) {
        expect(text, `${path} makes ${label}`).not.toMatch(pattern);
      }
    }
  });

  it("ships no testimonial block, in any shape", () => {
    const { container } = render(<LandingPage />);

    expect(container.querySelectorAll("blockquote")).toHaveLength(0);
    expect(container.querySelectorAll("cite")).toHaveLength(0);
    expect(container.querySelectorAll("[data-testimonial]")).toHaveLength(0);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("says nothing about what things cost (R11)", () => {
    const text = renderText(LandingPage);

    expect(text).not.toContain("pricing");
    expect(text).not.toContain("plans");
    expect(text).not.toMatch(/\bplan\b/);
    expect(text).not.toMatch(/\b(subscription|per month|\$\d)\b/);
  });

  it("describes the parent view instead of drawing invented numbers in it (R10)", () => {
    render(<LandingPage />);
    const parentSection = screen.getByRole("region", { name: "What a parent sees" });

    expect(within(parentSection).queryAllByRole("img")).toHaveLength(0);
    expect(parentSection).toHaveTextContent(/practice activity/i);
    expect(parentSection).toHaveTextContent(/reasoning area/i);
    expect(parentSection).toHaveTextContent(/enough sessions/i);
    expect(parentSection).toHaveTextContent(/no chart/i);
  });
});

/* -------------------------------------------------------------------------- */
/* The FAQ                                                                     */
/* -------------------------------------------------------------------------- */

describe("the FAQ", () => {
  it("answers every question the page is required to answer", () => {
    render(<LandingPage />);

    for (const question of [
      /difference between CogAT, OLSAT and NNAT/i,
      /What ages is this for/i,
      /test prep or a game/i,
      /How do visual explanations work/i,
      /What can parents see about progress/i,
      /How is my child.s information handled/i,
    ]) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    }
  });

  it("sends the information-handling question to the privacy page (R2)", async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(
      screen.getByRole("button", { name: /How is my child.s information handled/i }),
    );

    const panel = screen.getByRole("region", {
      name: /How is my child.s information handled/i,
    });
    expect(within(panel).getByRole("link", { name: /privacy page/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(panel.textContent ?? "").not.toMatch(
      /\b(coppa|ferpa|gdpr|compliant|encrypted|anonymously)\b/i,
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Narrow viewports (R34)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * jsdom has no layout engine, so `scrollWidth` cannot be read. What can be
 * checked, and is what actually causes sideways scroll, is the pair of things
 * that force it: a box pinned wider than the 320px floor, and text that is
 * forbidden from wrapping. Both the page's own stylesheet and the inline styles
 * it renders are checked.
 */
const MARKETING_CSS = MARKETING_STYLES.replace(/\/\*[\s\S]*?\*\//g, "");

function toPixels(value: string, unit: string): number {
  return unit === "rem" ? Number.parseFloat(value) * 16 : Number.parseFloat(value);
}

function overflowingBoxes(css: string): number[] {
  const declarations = [
    ...css.matchAll(/(?:^|[;{])\s*min?-width:\s*(\d+(?:\.\d+)?)(rem|px)/g),
    ...css.matchAll(/grid-template-columns:\s*([^;}]+)/g),
  ];

  const widths: number[] = [];
  for (const declaration of declarations) {
    if (declaration[1] !== undefined) {
      widths.push(toPixels(declaration[1], declaration[2] ?? "px"));
      continue;
    }
    for (const track of [...(declaration[3] ?? "").matchAll(/(\d+(?:\.\d+)?)(rem|px)/g)]) {
      widths.push(toPixels(track[1] ?? "0", track[2] ?? "px"));
    }
  }
  return widths.filter((width) => width >= 320);
}

describe("narrow viewports", () => {
  it("pins no box at or beyond the 320px floor", () => {
    // Guard the guard: an empty scan would pass vacuously.
    expect(MARKETING_CSS.length).toBeGreaterThan(500);

    expect(overflowingBoxes(MARKETING_CSS)).toEqual([]);
  });

  it("never forbids a line from wrapping", () => {
    expect(MARKETING_CSS).not.toMatch(/white-space:\s*nowrap/);
  });

  it("lets every grid track shrink below its content", () => {
    const tracks = [...MARKETING_CSS.matchAll(/grid-template-columns:\s*([^;}]+)/g)].map(
      (match) => match[1] ?? "",
    );

    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) {
      // `1fr` is `minmax(auto, 1fr)`, whose minimum is the widest unbreakable
      // word. Only `minmax(0, ...)` opts out of that.
      if (track.includes("1fr")) {
        expect(track).toMatch(/minmax\(0,\s*1fr\)/);
      }
    }
  });

  it("renders no inline style wider than the viewport", () => {
    const { container } = render(<LandingPage />);
    const inlineWidths = [...container.querySelectorAll<HTMLElement>("[style]")]
      .flatMap((element) => [element.style.width, element.style.minWidth])
      .filter((value): value is string => value !== "" && /^\d+(\.\d+)?(px|rem)$/.test(value))
      .map((value) => toPixels(value.replace(/[a-z]+$/, ""), value.endsWith("rem") ? "rem" : "px"));

    expect(inlineWidths.filter((width) => width >= 320)).toEqual([]);
  });
});
