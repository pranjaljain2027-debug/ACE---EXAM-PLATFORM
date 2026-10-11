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

### Demo records are held in a file on the server

The demo store is file-backed, as the demo-mode decision specified, and the
banner says so accurately: records stay in the file until it is deleted.

Two things follow that need a decision before launch. The file is inside the
application's working directory, so a deployment platform with an ephemeral
filesystem will lose it on every restart — which is fine for a demo and wrong for
anything real. And nothing yet deletes the file, so a parent's demo data persists
indefinitely.

**Needs:** decide where demo data lives on the target platform, and add a
deletion path that actually deletes the file.
**Owner:** engineering.
**Status:** open, and now a question about deployment rather than about the code.

### Onboarding does not persist its answers

The flow is complete and tested: six steps, with every rule — what counts as an
answer, whether Continue is allowed, what Back does — enforced by a pure reducer
and covered by 32 tests.

What it does not do is save. The answers live in component state for the visit,
and the summary step routes to the dashboard without creating a profile.

This is a deliberate omission rather than an oversight. Writing a child's age
band, goals, and interests to browser storage before there is an authenticated
parent account to own them would create a record with no owner and no way to
delete it, which is the opposite of what the privacy requirements are for.

**Needs:** a real auth provider first, then persistence attached to the parent
account rather than to the device.
**Owner:** engineering, blocked on the auth decision.
**Status:** open.

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
- 390 tests across 45 files, including the accessibility contracts (U15), every
  designed state (U16), and the fabricated-claims scan (R2, R4).
- Onboarding is complete and tested: six steps, a pure reducer holding every
  rule, 32 tests across the logic and the rendered flow.
- The demo store is file-backed, writes are serialised so concurrent requests
  cannot interleave, and a corrupt file falls back to a reseed rather than
  throwing on every later read.
- The fabricated-claims scan runs on every test run and fails the build if a
  prohibited claim is introduced.
- The demo banner makes no security or data-protection claim; this is asserted
  against the rendered text and the assertion itself is exercised against strings
  that would breach R14. Its promise about where data lives is asserted too, so it
  cannot drift from what the store actually does.
- Cross-account isolation is tested, not inspected: another parent's child id
  resolves to null, and the child page turns that into a 404 rather than an
  empty page.
- Every figure on the dashboard has a text equivalent; areas below the sample
  floor render "not enough data yet" rather than a percentage.
- No route behind an account appears in the sitemap, and the legal pages are
  reachable without a session.
