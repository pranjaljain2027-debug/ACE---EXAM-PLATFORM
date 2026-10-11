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
| Tests | pass — 355 tests across 43 files |
| Production build | pass |

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
- **Database.** No backend. The demo store stands in.
- **Deployment.** No remote, no hosting, no canonical origin. The sitemap uses `localhost`.
- **Mail transport.** The contact form has a typed adapter that reports delivery as `none`.
- **AI provider.** Not used, deliberately. Every recommendation is deterministic rules.

## Requirements coverage

Complete: R1–R14, R16–R17, R19–R20, R23–R26, R27, R33–R35.

Partial, with the gap named:

- **R15, R18, R21, R22, R31** — onboarding was built then removed during this run
  because it could not be made to type-check within the session. The commit is
  preserved in history; the routes do not exist in the tree.
- **R28** — implemented for the dashboard and results. Not applied to the
  onboarding surfaces, which do not exist.
- **R29, R30, R32** — implemented and tested. Cross-account isolation is asserted
  by test, not by inspection.

## Known deviations

1. **Demo store is in memory, not file-backed.** The decision specified a
   file-backed store. The banner text is accurate about what actually happens, so
   no user is misled, but the decision and the implementation differ.
2. **Onboarding removed.** See R15/R18 above.
3. **Accessibility testing is structural, not an audit.** The suite catches
   regressions when a component is edited. It does not certify WCAG conformance
   and cannot: conformance requires manual testing with assistive technology,
   expert review, and testing on real platforms. The green suite means the
   checked properties hold, not that the product conforms.
4. **No visual regression testing.** Layout is verified in a browser by hand, not
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

## Next actions

In the order they block a launch:

1. Choose an auth provider and write the second `AuthProvider` implementation.
2. Confirm or remove the "free diagnostic" entitlement.
3. Put the legal copy in front of a qualified reviewer.
4. Decide the retention window for child records.
5. Implement the file-backed store, or amend the decision and the banner wording
   to match.
6. Add a guard so the demo build cannot be deployed to a public origin.
7. Point the sitemap at the real origin.
8. Manual accessibility testing with assistive technology.

`docs/launch-checklist.md` carries the same items with owners and status.
