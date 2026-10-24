# Brand Design — Heir of Wisdom

**Source:** `.agents/product-marketing.md` (v2, 2026-10-22) + `growth/strategy.md` + CHAT_EXPORT.md + HEIR_OF_WISDOM_MASTER_BUILD_PROMPT.md
**Status:** Draft for approval. No visuals produced yet.
**Unknown values:** Marked `[PENDING]`

---

## ICP
**Narrow ICP (from growth/strategy.md):**
Parents of 8–10 year olds who already pay for cognitive enrichment (workbooks, Kumon, tutoring, or brain-training apps) but are frustrated that their child aces school worksheets yet freezes on novel, non-routine problems.

- **Age of child:** 8–10 (narrowed from stated 5–13 band; [Guess])
- **Current behavior:** Spends $50–$200/month on enrichment; has tried at least one app or workbook series
- **Trigger event:** Teacher comment, test result, or parent noticing child can't transfer a learned pattern to a new format
- **Emotional state:** Proud of raw ability, anxious that school smarts won't equal real thinking, skeptical of another "genius" app
- **Desired outcome (their words):** "I want to see my kid actually figure something out on their own, not just memorize answers."
- **Alternatives considered:** More worksheets, more tutoring hours, another subscription app

---

## Promise
**Primary promise:** Your child will learn to discover spatial and logical rules through hands-on manipulation—not memorize drill answers—and you'll see their progress on a dashboard.

**Supporting promises (permitted, see below):**
- No negative marking; mistakes are experiments
- Five-stage journey: Observe → Experiment → Discover → Apply → Transfer
- Far-transfer challenges prove conceptual mastery, not pattern memorization
- Parent dashboard shows hint dependency, accuracy, and transfer strength over time
- "Wisdom is inherited. Thinking is discovered."
- "Teach your child to see what others miss."

---

## Permitted Claims with Sources

| Claim | Permitted? | Source |
|-------|------------|--------|
| "Wisdom is inherited. Thinking is discovered." | ✅ Yes | Brand philosophy (CHAT_EXPORT.md §2) |
| "Teach your child to see what others miss." | ✅ Yes | Hero headline (CHAT_EXPORT.md §6) |
| "One question. Multiple ways of seeing." | ✅ Yes | Experience idea / Philosophy headline (CHAT_EXPORT.md §2, §6) |
| "Don't just tell them they're right. Show them why." | ✅ Yes | Difference proposition (CHAT_EXPORT.md §2, §6) |
| "The answer is only the beginning." | ✅ Yes | Closing phrase (CHAT_EXPORT.md §2, §6) |
| "COGNITIVE LEARNING · REIMAGINED" | ✅ Yes | Hero eyebrow (CHAT_EXPORT.md §6) |
| "No negative marking" | ✅ Yes | Landing page copy; wrong-answer actions: Try again / See a hint / Explore why (CHAT_EXPORT.md §3, §7) |
| "Five stages: Observe → Experiment → Discover → Apply → Transfer" | ✅ Yes | Reasoning loop (CHAT_EXPORT.md §3, §7) |
| "Parent dashboard shows development over time" | ✅ Yes | Founder-stated product feature; Parent Dashboard routing in App.tsx |
| "CogAT / OLSAT / NNAT practice areas covered" | ⚠️ Qualified | Verbal, Quantitative, Nonverbal coverage stated; never imply official affiliation (CHAT_EXPORT.md §3, §7) |
| "Guaranteed improvement in X weeks" | ❌ No | Violates evidence guardrails; Q2 ("How long?") is unanswered |
| "Makes your child a genius" | ❌ No | Explicitly forbidden word |
| "IQ boost" | ❌ No | Explicitly forbidden |
| "Research-backed" | ❌ No | Avoid until substantiated (CHAT_EXPORT.md §6) |
| "Official affiliation with CogAT/OLSAT/NNAT" | ❌ No | Never imply (CHAT_EXPORT.md §3) |

---

## Voice

| Attribute | Means | Doesn't mean | Example line |
|-----------|-------|--------------|--------------|
| Calm | Quiet confidence, whitespace, unhurried | Boring, passive | "There are no mistakes here—only experiments." |
| Premium / editorial | Deliberate structure, serif headings, minimalist | Cold, corporate, sterile | "Wisdom is inherited. Thinking is discovered." |
| Visionary | Aspirational, rigorous, process-oriented | Status-signaling, fear-driven | "The answer is only the beginning." |
| Evidence-first | Claims backed by demo, dashboard, stage milestones | Hype, exclamation points | "Children test hypotheses directly on the canvas without negative marking." |
| Restrained playfulness | Warm, spatial, dimensional, exploratory | Childish clip art, cartoonish, neon | "A place where questions become worlds." |

