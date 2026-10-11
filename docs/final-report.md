# Final report — Heir of Wisdom

Build of the launch plan (`plans/2026-10-10-1011-feat-heir-of-wisdom-launch-plan.md`),
covering U1 through U16. This report distinguishes **implemented**, **mocked**, and
**not configured**, because those three read identically in a demo and mean very
different things to a parent deciding whether to trust it.

## Verification

Run from the repository root, in this order:

```
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

| Gate | Result |
|---|---|
| Lint | pass, 0 errors, 0 warnings |
| Type-check | pass, 0 errors |
| Tests | pass — 390 tests across 45 files |
| Production build | pass, 14 routes |

Two of the four gates were failing on first run and were fixed rather than
adjusted around:

- TypeScript 7 is not yet supported by `typescript-eslint`, so lint failed
  outright on it. Pinned to 6.0.3.
- `eslint-config-next` 16 ships a native flat config; the `FlatCompat` layer
  rejected it. Config rewritten to import it directly.

## What is implemented, mocked, and not configured

### Implemented and real

| Area | Notes |
|---|---|
| Question content model | 5 typed schemas, one validator. No `Record<string, unknown>` escape hatch (R24). |
| Question corpus | 6 questions, each worked by hand before it was written. `solutions.test.ts` re-derives every mechanically checkable key — it caught a wrong keyed rotation that the structural validator passed. |
| Reasoning demo | SVG figure matrix, explanation player, roving-tabindex answers, reduced-motion static path, wrong-answer feedback that diagnoses the specific mistake. Verified in a browser. |
| Landing page | "See why, not just what", demo as section 2, pricing omitted outright, coverage claims intersected against the real corpus. |
| Diagnostic scoring | Counts exactly the answers given. Partial sessions labelled partial. Deterministic. |
| Practice recommendations | Five documented rules, evaluated in a fixed order. No model call anywhere in the path. |
| Progress calculations | Derived on read from the response log. No cached counters. |
| Insufficient-data handling | Below 3 answers per area, an explicit state renders instead of a percentage. |
| Parent dashboard | One read model feeds both the overview and child detail, so they cannot disagree. |
| Route guard | Server-side, prefix-matched on full path segments so `/settings-help` is not swallowed. |
| Sitemap | Public routes only; imports no authenticated route module. |
| Contact form | Re-validates at the server boundary and reports honestly that nothing is delivered. |

### Mocked, and labelled as such in the UI

| Area | What is real | What is not |
|---|---|---|
| Authentication | `AuthProvider` interface, session cookie, expiry handling, sign-out, one stable demo provider | No password, no verification, no real account. The banner says so. |
| Data store | Ownership enforced in the data layer, not left to callers | In-memory `Map`s. Records are erased on restart. The banner says so. |
| Parent dashboard data | Real derived figures from real recorded responses | Seeded demo sessions, labelled "demo data" wherever rendered. |
| Child profile creation | The record type limits what can be stored | No creation flow is wired to the dashboard. |

### Not configured

- **Auth provider.** No vendor chosen. `src/lib/auth/types.ts` is the seam.
- **Database.** No production backend. The demo store is file-backed, as decided.
- **Deployment.** No remote, no hosting, no canonical origin. The sitemap uses `localhost`.
- **Mail transport.** The contact form has a typed adapter that reports delivery as `none`.
- **AI provider.** Not used, deliberately. Every recommendation is deterministic rules.

## Requirements coverage

Complete: R1–R30, R32–R36.

Partial, with the gap named:

- **R31 — child profile creation and deletion.** The deletion control is rendered
  and disabled with its reason shown rather than appearing to work. Creation is
  not wired: onboarding collects the answers and the dashboard has no way to turn
  them into a profile, because there is no authenticated parent account to attach
  one to. The data layer's create and delete operations exist and are tested;
  nothing calls them from a route yet.

## Known deviations

1. **Onboarding does not persist its answers.** The flow is complete and tested —
   six steps, every rule enforced by a pure reducer — but the answers live in
   component state for the visit. This is deliberate: writing a child's details to
   browser storage before there is an account to own them would create a record
   with no owner and no way to delete it. It is listed as outstanding in the
   launch checklist rather than quietly left as a gap.
2. **Accessibility testing is structural, not an audit.** The suite catches
   regressions when a component is edited. It does not certify WCAG conformance
   and cannot: conformance requires manual testing with assistive technology,
   expert review, and testing on real platforms. The green suite means the
   checked properties hold, not that the product conforms.
3. **No visual regression testing.** Layout is verified in a browser by hand, not
   by automated screenshots.

## Findings worth keeping

Three things surfaced during the build that would otherwise have been caught
later and more expensively:

**The token-coverage test caught a missing `@import`** that made every design
token resolve to nothing. The stylesheet looked complete and rendered unstyled.

**The solution re-derivation test caught a wrong keyed rotation** that the
structural validator passed. A question can be internally consistent and still
teach the wrong rule, which is worse than no question at all.

**The claims scan caught 30 apparent violations, of which 0 were real.** Every
one was a test file asserting a term's absence, a code comment, or a required
negation. The scan was narrowed to shipped copy, comments, and negations — and
the narrowing is itself tested, because a content scan that exempts everything it
does not understand is not a scan.

**The claims scan later caught a false positive in itself**, matching "1, parents"
in a doc comment. The pattern now requires a number large enough to only appear in
a real claim. A check that fires on the project's own comments gets switched off
rather than fixed, so tightening it was the only durable option.

## Next actions

In the order they block a launch:

1. Choose an auth provider and write the second `AuthProvider` implementation.
   Onboarding persistence and child profile creation both wait on this.
2. Confirm or remove the "free diagnostic" entitlement.
3. Put the legal copy in front of a qualified reviewer.
4. Decide the retention window for child records.
5. Decide where demo data lives on the target platform, and add a path that
   actually deletes the file.
6. Add a guard so the demo build cannot be deployed to a public origin.
7. Point the sitemap at the real origin.
8. Manual accessibility testing with assistive technology.

`docs/launch-checklist.md` carries the same items with owners and status.
