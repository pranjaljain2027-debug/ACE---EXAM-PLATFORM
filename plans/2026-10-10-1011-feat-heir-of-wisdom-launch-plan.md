---
title: Heir of Wisdom Launch - Plan
type: feat
date: 2026-10-10
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

## Goal Capsule

**Objective:** A parent can sign up, profile their child, run a diagnostic, and watch their child answer visual reasoning questions that explain *why* each answer is correct — with the parent seeing real progress afterward.

**Means:** Next.js (App Router) + TypeScript, a repository/service abstraction over a swappable data adapter, authored structured explanation steps (no LLM in the critical path), and an SVG-based visual reasoning renderer. (KTD1, KTD2, KTD3)

**Authority hierarchy:** Heir of Wisdom specification §17 ("reasoning made visible") > §16 open-decisions register > this plan. Where the spec says OPEN DECISION, this plan picks the reversible option and labels it.

**Stop conditions:** Stop and ask the product owner when ambiguity touches legal risk, child data handling, payment, or irreversible architecture. Everything else: pick the simplest reversible implementation, label the assumption, keep moving.

---

## Product Contract

### Problem Frame

Gifted-program and private-school screening (CogAT, OLSAT, NNAT) measures reasoning, not recalled facts. The prep market splits into static question banks that grade a child right/wrong with no reasoning, and one-to-one tutoring priced out of reach for most families. A child who answers 6 of 8 correctly and cannot say *why* has not learned anything transferable, and a parent paying for volume practice is buying the wrong thing.

The gap is instruction: nothing in the mainstream prep market makes the reasoning rule visible. Heir of Wisdom's product bet is that showing the transformation — the row that rotates, the analogy that inverts — is what converts practice into skill.

### Requirements

#### Product positioning and honesty

- **R1.** The product presents one primary positioning line consistently: "See why, not just what." Supporting lines rotate by section and are never stacked.
- **R2.** No fabricated business facts appear anywhere in user-facing copy: no testimonials, outcome statistics, success rates, partnerships, endorsements, guarantees, or user counts.
- **R3.** Assessment names (CogAT, OLSAT, NNAT) appear only to describe what the product helps practise. Copy must not imply affiliation with, or endorsement by, the test publishers.
- **R4.** No claim of legal or privacy compliance status (COPPA, GDPR, FERPA) appears without written confirmation from a qualified reviewer. Privacy and Terms pages carry approved legal language or explicit placeholders, never invented promises.
- **R5.** Practice results are labeled as performance on Heir of Wisdom's own questions. No result is described as an IQ score, official assessment score, predictor of admission, or gifted placement.

#### Public marketing surface

- **R6.** The landing page answers, in section order: what the product is, how it differs from ordinary test prep, what a visual explanation looks like, which assessment families it covers, and what a parent should do next. The reasoning demonstration is the second section, so a first-time parent meets the product before being asked to care about assessment names.
- **R7.** The hero renders a real, mathematically correct figure-matrix reasoning interaction — a grid with one missing cell, a transformation the visitor can see, and keyboard-operable answer selection. It is the dominant visual on the page. A static, non-motion equivalent is available and is what reduced-motion users get.
- **R8.** The landing page contains a complete, replayable explanation sequence: display matrix → invite answer choice → respectful feedback → highlight the governing row/column → step through the transformation → reveal the answer and state the rule in plain language → offer replay/reset.
- **R9.** Assessment coverage presents CogAT (Verbal, Quantitative, Nonverbal), OLSAT (Verbal, Nonverbal), and NNAT (Nonverbal/visual reasoning) as compact sections. Coverage claims are scoped to the question content that actually exists at launch.
- **R10.** Parent-value content describes what a parent can review: practice activity, performance by reasoning area, relative strengths, areas needing more practice, and change over time once enough session data exists. Any sample data shown publicly is labeled **Example data**.
- **R11.** Pricing is not built at launch. No pricing component, configuration, section, or placeholder ships; absence is achieved by not building the surface, and a test asserts the strings never appear.
- **R12.** Trust content is factual only: the learning approach, a real product example, how progress is represented, and links to privacy and support. A testimonial, endorsement, or outcome-stat component exists in code but renders nothing when unconfigured.
- **R13.** Public routes ship with meaningful titles and descriptions, one H1 each, semantic structure, and social preview metadata. Authenticated child/parent pages are excluded from indexing.

#### Parent account and onboarding

- **R14.** A parent creates an account or signs in through a real auth provider when one is configured. When none is configured, the app runs in a labeled demo mode that is visually and technically distinct and never implies mock authentication secures real data.
- **R15.** Onboarding runs the confirmed sequence as a visible stepper: child's age → current experience → test/learning goal → preferred schedule → interests → begin. Required inputs validate inline; optional interests are skippable and never block progress.
- **R16.** Onboarding preserves answers when navigating Back, saves progress between steps when persistence exists, and allows every answer to be changed later from settings.
- **R17.** The product collects only an age band rather than a birth date, and never a child's full legal name unless a flow genuinely requires it.
- **R18.** Interest selection never collects sensitive personal information and is clearly optional.

#### Diagnostic and practice

- **R19.** A diagnostic samples the supported reasoning categories and scores only the questions actually answered. Its result maps to a transparent initial practice recommendation through explicit deterministic rules that are documented in code, not hidden in a model.
- **R20.** An in-product diagnostic is never described as an official assessment or clinical evaluation.
- **R21.** A practice session shows session progress, the prompt, the visual question area, answer choices, submit/continue, and an exit/pause affordance. It carries no parent analytics, upgrade banners, or marketing copy.
- **R22.** Answer options are selectable by mouse, touch, and keyboard, with a clear selected state. Double submission is prevented.
- **R23.** Submission evaluates against the question's answer key. Feedback is respectful and age-appropriate; no shame copy, punitive red screens, or streak pressure.
- **R24.** Every supported question type has a structured explanation that teaches the rule, authored as typed explanation steps. Explanation steps and the question's data live in one validated model so a question cannot ship with an explanation that contradicts its key.
- **R25.** Motion communicates a transformation, is short and interruptible, respects `prefers-reduced-motion`, and always has a step-by-step static alternative. Correctness is never signaled by color alone.
- **R26.** The results screen shows questions completed, correct answers, reasoning areas practised, one small positive insight, a suggested next action, and a route home. Accuracy from a short sample is never presented as a skill measurement.

#### Parent progress

- **R27.** The parent dashboard answers three questions: what the child practised, what is going well, and what to do next. It includes child profile switching, a continue/start action, recent activity, session summaries, and one recommended next action.
- **R28.** Every chart and percentage derives from actual stored session data, or is explicitly labeled demo data. "Not enough data yet" is visually distinct from "low performance."
- **R29.** One child's data is never exposed to another account, in the UI or in a public URL, and the parent/child boundary is enforced server-side wherever a backend exists.

#### Privacy and safety