**Tone by context:**
- Support: Patient, clear, no jargon
- Launch: Confident, editorial, restrained
- Errors: Gentle, no negative marking, invites retry
- Sales: Direct, answers "Will this help for real?" first
- Social: Educational, quiet confidence, puzzle-of-the-day format

**Terms we own:** The Five Stages of Spatial Discovery, Spatial Reasoning Canvas, Rule Articulation, Far-Transfer Test, Reasoning Lenses (Rotation, Symmetry, Colour, Position), One question. Multiple ways of seeing., The answer is only the beginning.
**Never use:** Genius, IQ boost, drill, gamify, guaranteed, fast, easy, hack, research-backed (unsubstantiated), official affiliation (untrue)

---

## CTA

**Primary CTA:** "Explore the Experience"
**Secondary CTA:** "See a Sample Question"
**Onboarding CTA:** "Let's begin" / "Create their journey" / "Meet the studio"
**Meeting CTA:** "Continue" / "Continue Exploring"

**Placement rules:**
- Hero section: Primary CTA (dark navy #0E2235 button, white text)
- Hero secondary: Outlined CTA (navy text on white)
- Landing page final: Primary CTA
- Onboarding step 1: "Let's begin"
- Completion: "Meet the studio"
- All CTAs must include an arrow icon (→) and answer "what happens next" in 4 words or fewer

---

## Palette

| Token | Hex | Intended use |
|-------|-----|--------------|
| Sand | `#E6DCCE` | Primary background and warm surfaces |
| Navy | `#0E2235` | Primary text, navigation, structure, primary buttons |
| Forest | `#1F4A34` | Deep panels and meaningful states (established/recognition) |
| Ochre | `#B57424` | Dimensional highlights, geometric emphasis |
| Terracotta | `#B84E26` | Secondary object details, transformation cues |
| White | `#FFFFFF` | Cards, modal backgrounds, inverse button text |

**Gradient:** `#0E2235/90 → #0E2235/35 → transparent` for hero image overlays
**Hierarchy:** UI should primarily read as Sand + Navy. Do not give all five colors equal weight. Other colors primarily belong inside learning visuals.
**Avoid:** Neon, purple/blue AI gradients, rainbow edtech palettes, equal weighting of all five colors

---

## Type

| Role | Font | Weight / Size | Usage |
|------|------|---------------|-------|
| Display / editorial | Cormorant Garamond (Georgia fallback) | 4xl–6xl, font-bold, serif | Hero H1, section H2, philosophical statements |
| Body / UI | Inter (Arial fallback) | base–lg, font-sans | Paragraphs, UI labels, buttons, navigation |
| Mono / technical | JetBrains Mono (monospace fallback) | text-xs–sm, font-mono | Stage labels, "Stage 01 · 2 Minutes", code-like data |

**Line heights:** Headings leading-[1.15], body leading-relaxed
**Letter spacing:** Uppercase eyebrow labels tracking-wider
**Small labels:** Small uppercase eyebrow labels with restrained tracking

---

## Logo

**Description:** "Heir of Wisdom" wordmark only in a rectangular border (serif, font-bold, dark navy #0E2235), as seen in top-left of shared screenshots.
**Symbol rule:** No generic symbol, brain, graduation cap, lightbulb, book, or AI mark. Wordmark is only "Heir of Wisdom."
**Clear space:** [PENDING — no brand guidelines file found]
**Minimum size:** [PENDING]
**Variants:** [PENDING — dark on light confirmed; light-on-dark not yet specified]
**Usage:** Top-left of header on all public pages; studio header reads "Heir of Wisdom · Studio"

---

## Layout

**Grid:** Max-w-1280px, mx-auto, px-6 (sm:p-8 on cards)
**Text max:** 680px (--text-max)
**Spacing system:** --section-space-desktop: clamp(96px, 10vw, 180px); --section-space-mobile: 72px
**Card style:** bg-white, border border-[#E8E6E1], rounded-2xl, p-6 sm:p-8, shadow-xs
**Border radii:** --radius-small: 8px; --radius-medium: 14px; --radius-large: 24px
**Hero layout:** Two-column grid on desktop (copy left, visual right), stacked on mobile
**Visual rules:**
- Generous whitespace; no cluttered above-the-fold
- One primary visual per screen (canvas teaser, architectural photo, or diagram)
- Serif headings for editorial weight; sans for utility
- Mono for labels, data, stage tags
- Visual mix: approximately 80% 3D/UI and 20% photography
- Warm architectural setting: mansion/home/library, arches, landscape, daylight, natural materials, books, wood, fireplace
- Sand/ivory surfaces, deep navy controls, refined serif headlines, clean sans-serif UI, warm rounded panels, tactile 3D objects, soft daylight, soft shadows, precise highlights

---

## 1080 × 1350 Post / Carousel Rules

**Format:** 4:5 aspect ratio portrait (Instagram/Facebook/LinkedIn feed)

**Slide 1 (Cover):**
- Background: Sand #E6DCCE
- Center: "Heir of Wisdom" wordmark (dark navy)
- Headline (Cormorant Garamond, 64pt+): "Wisdom is inherited. Thinking is discovered."
- Subhead (Inter, 24pt): "Teach your child to see what others miss."
- Bottom: CTA pill — "Explore the Experience →"

**Slide 2 (Problem):**
- Left: Parent question — "Will this help my child for real?"
- Right: Small canvas crop (arrow rotating on dotted circle)
- Caption (18pt): "Most apps mark wrong answers red. We let kids test hypotheses."

**Slide 3 (Solution):**
- Full-bleed image: Shape rotating inside dashed circle on interactive canvas
- Overlay badge (ochre #B57424): "Stage 1 → Stage 2: Observe → Experiment"
- Caption: "Physical manipulation, not memorization."

**Slide 4 (Proof):**
- Split: Parent dashboard mockup left; child focused right
- Caption: "See hint dependency, accuracy, and transfer strength over time."

**Slide 5 (CTA):**
- Background: Navy #0E2235
- White text: "Start your child's free reasoning session."
- Button: Sand pill with navy text — "Explore the Experience →"

**Carousel rules:**
- Max 5 slides
- Each slide includes brand mark in a corner
- Max 2 type sizes per slide
- CTA only on final slide

---

## 1080 × 1920 Reel Rules

**Format:** 9:16 vertical video (TikTok / Reels / Shorts)

**Length:** 15–30 seconds max

**Structure:**
1. **0–3s (Hook):** Close-up of shape rotating on canvas. Text: "Your kid aces worksheets. Can they solve a new shape?"
2. **3–10s (Demo):** Fast cuts of Observe → Experiment → Discover stages. Voiceover (calm, editorial): "No memorization. No red marks. Just physical reasoning."
3. **10–20s (Parent view):** Parent dashboard scrolling. Text: "You see the growth. They see the discovery."
4. **20–28s (CTA):** Logo + "Explore the Experience" + arrow icon. Background: navy #0E2235.

**Design rules:**
- Safe zones: Keep text and CTAs within center 60%
- Captions: Inter, white with navy shadow, 32pt+, bottom-center
- Brand mark: Small "Heir of Wisdom" wordmark in top-left, persistent
- End card: 3-second hold on navy screen with white CTA button
- Audio: Low-fi ambient or none; no loud gamified sounds

---

## Approval Required

Before I produce any visuals (social posts, carousels, reels, ad assets), please confirm:

1. **Product marketing context** (`growth/strategy.md`, `.agents/product-marketing.md` v2) — are the ICP, promise, voice, and permitted claims correct?
2. **Brand design specs** (this file) — are the corrected palette (Ochre #B57424, Forest #1F4A34, Terracotta #B84E26), typography (Cormorant Garamond + Inter), and layout rules acceptable?
3. **Missing assets I need before visuals:**
   - Logo file (SVG/PNG) — [CONFIRMED — dark navy serif wordmark on cream/sand background, provided by user]
   - Parent dashboard screenshots — [CONFIRMED — "Maya's Spatial Reasoning Progress" dashboard screenshot provided, showing Sessions Completed (0), Total Studio Focus Time (25 mins), Independent Far-Transfer (0%), Zero-Hint Autonomy (0%), Curriculum Domain Mastery modules]
   - Child-on-canvas video/GIF — [PENDING]
   - Exact conversion metrics / current signup numbers — [CONFIRMED — 1,000 paid signups target in next 30 days]

Reply with approval or corrections, and I'll produce the visual assets next.
