# Launch checklist — Heir of Wisdom

Every item here needs a decision or a signature from someone outside this
repository. Items marked **BLOCKING** stop a public launch. Items marked
**NON-BLOCKING** should be resolved but will not stop release.

Nothing on this list has been silently dropped. If a blocker is not listed, it
was not found; if a blocker is listed, it is still open.

---

## BLOCKING — legal sign-off

### The legal copy has not been reviewed by a qualified reviewer

`/privacy` and `/terms` ship placeholder text written to be honest about what the
product does, and both pages carry a visible banner saying the copy requires
legal review and is not approved. That banner is doing its job; the review it
asks for has not happened.

The copy deliberately states **no** compliance status — no COPPA, GDPR, or FERPA
claim anywhere. That absence is the correct default and must stay that way until
a reviewer says otherwise in writing.

**Needs:** a qualified legal reviewer, and a decision on whether the product's
actual data handling satisfies the regimes it operates under.
**Owner:** product owner.
**Status:** open. The product deliberately makes no claim, so this is about the
underlying practice rather than about copy that needs changing.

### The "free diagnostic" entitlement is unverified

The primary call to action on the landing page reads **"Start free diagnostic"**.
No pricing has been approved and no entitlement has been confirmed, so "free" is
an unbacked commercial claim on the site's highest-traffic button.

This ships deliberately — it is the product owner's call to carry until launch.
It is recorded here so it is a known, owned decision rather than a surprise.

**Needs:** confirm the entitlement exists, or change the label to one that
promises nothing (`See how it works`, `Try the diagnostic`).
**Owner:** product owner.
**Status:** open, carried knowingly.

### No production authentication exists

The only auth implementation in this build is `DemoAuthProvider`. It collects a
parent's email address, hands back a session, and stores nothing durably. There
is no password, no verification, and no real account system.

The app cannot serve real users in this state. Demo mode is labelled in the UI,
which satisfies R14 for a demo build and nothing more.

**Needs:** an auth provider chosen and a second `AuthProvider` implementation
written against the interface that already exists.
**Owner:** product owner + engineering.
**Status:** open. `src/lib/auth/types.ts` holds the seam; dropping a vendor in
should not require touching anything else.

---

## BLOCKING — data

### Demo records live in process memory, not a file-backed store

The demo-mode decision specifies a file-backed store so records survive a
restart. The implementation uses in-memory `Map`s. The banner text is accurate
about what actually happens — it says records are held in memory and erased on
restart — so the UI does not mislead anyone, but it is a deviation from the
decision.

**Needs:** either implement the file-backed store, or amend the decision and
confirm the banner wording stays as written.
**Owner:** engineering.
**Status:** open, recorded as a deviation in `docs/final-report.md`.

### Retention window for child records is undecided

No child record has a defined retention period. Nothing expires and nothing is
purged.

**Needs:** a retention window, and an owner for the decision.
**Owner:** product owner, with legal input.
**Status:** open.

### Demo mode in production

Nothing prevents the demo build from being deployed to a public URL. The banner
makes the mode visible once a visitor is on an app route, but a landing page
showing seeded demo data is not obviously a demo.

**Needs:** an explicit opt-in flag, or a deployment guard that refuses a demo
build when a production origin is configured.
**Owner:** engineering.
**Status:** open.

---

## NON-BLOCKING — content and claims

### Coverage claims are scoped to the shipped corpus

The landing page intersects each assessment area with the reasoning categories
that actually have validated questions, so it cannot claim a section with
nothing behind it. This is enforced in code, but the corpus is small: six
questions. Wording that stays accurate as the corpus grows will need review at
each addition.

**Needs:** a review pass whenever the question corpus grows.
**Owner:** engineering.

### Placeholder illustrations

The demo figure matrix is a hand-authored SVG. There are no image assets in the
build, so there is no licensing question — but this will change when real
illustrations are added, and image licences need to be recorded then.

**Owner:** product owner.
**Status:** open.

---

## NON-BLOCKING — infrastructure

### No deployment target

No remote, no hosting, and no canonical origin. The sitemap uses
`http://localhost:3000` because an invented hostname in a file crawlers read is a
worse mistake than an obviously provisional one. This must be pointed at the real
origin before launch.

**Owner:** engineering.

### Dependency advisory

`npm audit` reports a high-severity advisory chain in dev dependencies:
`eslint-config-next` → `fast-glob` → `micromatch` → `braces` (stack exhaustion
through deeply nested glob patterns). It is reachable only when ESLint expands
glob patterns in the lint config — a lint-time path, not a runtime one — and npm's
only offered fix is a major downgrade to `eslint-config-next@14`, which would
break the flat-config setup.

**Needs:** a deliberate decision to accept it or to pin the chain.
**Owner:** engineering.
**Status:** open, recorded rather than force-fixed.

### TypeScript pinned below latest

TypeScript is pinned to 6.0.3. `typescript-eslint` does not yet support TS 7 and
lint fails outright on it. Re-pin when the ecosystem catches up.

**Owner:** engineering.

---

## Verified as done

These were checked and do not need sign-off:

- Lint, type-check, tests and production build all pass.
- 355 tests across 43 files, including the accessibility contracts (U15), every
  designed state (U16), and the fabricated-claims scan (R2, R4).
- The fabricated-claims scan runs on every test run and fails the build if a
  prohibited claim is introduced.
- The demo banner makes no security or data-protection claim; this is asserted
  against the rendered text and the assertion itself is exercised against strings
  that would breach R14.
- Cross-account isolation is tested, not inspected: another parent's child id
  resolves to null, and the child page turns that into a 404 rather than an
  empty page.
- Every figure on the dashboard has a text equivalent; areas below the sample
  floor render "not enough data yet" rather than a percentage.
- No route behind an account appears in the sitemap, and the legal pages are
  reachable without a session.