- **R30.** Child-related reads and writes are authorized server-side. UI-only gating is not treated as access control.
- **R31.** A parent can review and delete their child's profile data once the backend supports it.
- **R32.** No third-party tracker ships before its privacy impact is reviewed. Session response timing is stored only where needed and disclosed.

#### Accessibility and quality

- **R33.** The app targets WCAG 2.2 AA: semantic landmarks, keyboard access for navigation, answer choices, dialogs, and menus, visible focus, contrast, labeled form errors, `aria-live` announcements for feedback, alt text policy, and reduced-motion support.
- **R34.** Layouts work from 320px up with no horizontal overflow, adequate touch targets, and correct focus order at every breakpoint.
- **R35.** Every listed state — no child profile, no sessions, diagnostic incomplete, missing question data, failed save, auth failure, offline, explanation unavailable, expired session — has a real, designed state. No button appears functional and does nothing.
- **R36.** Before the work is declared done, lint, type-check, unit tests, and the production build all pass, or blockers are documented honestly. Errors are never suppressed to make a check pass.

### Actors

- **A1. Parent (buyer).** Creates the account, completes onboarding, sets up a child profile, reviews progress, decides what happens next. Holds consent authority for the child's records.
- **A2. Child (learner, ~5–13).** Uses the practice session. Selects answers, views visual explanations, continues. Never sees parent analytics, account settings, or marketing surfaces.
- **A3. System (backend services).** Authorizes access, evaluates answers, persists sessions, computes progress. Present only when a backend is configured.

### Key Flows

- **F1. First visit → first understanding.** Parent lands → reads differentiated hero → plays the interactive matrix demo → sees the rule explained → clicks *Start free diagnostic* → signs up or enters demo mode.
- **F2. Parent onboarding → child profile.** Parent authenticates → completes the stepper → skips interests if desired → creates a child profile → receives a deterministic initial learning path.
- **F3. Diagnostic → personalized practice path.** Child runs the diagnostic → each answer is evaluated and explained → scoring maps outcomes to a recommended practice mix → parent reviews the recommendation.
- **F4. Practice session → results → parent progress.** Child selects an answer → sees respectful feedback → steps through the visual explanation → continues → session completes → results screen shows areas practised → parent dashboard updates from stored responses.
- **F5. Demo mode.** With no backend configured, the parent enters labeled demo mode → all flows F2–F4 run against a typed demo data adapter → every surface that would show real data labels it as demo.

### Acceptance Examples

- **AE1. (Covers R7, R8, R25.)** A visitor using only the keyboard tabs to the demo's answer options, selects one with Enter or Space, hears the feedback through an `aria-live` region, steps the transformation with arrow keys, and reaches a replay control — with no animation running at any point.
- **AE2. (Covers R24.)** If a question's `correctChoiceId` does not match the choice its explanation steps reveal, the question fails its content validation check at build time and cannot be seeded.
- **AE3. (Covers R28.)** A brand-new account with zero completed sessions sees a designed empty state reading "No sessions yet," not a chart with zeroed axes and not a fabricated baseline.
- **AE4. (Covers R30.)** Parent A requests Parent B's child's session by direct URL. The server returns a not-found/denied response. The UI shows no data at any point during the attempt.
- **AE5. (Covers R16.)** A parent fills age and experience, advances to goal, presses Back twice, and sees both earlier answers intact and editable.
- **AE6. (Covers R11.)** No pricing component, configuration, or section exists in the source, and no "pricing", "plans", "subscription", "per month", or price-shaped string appears in the built HTML or the sitemap.

### Success Criteria

- Every P0 item in the specification's launch-critical list works end-to-end in the available environment, or is honestly labeled demo/not-configured in the final report.
- A first-time parent reaches a working, replayable explanation demo without scrolling past the first two sections.
- Zero fabricated claims survive review: an automated content scan finds no unapproved testimonial, outcome statistic, partnership, guarantee, or compliance-status string.
- Keyboard-only operation of a full practice session — from landing page to results — completes with no trap and no unreachable control.
- At 320px viewport width, no horizontal overflow and no sub-44px primary touch target.

### Scope Boundaries

**In scope:** the public marketing site with the interactive demo; parent auth (real or labeled demo); onboarding stepper; child profile; diagnostic and practice sessions; visual explanation engine; results; parent dashboard and child progress; privacy/terms/contact surfaces; accessibility and responsive behavior; typed data adapters with a demo source.

**Deferred to later (named, not built):** billing and subscriptions; the full adaptive engine; parent reports and export; assessment families beyond CogAT/OLSAT/NNAT; tutor/school dashboards; leaderboards and social features; advanced 3D visualization; real AI-generated explanations.

**Outside the product's identity:** a generic children's game; extra school homework; a stock question bank; a chat-based tutor; anything that presents practice accuracy as a cognitive score.

### Open Questions

- **Free diagnostic entitlement — LAUNCH BLOCKER, decided 2026-10-10.** The primary CTA ships as "Start free diagnostic" by the product owner's decision, but spec §16 records the entitlement as unverified and no pricing is approved, so "free" is an unbacked commercial claim. It ships anyway and is tracked here rather than solved. Resolve before any public launch: confirm the entitlement, or change the label.
- **Auth provider** — unresolved. Deferred to U1; the plan ships a provider interface and a demo adapter so the choice stays reversible.
- **Database/backend** — unresolved. Deferred to U1. The plan assumes a repository abstraction with an in-memory/file demo source and a documented migration path.
- **AI provider** — unresolved and deliberately out of the critical path. Authored explanation steps ship first (KTD3). An LLM adapter may be added behind the same interface later.
- **Approved legal copy for Privacy/Terms** — unresolved, blocking for launch, not blocking for build. U9 ships placeholders with a review banner.
- **Exact brand color tokens** — unresolved. U2 establishes tokens consistent with the spec's stated direction; they are design decisions, not approved brand standards.

---

## Planning Contract

### Key Technical Decisions

