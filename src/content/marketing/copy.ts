/**
 * The words the public pages make (U4, R1, R2, R3, R9, R10).
 *
 * Copy is data and lives here rather than inside the section components. That
 * keeps the components doing layout only, and it means every sentence the
 * product says to a parent, a child, or a search engine is in one file — the
 * single place a claim scan reads.
 *
 * Two rules govern what may be written below.
 *
 *   Naming an assessment is allowed and necessary: the whole point is to say
 *   what kind of reasoning to practise. Implying any connection to the people
 *   who publish those assessments is not, so no section here says so.
 *
 *   Nothing here may promise an outcome. No guarantee, no improvement figure, no
 *   user count, no school or district, no compliance status, no testimonial,
 *   and nothing about what a child's own result will be (R2, R3, R12).
 */
import type { ReasoningCategory } from "@/content/questions/types";

/** The positioning line. The landing page's H1 and nothing else's (R1). */
export const POSITIONING_LINE = "See why, not just what.";

/** A link that appears in the marketing copy. */
export interface MarketingAction {
  readonly label: string;
  readonly href: string;
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export const heroCopy = {
  lede: "Help your child practise reasoning for CogAT, OLSAT and NNAT, with visual explanations that make the pattern behind each answer easier to understand.",
  primaryAction: { label: "Start free diagnostic", href: "/sign-up" } as MarketingAction,
  secondaryAction: { label: "See how it works", href: "#how-it-works" } as MarketingAction,
} as const;

/* -------------------------------------------------------------------------- */
/* The demo — section two, and the page's dominant visual                       */
/* -------------------------------------------------------------------------- */

export const reasoningDemoCopy = {
  heading: "Try this one yourself",
  lede: "This is the real thing, not a picture of it. Choose an arrow, then step through why it is the answer.",
} as const;

/* -------------------------------------------------------------------------- */
/* Assessment coverage                                                         */
/* -------------------------------------------------------------------------- */

/**
 * What each reasoning area actually asks. One entry per area rather than one
 * per assessment, so the wording cannot drift between the two assessments that
 * share an area.
 */
export const REASONING_AREA_NOTES: Record<ReasoningCategory, string> = {
  verbal: "Words: which one belongs with the others, and which word completes a pair.",
  quantitative: "Number patterns: working out what comes next in a sequence.",
  nonverbal: "Figures: what belongs in the empty square, what completes a pair, and which picture does not fit.",
};

export interface CoverageArea {
  /** The sub-area as the assessment names it. */
  readonly label: string;
  /**
   * The reasoning area behind it. Every value here must be one the shipped
   * corpus actually holds questions for — `copy.test.ts` checks that against
   * `questions`, so a coverage claim cannot outrun the content (R9).
   */
  readonly category: ReasoningCategory;
  /** Always `REASONING_AREA_NOTES[category]`; read it rather than repeating it. */
  readonly detail: string;
}

export interface AssessmentCoverageEntry {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly areas: readonly CoverageArea[];
}

function area(label: string, category: ReasoningCategory): CoverageArea {
  return { label, category, detail: REASONING_AREA_NOTES[category] };
}

export const assessmentCoverage: readonly AssessmentCoverageEntry[] = [
  {
    id: "cogat",
    name: "CogAT",
    summary: "A general aptitude assessment. The practice has questions in each of its three areas.",
    areas: [area("Verbal", "verbal"), area("Quantitative", "quantitative"), area("Nonverbal", "nonverbal")],
  },
  {
    id: "olsat",
    name: "OLSAT",
    summary: "A verbal and nonverbal reasoning assessment. The practice has questions in both.",
    areas: [area("Verbal", "verbal"), area("Nonverbal", "nonverbal")],
  },
  {
    id: "nnat",
    name: "NNAT",
    summary:
      "A nonverbal reasoning assessment for younger children. The practice's figure questions are the ones that cover this area.",
    areas: [area("Nonverbal", "nonverbal")],
  },
];

export const assessmentCoverageCopy = {
  heading: "What your child practises",
  lede: "Three assessments, named so you know which kind of reasoning is being practised.",
  note: "The names appear here only to describe the kind of reasoning to practise.",
  link: { label: "More on what each area covers", href: "/assessments" } as MarketingAction,
} as const;

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */

export interface HowItWorksStep {
  readonly name: string;
  readonly detail: string;
}

export const howItWorksCopy = {
  heading: "How it works",
  lede: "Three steps, repeated rather than rushed.",
  steps: [
    {
      name: "Diagnose",
      detail:
        "A short set of questions shows which reasoning areas already feel familiar and which do not.",
    },
    {
      name: "Practise",
      detail:
        "Your child answers a question, sees whether it was right, and then walks through the reasoning behind it.",
    },
    {
      name: "Track",
      detail:
        "Sessions build up over time. Once there are enough of them to compare, a parent view shows how each reasoning area has moved.",
    },
  ] satisfies readonly HowItWorksStep[],
} as const;

/* -------------------------------------------------------------------------- */
/* Differentiation                                                             */
/* -------------------------------------------------------------------------- */

export const differentiationCopy = {
  heading: "These tests ask how your child reasons",
  lede: "A child can know every answer in a textbook and still miss the pattern a figure puzzle is built on.",
  /** How a question usually gets used. The shape of the flow, not a rival. */
  typical: {
    label: "The usual shape of practice",
    steps: ["Question", "Right or wrong", "Move on"],
  },
  /** What happens here instead. */
  here: {
    label: "What happens here",
    steps: ["Question", "Answer", "The pattern, drawn on the board", "The rule, in words"],
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Parent value                                                                */
/* -------------------------------------------------------------------------- */

export interface ParentViewItem {
  readonly term: string;
  readonly detail: string;
}

export const parentValueCopy = {
  heading: "What a parent sees",
  lede: "Five things, all drawn from your child's own answers.",
  items: [
    { term: "Practice activity", detail: "What was worked on, and when." },
    {
      term: "Performance by reasoning area",
      detail: "Nonverbal, verbal and quantitative kept apart rather than merged into one number.",
    },
    { term: "Relative strengths", detail: "Where your child is strongest across the areas." },
    { term: "Where more practice would help", detail: "The areas with the most room to move." },
    {
      term: "Change over time",
      detail: "A comparison across sessions, once there are enough sessions to compare.",
    },
  ] satisfies readonly ParentViewItem[],
  note: "There is no chart on this page. Every number in the parent view comes from answers your child gave; showing invented ones would not be worth the space it saves.",
} as const;

/* -------------------------------------------------------------------------- */
/* Trust                                                                       */
/* -------------------------------------------------------------------------- */

export const trustCopy = {
  heading: "What we can tell you",
  lede: "Facts about how the practice works, and nothing about how well it will go.",
  points: [
    {
      term: "The explanations are written, not generated",
      detail:
        "Each one is authored against a specific question, and it names the rule that makes the answer right rather than describing it in general terms.",
    },
    {
      term: "The question above is the real component",
      detail:
        "The same player a practice session uses, running on a real question. Nothing on this page is a screenshot or a mock-up.",
    },
    {
      term: "Progress comes from real answers",
      detail:
        "Every figure in the parent view comes from something your child actually chose. Nothing here predicts a result on a test.",
    },
  ] satisfies readonly ParentViewItem[],
  links: [
    { label: "Read the privacy page", href: "/privacy" },
    { label: "Contact and support", href: "/contact" },
  ] as readonly MarketingAction[],
} as const;

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
  /** Rendered after the answer, for anything a page elsewhere actually covers. */
  readonly link?: MarketingAction;
}

export const faqCopy = {
  heading: "Questions",
  lede: "Short answers, including the ones that are less flattering.",
  entries: [
    {
      question: "What is the difference between CogAT, OLSAT and NNAT?",
      answer:
        "They are three separate assessments, written for different ages and drawing on different mixes of reasoning. CogAT covers verbal, quantitative and nonverbal reasoning. OLSAT covers verbal and nonverbal. NNAT is nonverbal throughout. Naming them here is only to say which kind of practice you are looking at.",
    },
    {
      question: "What ages is this for?",
      answer:
        "The practice is organised by reasoning area — nonverbal, verbal and quantitative — rather than by age, because those are the areas the three assessments share. If you are not sure which one your child sits, the school or tester that administers it will know.",
    },
    {
      question: "Is this test prep or a game?",
      answer:
        "Practice, not a game. Nothing is collected for finishing a question. The point is the reasoning behind the answer, so your child can work the next one without being shown the pattern again.",
    },
    {
      question: "How do visual explanations work?",
      answer:
        "Once an answer is chosen, the board highlights the squares that matter, turns one figure so the change is visible, and then states the rule in words. The steps can be taken forwards and backwards, and the whole walkthrough can be replayed.",
    },
    {
      question: "What can parents see about progress?",
      answer:
        "Practice activity, performance in each reasoning area, relative strengths, where more practice would help, and change over time once there are enough sessions to compare. Those views live behind the account. This page deliberately shows no example of one, because an invented one would tell you nothing true.",
    },
    {
      question: "How is my child's information handled?",
      answer:
        "That is answered in full on the privacy page. It is worth reading there rather than taking a summary from a marketing page, which is the wrong place for a serious answer.",
      link: { label: "Read the privacy page", href: "/privacy" },
    },
  ] satisfies readonly FaqEntry[],
} as const;

/* -------------------------------------------------------------------------- */
/* Final call to action                                                        */
/* -------------------------------------------------------------------------- */

export const finalCtaCopy = {
  heading: "Start with one question.",
  lede: "The free diagnostic is a short set of questions. It ends with a picture of which reasoning areas your child finds easy and which need more practice.",
  action: { label: "Start free diagnostic", href: "/sign-up" } as MarketingAction,
} as const;

/* -------------------------------------------------------------------------- */
/* The routes of their own                                                      */
/* -------------------------------------------------------------------------- */

export const assessmentsPageCopy = {
  lede: "What the practice holds questions for, assessment by assessment. A coverage claim is only ever as good as the questions behind it, so each line below names an area the shipped corpus really does hold questions for.",
} as const;

export const faqPageCopy = {
  lede: "What the practice does, how an explanation works, and what it makes no claim about.",
  closing: "Something here not answered?",
  closingLink: { label: "Contact and support", href: "/contact" } as MarketingAction,
} as const;

export const contactPageCopy = {
  lede: "Questions about the practice, about a session, or about something that is not working.",
  faqLine: "What the practice does, how an explanation works and what it does not claim is answered on the FAQ page.",
  faqLink: { label: "Read the FAQ", href: "/faq" } as MarketingAction,
  privacyLine: "What is collected, and what happens to it, is written out on the privacy page.",
  privacyLink: { label: "Read the privacy page", href: "/privacy" } as MarketingAction,
  formNote:
    "A form for everything else is not live yet. This page does not receive messages today, so nothing sent here would go anywhere.",
} as const;