- **KTD1. Next.js App Router + TypeScript as the base stack.** (session-settled: user-directed — chosen over a static-first site or a separate SPA: the product needs server routes for parent/child data authorization (R30), server components keep the landing page light (spec §13), and one codebase avoids duplicating the typed question model across client and server.)
- **KTD2. A repository/service abstraction with a swappable data adapter; no new backend is introduced speculatively.** (session-settled: user-directed — chosen over picking a database up front: the spec forbids speculative infrastructure, and this keeps the migration path to a real backend a single adapter swap while letting the whole app run today.) Implements R5, R27, R28, R29, R30.
- **KTD3. Authored, schema-validated explanation steps are the shipped explanation mechanism; an LLM adapter is a later, optional layer behind the same interface.** (session-settled: user-directed — chosen over LLM-generated explanations: correctness and repeatability are non-negotiable for teaching a reasoning rule (R24, spec §10.4), and a wrong explanation actively harms learning. An unvalidated answer key is worse than no explanation.) Implements R24, R25.
- **KTD4. The visual reasoning renderer is hand-built SVG components, not a 3D or canvas engine.** (session-settled: user-directed — chosen over WebGL/Three.js: figure matrices, analogies, and classification are 2D geometry; SVG gives keyboard-focusable elements, screen-reader labels, crisp responsive scaling, and CSS-driven reduced-motion for free.) Implements R7, R25.
- **KTD5. Question content is a typed, build-time-validated data module.** Every question carries its visual, choices, key, and explanation steps in one object, and a validation check asserts key/explanation agreement (AE2) before content is accepted. Implements R24, R23.
- **KTD6. A documented `DemoDataSource` is the default when no backend is configured, and demo mode is surfaced in the UI, not just in code.** (session-settled: user-directed — chosen over hiding the distinction: the spec's non-negotiable rules forbid implying mock authentication secures real data.) Implements R14, R28.
- **KTD7. Pricing is not built at launch.** No pricing component, config, or section ships; the section is absent rather than unpublished. Superseded 2026-10-10 by the product owner, who chose omission over the earlier config-driven component. A pricing surface is added later, when approved prices and entitlements exist. Implements R11.
- **KTD8. Accessibility is implemented as part of each unit, not as a post-hoc pass.** The reduced-motion static explanation path and `aria-live` feedback ship with the components that need them. Implements R25, R33.

### High-Level Technical Design

**Component topology**

```
Browser
  ├─ Public routes (RSC, static-renderable)      → landing, assessments, faq, privacy, terms, contact
  ├─ Auth routes (client)                        → sign-in, sign-up
  └─ App routes (auth-guarded)
       ├─ /onboarding            → stepper, sessionStorage draft + server persistence
       ├─ /practice, /diagnostic → session start / resume
       ├─ /session/[sessionId]          → question flow + explanation player (the core)
       ├─ /session/[sessionId]/results  → results + next action
       ├─ /parent, /parent/children/[childId]  → progress views
       └─ /settings              → profile + data review/delete

Server (route handlers / server actions)
  ├─ auth adapter            → interface: RealAuthProvider | DemoAuthProvider (KTD1, KTD6)
  ├─ repositories            → interface: UserRepo, ChildProfileRepo, QuestionRepo,
  │                            SessionRepo, ResponseRepo (KTD2)
  ├─ diagnostic scorer       → pure function, deterministic rules, documented (R19)
  ├─ progress calculator     → pure function over stored responses (R28)
  └─ authorization guard     → server-side parent↔child scoping (R30)
```

**Explanation player state machine** (the product's heart — R8, R24, R25)

```
idle ──select──▶ selected ──submit──▶ submitted ──▶ revealed(step 0)
  ▲                 │                     │                │  next/prev
  │                 │ (landing demo       │                ▼
  │                 │  enters submitted   │          steps[n-1]  (rule in plain language)
  │                 │  directly)          │                │ continue/skip
  └───── replay/reset◀────────────────────────────────────────────┘
```

The landing demo skips the explicit submit transition; the session requires it (R22). On entering the explanation, focus moves into the panel's step control, where Left/Right step the explanation only while focus is inside it, and a visible "← → to step" hint sits beside it — the answer group becomes inert so one key never means two things (AE1). A Continue edge is available at every step ("See the answer" on the demo, "Next question" in a session); `explanationViewed` is true only once the final step is reached.

Each state has a static equivalent. `prefers-reduced-motion` forces the static rendering of every step; no code path requires animation to reach understanding.

**Data flow for one answered question**

```
child selects choice
  → client records {questionId, selectedChoiceId, answeredAt}
  → server evaluates against QuestionRepo key (KTD5)
  → QuestionResponse persisted with isCorrect + explanationViewed
  → progress calculator reads responses on demand (no denormalized counters to drift)
```

**Content pipeline**

```
src/content/questions/*.ts  (typed PracticeQuestion objects)
  → validateQuestion()  (asserts key ↔ explanation agreement, unique choice ids,
                                valid highlightIds, non-empty narration)
  → build/test step runs validation over the whole corpus
  → only validated questions reach the session assembler
```

### Assumptions

- No existing application code exists in the target repository; U1 creates the project. If a repository with prior art is supplied later, KTD1 and the file layout in U1 are re-validated before implementation begins.
- The product ships to a US-first audience; Western-market privacy review is assumed pending, and no compliance claim is made (R4).
- Assessment content will be authored in-house. No licensed question bank is assumed available.
- Node 20+ and npm are available. Package manager is npm unless a lockfile says otherwise.

### Sequencing

Units are ordered so each is independently verifiable and nothing blocks on a later decision. U1 is the foundation; U2, U3 and U8 the shared layers; U4–U5 the marketing surface; U6, U7, U9 the account, onboarding, and legal surfaces; U10–U14 the child and parent app; U15–U16 hardening and QA.

The diagram below is generated from the Unit Index's `Depends on` column; where the two ever disagree, the Unit Index is authoritative.

```
U1 foundation
   │
   ├──▶ U2 design system ──┬──▶ U3 site shell ──▶ U9 legal surfaces
   │                       │
   │                       ├──▶ U8 question model + validator
   │                       │          │
   │                       │          └──▶ U5 reasoning demo ──▶ U4 landing page
   │                       │
   └──▶ U6 auth + demo mode ──▶ U7 onboarding
                │
                └──▶ U11 repositories ──▶ U10 session + explanation ──▶ U13 scorers ──▶ U12 results
                                                                   │                          │
                                                                   └──────────▶ U14 parent dashboard ◀─┘
                                                                                 │
                                                                    U15 hardening + U16 QA
```

U9 (legal surfaces) and U15/U16 are cross-cutting and land at their first natural point rather than gating anything upstream.

### System-Wide Impact

- **Child data boundary.** Every repository method takes an owning parent id. This is the single place authorization lives; UI checks are convenience, never control (R30).
- **Explanation correctness.** KTD5's validator is the contract between content authors and the session UI. A question that fails validation is a build failure, not a runtime surprise.
- **Demo vs. production.** One `DataSource` seam decides both. Every surface that renders session-derived data reads its mode from that seam, so demo labeling cannot drift out of sync with the actual data source.

### Risks and Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| Question content authored slowly or incorrectly | Practice engine blocked | Validator (KTD5) fails fast; seed a small vetted corpus first, expand after |
| SVG renderer can't express a needed question type | Visual explanation scope shrinks | Start with matrices, analogies, classification; leave an extension point in the visual schema |
| Backend never gets configured | Demo mode ships to production | Demo mode is labeled and technically distinct; launch checklist blocks on a real auth decision |
| Legal copy unavailable | Privacy/Terms pages ship placeholders | Placeholders carry a visible review banner; launch checklist gates on approval |
| Reduced-motion path drifts from the animated path | Accessibility regression (R25) | Both paths render from the same step data; a test asserts parity of reachable steps |
| No third-party trackers sneak in via dependencies | Privacy (R32) | Dependency audit in U16; analytics stays behind an unconfigured adapter |

---

## Implementation Units

### Unit Index

| U-ID | Title | Key files | Depends on |
|---|---|---|---|
| U1 | Project foundation and stack | `package.json`, `tsconfig.json`, `next.config.ts` | — |
| U2 | Design tokens and primitives | `src/styles/tokens.css`, `src/components/ui/*` | U1 |
| U3 | Site shell: header, footer, routing | `src/app/(public)/layout.tsx`, `src/components/site/*` | U2 |
| U4 | Public marketing pages | `src/app/(public)/page.tsx`, `src/components/marketing/*` | U3, U5 |
| U5 | Interactive reasoning demo | `src/components/reasoning/*`, `src/content/demo/*` | U2, U8 |
| U6 | Auth: provider interface + demo mode | `src/lib/auth/*` | U1 |
| U7 | Parent onboarding stepper | `src/app/onboarding/*` | U3, U6, U11, U13 |
| U8 | Question content model + validator | `src/content/questions/*`, `src/lib/questions/validate.ts` | U1 |
| U9 | Privacy, Terms, Contact surfaces | `src/app/(public)/privacy/`, `terms/`, `contact/` | U3 |
| U10 | Practice session + explanation player | `src/app/session/[sessionId]/*`, `src/components/reasoning/ExplanationPlayer.tsx` | U5, U8, U11 |
| U11 | Repositories and data adapters | `src/lib/data/*` | U1, U6 |
| U12 | Results screen | `src/app/session/[sessionId]/results/*` | U10, U13 |
| U13 | Diagnostic scorer + progress calculators | `src/lib/scoring/*` | U8, U11 |
| U14 | Parent dashboard and child progress | `src/app/parent/*` | U12, U13 |
| U15 | Accessibility and responsive hardening | cross-cutting | U4, U10, U14 |
| U16 | QA, states, and final report | cross-cutting | all |

### U1. Project foundation and stack

**Goal:** A running Next.js + TypeScript application with lint, type-check, test, and production build all wired and green on an empty scaffold.

**Requirements:** R36, and the precondition for every other unit.

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx` (temporary placeholder), `.env.example`.

**Approach:**
- Create the app with npm. Keep the dependency list minimal: `next`, `react`, `react-dom`, TypeScript, Vitest + Testing Library for tests, one styling approach (CSS Modules with design tokens — chosen over Tailwind so the token layer is explicit and the spec's "restrained" palette is enforced in one file, KTD-consistent with U2).
- Configure path alias `@/*` → `src/*`.
- Set up Vitest with a jsdom environment so component tests can run from U2 onward.
- `.env.example` documents every variable the app reads, each marked `required` or `optional`, with a comment stating what breaks without it. No secrets in client code.

**Test scenarios:**
- `npm run build` succeeds on the scaffold with no pages beyond the placeholder.
- `npm run lint` and `npm run typecheck` exit 0.
- `npm test` runs and reports at least one passing test (smoke test for the test harness itself).

**Verification:** `npm ci && npm run lint && npm run typecheck && npm test && npm run build` all pass from a clean checkout.

---

### U2. Design tokens and UI primitives

**Goal:** The "Cognitive Studio" expressed as a restrained token set plus the small set of primitives every later unit builds from.

**Requirements:** R33, R34, and the visual direction of spec §8.

**Files:** `src/styles/tokens.css`, `src/app/globals.css`, `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Checkbox.tsx`, `Stepper.tsx`, `Card.tsx`, `Disclosure.tsx`, `Dialog.tsx`, `Callout.tsx`, `src/components/ui/index.ts`.

**Approach:**
- Tokens per spec §8.3: warm off-white canvas, deep navy/charcoal text, one restrained electric blue-violet accent, quiet neutral borders and surfaces. Define as CSS custom properties in `tokens.css` and treat them as implementation choices, not approved brand standards (Open Questions).
- Typography per spec §8.4: one modern readable sans for product UI, an editorial display face reserved for the landing page. Establish type scale, line height, and responsive sizing.
- Every interactive primitive ships with hover, focus-visible, selected, disabled, loading, success, and error states (R35). Focus indicators are visible and never removed without replacement.
- `Dialog` traps focus, restores it on close, and closes on Escape — the primitive the rest of the app depends on.
- Respect `prefers-reduced-motion` in the shared transition layer, not per-component.

**Test scenarios:**
- Each primitive renders its default and disabled states without console errors.
- `Button` and `Input` are reachable and operable by keyboard; focus-visible styling is applied (assert via computed style or class contract).
- `Dialog` traps Tab within itself, closes on Escape, and returns focus to its trigger.
- Token file defines every custom property consumed by `globals.css` (a test greps for `var(--` usages and fails on an undefined token).

**Verification:** Lint, type-check, unit tests, and build pass. Storybook is explicitly out of scope.

---

### U3. Site shell: header, footer, routing

**Goal:** The persistent frame every page renders inside, plus the public route skeleton.

**Requirements:** R6, R13, R33, R34, R35.

**Files:** `src/app/(public)/layout.tsx`, `src/components/site/Header.tsx`, `Footer.tsx`, `MobileNav.tsx`, `src/app/sitemap.ts`, `src/app/(public)/assessments/page.tsx`, `src/app/(public)/faq/page.tsx`, `src/app/(public)/contact/page.tsx`.

**Approach:**
- Header per spec §4.1: wordmark **Heir of Wisdom**, minimal nav (How it works, Assessments, FAQ), primary CTA **Start free diagnostic**, secondary Sign in, compact accessible mobile menu. Visually quiet — no badge clutter. "How it works" targets the landing page's `#how-it-works` anchor; it is not a separate route.
- Footer per spec §4.11: wordmark, the five content links, Privacy, Terms, copyright year generated dynamically at render (never hardcoded). No social or external links.
- Route group `(public)` separates marketing pages from auth and app pages.
- U3 owns `assessments/page.tsx`, `faq/page.tsx`, and `contact/page.tsx`. U4 and U9 update these existing files; they do not create them.
- `sitemap.ts` lists public routes only, excluding every authenticated and app route, so AE6's sitemap clause has an owner.
- Per-page metadata helper for titles, descriptions, and social preview (R13).
- The CTA routes to the real implemented diagnostic path — never a dead link (R35, spec §4.1).

**Test scenarios:**
- Header renders nav links, the primary CTA, and the sign-in link; mobile menu opens, traps focus, closes on Escape and on route change.
- Footer copyright year matches the current year.
- Every public route returns 200 and renders exactly one H1.
- The primary CTA's href resolves to a real route, and every header and footer href resolves to a real route or an existing in-page anchor.
- The sitemap contains every public route and no `/parent`, `/onboarding`, or `/session/*` entry.

**Verification:** Lint, type-check, tests, build pass. Manual keyboard walkthrough of the mobile menu.

---

### U4. Public marketing pages

**Goal:** The landing page that carries the differentiated value proposition, with the demo as its dominant visual.

**Requirements:** R1, R2, R3, R6, R9, R10, R11, R12, R13.

**Files:** `src/app/(public)/page.tsx`, `src/components/marketing/Hero.tsx`, `ReasoningDemo.tsx`, `Differentiation.tsx`, `HowItWorks.tsx`, `AssessmentCoverage.tsx`, `ParentValue.tsx`, `Trust.tsx`, `Faq.tsx`, `FinalCta.tsx`, `src/content/marketing/copy.ts`, plus `src/app/page.tsx` (deleted — superseded by the `(public)` group).

**Approach:**
- Section order and copy direction per spec §4.2–4.11, using the brainstorm's settled decisions: headline "See why, not just what," supporting line about CogAT/OLSAT/NNAT with visual explanations, primary CTA **Start free diagnostic**, secondary **See how it works**. The reasoning demo is the second section, per R6.
- Copy lives in `src/content/marketing/copy.ts`, separate from layout. This is the single place to scan for prohibited claims.
- U4 creates `page.tsx` and the marketing components, and updates the `assessments/`, `faq/`, and `contact/` routes U3 created rather than creating them.
- One dominant visual idea per section (spec §8.5). Three how-it-works steps as a restrained numbered sequence, not a card wall.
- Assessment coverage per spec §4.5, scoped to content that exists at launch (R9). No affiliation language (R3).
- No pricing component, config, or section is created (KTD7, R11, AE6). A test asserts the pricing vocabulary never appears in the rendered page.
- `Trust.tsx` renders no testimonial or endorsement block unless config supplies real content (R12).
- `ParentValue.tsx` labels any sample chart **Example data** (R10).

**Test scenarios:**
- Landing page renders exactly one H1 matching the positioning line (R1).
- A content scan test greps rendered output for prohibited claim patterns — "guaranteed", "clinically proven", "COPPA compliant", "% improvement", "official partner" — and fails if any appears.
- No pricing component or configuration exists, and no "pricing", "plans", "subscription", "per month", or price-shaped string appears in the rendered page.
- Assessment coverage sections render CogAT, OLSAT, NNAT with their sub-areas and contain no endorsement phrasing.
- No horizontal overflow at 320px viewport width.

**Verification:** Lint, type-check, tests, build pass. Grep the built HTML for prohibited strings as a release check.

---

### U5. Interactive reasoning demo

**Goal:** The product's central proof, on the landing page — a real matrix puzzle a visitor can solve and have explained.

**Requirements:** R7, R8, R24, R25, R33.

**Files:** `src/components/reasoning/MatrixGrid.tsx`, `ShapeGlyph.tsx`, `ExplanationPlayer.tsx`, `useExplanation.ts`, `src/content/demo/matrix-question.ts`.

**Approach:**
- Author one mathematically correct 3×3 figure matrix with a missing cell, where the governing rule is a visible transformation (rotation, size, fill, or count) applied consistently along a row or column (KTD5).
- `ExplanationPlayer` implements the state machine from High-Level Technical Design: idle → answered → step-through → complete, with replay/reset. Each step carries `narration`, `highlightIds`, and an `operation`; the renderer interprets these against the grid.
- Feedback after selection is respectful and specific ("Look at row 2 — each shape rotates 90°"), never a bare right/wrong.
- The static path renders every step without animation and is what `prefers-reduced-motion` receives. Both paths derive from the same step data (KTD8).
- Correct and incorrect states are distinguished by icon/label and border treatment, never color alone (R25, R33).
- Every interactive element is a real focusable control: arrow-key grid navigation, Enter/Space to select, arrow keys to step the explanation.

**Test scenarios:**
- The demo question validates against `validateQuestion` (from `src/lib/questions/validate.ts`) — key and explanation agree (AE2).
- A visitor can complete the full sequence: select → feedback → step through all steps → replay (R8).
- With `prefers-reduced-motion: reduce`, no animation runs and all steps remain reachable (R25, AE1).
- Keyboard-only operation reaches every control in logical order with no trap (AE1).
- Feedback is announced via an `aria-live` region.
- Selecting the wrong choice still yields the explanation, with the rule stated, and never a punitive screen (R23).

**Verification:** Lint, type-check, tests, build pass. Manual keyboard-only run of AE1 end to end.

---

### U6. Auth: provider interface and demo mode

**Goal:** Parent sign-in/sign-up through a real provider when configured, and an unmistakably labeled demo mode when not.

**Requirements:** R14, R17, R29, R35.

**Files:** `src/lib/auth/types.ts`, `provider.ts`, `demoProvider.ts`, `session.ts`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/middleware.ts`, `src/components/auth/*`.

**Approach:**
- Define `AuthProvider` as an interface: `getSession()`, `signUp()`, `signIn()`, `signOut()`, `getUser()`. Exactly one implementation ships in this plan: `DemoAuthProvider`, active whenever no provider is configured. The interface is the reversible seam; `RealAuthProvider` is added by the deferred backend unit once a vendor is chosen, and until then there is no second file to stub.
- Demo mode is visible: a persistent, unmissable banner, distinct visual treatment, and wording that states plainly that no real data is protected, that demo records are held in volatile server-side storage and erased when the app restarts, and that nothing is written to the visitor's device. Never implies secure authentication (KTD6, R14).
- Protected routes redirect unauthenticated users to sign-in. Server-side session check, not client-only (R29).
- Collect email for the parent only. Never request a child's full legal name or birth date in this flow (R17).

**Test scenarios:**
- With no auth env vars set, the app enters demo mode and the banner is visible on every app route.
- Unauthenticated access to `/parent` redirects to sign-in; the redirect happens server-side.
- Signing out clears the session and protected routes become unreachable again.
- Demo mode wording contains no claim of security or data protection.
- Sign-up rejects an invalid email with a labeled inline error, not a generic failure.

**Verification:** Lint, type-check, tests, build pass.

---

### U7. Parent onboarding stepper

**Goal:** Crisp, thoughtful, short setup — a stepper, not a survey.

**Requirements:** R15, R16, R17, R18, R19, R33, R34.

**Files:** `src/app/onboarding/page.tsx`, `src/components/onboarding/Stepper.tsx`, `steps/AgeStep.tsx`, `ExperienceStep.tsx`, `GoalStep.tsx`, `ScheduleStep.tsx`, `InterestsStep.tsx`, `BeginStep.tsx`, `src/lib/onboarding/schema.ts`, `src/lib/onboarding/draft.ts`.

**Approach:**
- Six steps in the confirmed order (spec §5.1): age → experience → goal → schedule → interests → begin.
- Required steps (1–4) validate inline and block Continue. Step 5 (interests) always offers Skip and is never required (R18).
- Age is collected as an age band, never a date of birth (R17). Grade is asked only where a specific flow needs it, with a stated reason (spec §5.2).
- Draft state persists across steps via server persistence when available, with a local fallback; Back navigation never clears answers (R16, AE5).
- The goal step accepts multiple selections and always offers "Not sure yet" as a valid answer (spec §5.2).
- Step 6 summarizes and, on completion, runs the deterministic path generator (U13's rules) to produce an initial learning path. Copy must not call this "AI-personalized" (spec §5.2 Step 6).
- Mobile: full-width tap targets, no horizontal scroll, Back/Continue always visible.

**Test scenarios:**
- Onboarding cannot advance past a step with missing required input, and the error is associated with the field (AE-validates).
- Back from step 3 to step 1 preserves both answers, editable (AE5).
- Interests can be skipped and onboarding still completes.
- The draft survives a page reload mid-flow.
- "Not sure yet" is selectable and accepted as a goal.
- Completing onboarding creates a child profile and a learning path with no "AI-personalized" claim in the copy.

**Verification:** Lint, type-check, tests, build pass. Manual run at 320px and desktop widths.

---

### U8. Question content model and validator

**Goal:** A typed content model where a question cannot exist without a correct key and a matching explanation.

**Requirements:** R23, R24, R19 (data side), R9.

**Files:** `src/content/questions/types.ts`, `validate.ts`, `figureMatrix.ts`, `figureAnalogy.ts`, `classification.ts`, `numberSeries.ts`, `verbalAnalogy.ts`, `src/content/questions/index.ts`, `src/content/questions/*.test.ts`.

**Approach:**
- Define concrete schemas per question type — not `Record<string, unknown>`, which the spec explicitly rejects as an excuse for an unvalidated format (spec §6.4). `FigureMatrixQuestion`, `FigureAnalogyQuestion`, `ClassificationQuestion`, `NumberSeriesQuestion`, `VerbalAnalogyQuestion` each get their own typed visual payload.
- `ExplanationStep` carries `id`, optional `title`, `narration`, `highlightIds`, `operation`, and type-specific `visualState`.
- `validateQuestion(question)` asserts: unique choice ids; `correctChoiceId` references a real choice; the choice the explanation reveals equals `correctChoiceId`; every `highlightId` references a real element in the question's visual; every step has non-empty narration; difficulty is a valid value (KTD5, AE2).
- Seed a small, quality-checked corpus — the minimum that covers each supported reasoning category, authored and manually verified by a human before shipping.
- Every reasoning category the product claims coverage for has at least one validated question; the validator's corpus check enforces this (R9, spec §6.2 "do not claim full coverage until representative, quality-checked questions exist").

**Test scenarios:**
- A question whose `correctChoiceId` disagrees with its explanation fails validation (AE2).
- Duplicate choice ids fail validation.
- A `highlightId` referencing a nonexistent element fails validation.
- An empty narration fails validation.
- The validator passes over the entire shipped corpus (run as part of `npm test`).
- Coverage check fails when a claimed category has no validated question.

**Verification:** Lint, type-check, tests, build pass. Human review of every seeded question's correctness before merge.

---

### U9. Privacy, Terms, and Contact surfaces

**Goal:** Required legal and support surfaces with no fabricated promises.

**Requirements:** R4, R13, R35.

**Files:** `src/app/(public)/privacy/page.tsx`, `terms/page.tsx`, `src/content/legal/privacy.md`, `terms.md`, `src/components/legal/ReviewBanner.tsx`.

**Approach:**
- Pages ship with clearly marked placeholder legal copy and a visible review banner stating the copy requires qualified legal review and is not approved (R4). They do not claim compliance status.
- U9 creates the privacy and terms routes and updates the `contact/page.tsx` U3 created rather than creating it.
- The contact form mounts in the contact route with its own typed adapter and delivery-state feedback.
- Privacy copy describes only what the product actually does today — including that demo mode stores nothing securely and that child data is limited to an age band and practice responses.
- Contact page offers a working form (typed adapter, demo-mode labeled) with validation and honest delivery-state feedback, not a fake success message (R35).
- Both legal pages carry proper metadata and are indexable; app routes are excluded (R13).

**Test scenarios:**
- Each page renders one H1 and a review banner while copy is unapproved.
- A content scan finds no compliance-status string ("COPPA compliant", "GDPR compliant", "certified") anywhere in legal copy.
- The contact form rejects an invalid submission inline and, on success in demo mode, says plainly that nothing was delivered to a real inbox.
- `/parent` and `/session/*` are excluded from indexing via robots metadata.

**Verification:** Lint, type-check, tests, build pass.

---

### U10. Practice session and explanation player

**Goal:** The focused practice experience where the child figures out how the rule works.

**Requirements:** R21, R22, R23, R24, R25, R32, R33, R34.

**Files:** `src/app/session/[sessionId]/page.tsx`, `src/components/session/SessionShell.tsx`, `QuestionStage.tsx`, `AnswerChoices.tsx`, `FeedbackPanel.tsx`, `src/components/reasoning/ExplanationPlayer.tsx` (shared with U5), `src/lib/session/runSession.ts`, `src/app/practice/page.tsx`, `src/app/diagnostic/page.tsx`.

**Approach:**
- Session shell per spec §6.1: progress indicator ("Question 3 of 8"), prompt, visual area, choices, submit/continue, exit/pause. Nothing else on the child screen — no analytics, no upgrade banners, no marketing copy (R21).
- Answer choices use roving tabindex in a `radiogroup`: arrow keys move focus between choices and never commit a selection; Space or Enter selects the focused choice; selection never changes a previously committed answer without an explicit reselect. Submission is disabled until a choice is selected and latches after one submit (no double submission).
- `runSession` evaluates each answer against the question key, persists a `QuestionResponse` (questionId, selectedChoiceId, isCorrect, answeredAt, explanationViewed), and drives the explanation player.
- Timing is stored only where the progress view needs it and only after the disclosure in the privacy copy (R32).
- Pause/exit offers save-and-resume within the session, not a destructive discard (spec §6.1).
- The explanation player is the same component the landing demo uses — one implementation, one accessibility contract (KTD8).
- R21's prohibition names analytics, upgrade banners, and marketing copy. The factual demo-mode environment notice required by KTD6 is none of those and stays visible on `/session/*`, rendered as a slim top bar outside `SessionShell` so it never competes with the question area.
- Empty, error, and expired-session states are designed, per R35: missing question data, failed save, offline, expired session, explanation unavailable.

**Test scenarios:**
- A session can be started, answered question by question, and completed; each answer is evaluated against the known key (R23).
- Submit is unavailable with no selection and latches after a single submit (R22).
- Keyboard-only: arrow keys move focus between choices without committing, Space/Enter selects, and Enter submits only from the Submit control (R33).
- A failed save shows a designed error with a retry path, never a silent loss (R35).
- An expired session shows the designed expired state with a route home.
- Missing question data shows "explanation unavailable" rather than crashing.
- No child-screen surface renders parent analytics or marketing copy (assert against rendered output).

**Verification:** Lint, type-check, tests, build pass. Full keyboard-only run of a session.

---

### U11. Repositories and data adapters

**Goal:** One seam that makes demo data swappable for real persistence without touching callers.

**Requirements:** R27, R28, R29, R30, R31.

**Files:** `src/lib/data/types.ts`, `repositories.ts`, `demoDataSource.ts`, `authorization.ts`, `src/lib/data/demoSeed.ts`, `src/lib/data/migrations.md`.

**Approach:**
- Repository interfaces: `UserRepo`, `ChildProfileRepo`, `QuestionRepo`, `SessionRepo`, `ResponseRepo`. Every child-scoped method takes the owning parent id as a required argument and filters on it inside the implementation (R30).
- `authorization.ts` exposes `requireParentAccess(parentId, childId)` used by every route handler and server action touching child data. Routes call it; UI gating is never the control (R30, AE4).
- `DemoDataSource` persists to a server-side file-backed store (a single local JSON or SQLite file) seeded from `demoSeed.ts`, not to process memory. Next.js compiles route handlers, server actions, and server-component renders into separate module graphs, so a module-scoped object is not shared across them and is lost on every cold start; a file-backed store survives both and is still trivially swappable. It is marked as demo and clearly labeled wherever it surfaces.
- `DemoDataSource` is the only implementation this plan ships. A real store is added by the deferred backend unit once one is chosen; `migrations.md` documents that swap (KTD2, KTD6).
- A `dataSource` factory resolves once at startup from configuration; every surface reads its mode from it, so demo labeling cannot drift from the actual source.
- Deletion support: `ChildProfileRepo.deleteWithData()` removes the profile, its sessions, and its responses together (R31).

**Test scenarios:**
- Requesting another parent's child data through any repository method returns a not-found/denied result and no data (AE4).
- Deleting a child profile removes its sessions and responses as well (R31).
- `DemoDataSource` reports `mode: "demo"`; a configured real source reports `mode: "production"`.
- The conformance suite passes against `DemoDataSource` and an in-test fake repository; conformance of a real store is a gate the deferred backend unit must pass when one exists, and is recorded as a launch-checklist blocker until then.
- A record written by a server action is readable by a subsequent server-component render of the parent dashboard (the persistence regression the file-backed store exists to prevent).

**Verification:** Lint, type-check, tests, build pass. The interface conformance suite runs against the demo source and the in-test fake.

---

### U12. Results screen

**Goal:** A calm, honest wrap-up that points to the next practice action.

**Requirements:** R26, R5, R28, R33.

**Files:** `src/app/session/[sessionId]/results/page.tsx`, `src/components/session/ResultsSummary.tsx`, `NextActionCard.tsx`, `src/lib/scoring/nextAction.ts`.

**Approach:**
- Shows questions completed, correct answers, reasoning areas practised, one small positive insight, a suggested next action, and a route home (spec §6.6).
- A persistent, plain-language note states that results reflect performance on Heir of Wisdom's own practice questions and are not an IQ score, official assessment result, or predictor of placement (R5, R20).
- `nextAction` derives from the deterministic diagnostic/practice rules in U13 — deterministic, documented, never a model (R19).
- Accuracy from a short sample is never framed as a skill measurement; insufficient-sample cases show the "not enough data yet" state (R28).

**Test scenarios:**
- Results render from real recorded responses for the session, with counts matching what was answered (R26).
- The not-an-IQ-score note is present in the rendered output.
- A session with zero responses shows a designed state, not NaN or a zeroed chart.
- The suggested next action is deterministic: same responses → same recommendation.

**Verification:** Lint, type-check, tests, build pass.

---

### U13. Diagnostic scorer and progress calculators

**Goal:** Transparent, deterministic scoring — the honest core of "progress."

**Requirements:** R19, R28, R20.

**Files:** `src/lib/scoring/diagnostic.ts`, `diagnosticRules.ts`, `progress.ts`, `insufficientData.ts`, `src/lib/scoring/*.test.ts`.

**Approach:**
- The diagnostic samples supported reasoning categories and scores only questions actually answered (R19). Partial sessions produce a partial result, clearly labeled as partial.
- `diagnosticRules.ts` maps per-category outcomes to a recommended practice mix through explicit, readable, deterministic rules. Every rule carries a comment explaining the reasoning. This is the code the spec requires to be documented rather than hidden (spec §10.3).
- `progress.ts` computes activity and per-area performance from stored responses on read — no denormalized counters that can drift from source data.
- `insufficientData.ts` defines the minimum sample per area; below it, the API returns "not enough data yet," which the UI renders distinctly from low performance (R28, AE3).
- Neither the diagnostic nor any progress view is described as an official assessment or clinical evaluation (R20).

**Test scenarios:**
- A full session scores every answered question and no unanswered one (R19).
- A partial session yields a partial result labeled as partial, not a confident full recommendation.
- The same responses always produce the same recommendation (determinism).
- Below the minimum sample, `progress` returns the insufficient-data state rather than a percentage (AE3).
- `progress` figures match a hand-computed count for a known response set.
- No scoring output contains an IQ, percentile, or placement claim.

**Verification:** Lint, type-check, tests, build pass. Rules reviewed by a human for pedagogical soundness.

---

### U14. Parent dashboard and child progress

**Goal:** The parent view that answers what was practised, what's going well, and what to do next.

**Requirements:** R27, R28, R29, R30, R33.

**Files:** `src/app/parent/layout.tsx`, `page.tsx`, `src/app/parent/children/[childId]/page.tsx`, `src/components/parent/ChildSwitcher.tsx`, `ActivityFeed.tsx`, `AreaBreakdown.tsx`, `RecommendedNext.tsx`, `src/app/settings/page.tsx`.

**Approach:**
- Overview per spec §7.1: child switcher, continue/start practice, recent activity, session summaries, progress by reasoning area where data suffices, and exactly one recommended next action.
- Child detail per spec §7.2: practice history by date, questions attempted and completed, performance by reasoning type or assessment section, areas with more activity, suggested next practice.
- Every chart derives from stored responses through U13's calculators, or is labeled demo data in demo mode (R28). The **Example data** label is reserved for the public sample chart in U4 (R10). Every chart has a text equivalent for screen readers (R33).
- "Not enough data yet" renders as its own state, never as a zeroed chart or a low score (AE3).
- Settings covers account and child profile editing, data review, and deletion (R31). Answers from onboarding are changeable here (R16).
- Every route calls `requireParentAccess` before reading or mutating child data (R30, AE4).

**Test scenarios:**
- With zero sessions, the dashboard shows the designed empty state (AE3).
- With real sessions, displayed counts and percentages match a hand-computed fixture.
- Switching children shows that child's data only, and requesting another child's ID by URL is denied (AE4).
- Every chart renders an accessible text equivalent.
- Deleting a child profile requires confirmation, removes associated data, and routes to the no-profile state (R31).
- Exactly one primary recommended action is rendered.

**Verification:** Lint, type-check, tests, build pass. Cross-account isolation verified by test, not by inspection.

---

### U15. Accessibility and responsive hardening

**Goal:** WCAG 2.2 AA where practical, verified rather than assumed, across every surface.

**Requirements:** R25, R33, R34.

**Files:** cross-cutting — `src/app/globals.css`, `src/components/**`, `tests/accessibility/*.test.tsx`.

**Approach:**
- Audit each shipped route against the spec's accessibility list: semantic headings and landmarks, keyboard access for navigation/choices/dialogs/menus, visible focus, contrast, labeled form errors, `aria-live` for feedback, alt-text policy, reduced-motion.
- Verify 320px through wide desktop: no horizontal overflow, touch targets ≥44px for primary controls, correct focus order, clean text wrapping at 200% zoom.
- Confirm the static explanation path stays in parity with the animated one (KTD8) — same reachable steps, same information.
- Fix issues at the source rather than layering patches; each fix lands with the regression test that caught it.

**Test scenarios:**
- Automated axe-style scan on landing, sign-in, onboarding, session, results, and parent dashboard reports no critical violations.
- Every interactive control is keyboard-reachable with no trap.
- Focus is visible on every interactive element.
- No page overflows horizontally at 320px.
- Reduced-motion users reach every explanation step with no animation.

**Verification:** Lint, type-check, tests, build pass. Accessibility scan output included in the final report.

---

### U16. QA, states, and final report

**Goal:** Prove the acceptance criteria, close the state gaps, and report honestly.

**Requirements:** R35, R36, and the specification's §14.3–14.4 quality checks.

**Files:** `tests/e2e/*.spec.ts`, `src/lib/data/demoSeed.ts` (fill gaps), `docs/launch-checklist.md`, `docs/final-report.md`.

**Approach:**
- End-to-end coverage of the primary flows: F1 (landing → demo → signup), F2 (onboarding → profile), F3 (diagnostic → path), F4 (session → results → dashboard), F5 (demo mode labeling).
- Walk the full state list from the spec §13 and confirm each has a real designed state: no child profile, no sessions, diagnostic incomplete, missing question data, failed save, auth failure, offline, explanation unavailable, expired session.
- A build-time content scan greps output for fabricated claims and compliance-status strings — this is the automated guard for R2 and R4.
- `docs/launch-checklist.md` lists every item that still requires product-owner or legal sign-off, with the blocking status stated plainly.
- `docs/final-report.md` records routes completed, integrations real vs. mocked vs. unconfigured, commands run and their results, known limitations, and next actions — the spec's §14.4 requirement that the report distinguish implemented, mocked, and not-yet-configured features.

**Test scenarios:**
- Each flow F1–F5 passes end to end in the test environment.
- Each state in the spec §13 list renders its designed state, verified by a test per state.
- The fabricated-claims scan fails the build if a prohibited string is introduced.
- `npm run lint && npm run typecheck && npm test && npm run build` all pass from a clean install.
- Every blocker found during QA is either fixed or listed in the launch checklist as blocking — none are silently dropped.

**Verification:** Full gate green. Final report distinguishes implemented / mocked / not-configured for every feature area.

---

## Verification Contract

### Commands

Run from the repository root, in this order:

```
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs the unit and component suites. `npm run test:e2e` runs the flow coverage (U16); it is required before the work is declared done, though it may run separately in CI.

### Quality gates

| Gate | Requirement | Blocks |
|---|---|---|
| Lint | Zero errors. Warnings reviewed individually with justification. | Done |
| Type-check | Zero errors under `strict` | Done |
| Unit + component tests | All pass; no test suppressed, skipped, or `.only`'d to make a run green | Done |
| Content validation | Every shipped question passes `validateQuestion` (runs inside `npm test`) | Done |
| End-to-end flows | `npm run test:e2e` passes flows F1–F5 | Done |
| Fabricated-claims scan | No prohibited claim or compliance-status string in built output | Done |
| Accessibility scan | No critical violations on the six core routes | Done |
| Production build | Succeeds with no errors | Done |
| Launch checklist | Every product-owner/legal item resolved or explicitly listed as blocking | Launch |

### Verification ownership

Each unit's **Verification** field names its own gate. Unit-level tests run inside `npm test`; the end-to-end gate belongs to U16 and is a done condition, not an optional extra.

### When to escalate

If any gate cannot pass for a reason outside the implementation — missing credentials, unavailable legal copy, an undecided auth or backend provider — record it in the launch checklist as blocking, report it in the final report under not-yet-configured, and do not claim the corresponding requirement is met.

---

## Definition of Done

### Global

- Every P0 launch-critical item in the specification works end to end in the available environment, or is honestly labeled demo / not-configured in the final report.
- Every gate in the Quality gates table passes, or each failure is documented with its cause and owner.
- No fabricated claim, testimonial, outcome statistic, partnership, guarantee, or compliance-status string survives anywhere in the product (R2, R4).
- No launch-blocking question remains open; deferred questions are recorded with a decision path.
- Setup instructions and environment variables are documented, with every variable marked required or optional.
- The final report distinguishes implemented, mocked, and not-yet-configured features per area, and lists known limitations honestly.
- Abandoned experimental code from the build is removed, not left in the tree.

### Per unit

- The unit's stated **Test scenarios** all pass.
- The unit's **Verification** command passes.
- The unit's files contain no placeholder stubs, `TODO`s, or commented-out code that would mislead a later reader.
- Anything the unit could not complete is written into the launch checklist as a blocker with an owner — never quietly deferred.

---

## Appendix

### Sources

- `C:\Users\appyr\Downloads\HEIR-OF-WISDOM-OPENCODE-SPEC.md` — the Heir of Wisdom build specification. Sections cited inline throughout this plan.
- Session history saved across the brainstorm preceding this plan: landing page section order and copy direction, omit pricing at launch, and the decision to start from the marketing surface and add capabilities afterward. KTD1–KTD4 and KTD6 carry `session-settled` annotations; KTD5, KTD7 and KTD8 are planning decisions recorded in this plan.
- WCAG 2.2 AA success criteria — target for R33.
- Next.js App Router documentation — reference for KTD1's server-side authorization pattern (R30).

### Mapping to specification phases

| Spec phase | Units |
|---|---|
| Phase 1 — Repository audit and implementation plan | U1, this plan |
| Phase 2 — Shared design system and public marketing site | U2, U3, U4, U5, U9 |
| Phase 3 — Parent account/onboarding and child learning experience | U6, U7, U8, U10, U12 |
| Phase 4 — Parent progress experience and persistence/backend integration | U11, U13, U14 |
| Phase 5 — QA, accessibility, responsive polish, launch checklist | U15, U16 |