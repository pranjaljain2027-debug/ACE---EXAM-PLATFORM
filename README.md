# Heir of Wisdom

Visual reasoning studio for US children aged 8–10. Children observe, manipulate, discover, apply and reflect on visual rules; parents get evidence-based progress. Live at https://www.hierofwisdom.me.

## What is built

| Area | Status |
| --- | --- |
| Parent sign-up / sign-in / email verification / password reset (Supabase Auth) | Working |
| Consent capture at sign-up (terms, privacy, COPPA parental consent, optional reminders), stored server-side | Working |
| Child profiles (nickname, age, grade, avatar), goals with coverage disclosure, routine | Working |
| Parent PIN gate: child Studio locks parent areas; reports, billing, settings, deletion need PIN or fresh login | Working, enforced in the database |
| Discovery Quest (C02): 10 original untimed items, no hints, no feedback, skip and resume | Working |
| Lessons (C04–C07, C09): Observe → Experiment → Discover → Apply → Reflect with retry loops | 13 lessons working |
| Shape Lab (C05): rotate, reflect, recolour, resize, move with snapping, add/remove, undo/redo/reset, replay with speed, touch/mouse/keyboard, semantic match + "why it worked" feedback | Working |
| Hints: three progressive levels, server-validated, never before the first transfer attempt; assisted vs independent tracked separately | Working |
| Practice Arena (C08): 31 original items (matrix, analogy, sequence, classification), optional timer, no hints, full review after submit | Working |
| Learning Map (C03): data-driven prerequisites, revisit anytime | Working |
| Rule-based recommendations (remediate / new transfer / advance / break) | Working |
| Parent dashboard (P06) and skill report (P07) with evidence counts, windows, hint reliance, misconceptions | Working |
| Billing (P08): plan page, hosted checkout function, signature-verified webhook that alone changes entitlements | Built; **checkout returns "not configured" until Stripe keys are set** |
| Privacy: per-child and whole-account deletion (immediate, audited), consent history, audit log | Working |
| No-account demo at `/demo` (runs in the browser, nothing saved) | Working |
| Admin content authoring UI | **Not built.** Content is authored in TypeScript, validated, and published through the seed pipeline; the database refuses unreviewed or invalid content |
| Reminder emails | **Not built.** Preference is stored only |

## Architecture

- **Front end:** Vite + React 19 + TypeScript + Tailwind 4, deployed on Vercel. Kept Vite rather than moving to Next.js to avoid re-platforming the live site; all server logic lives in the database and edge functions instead.
- **Backend:** Supabase project `heir-of-wisdom` (us-east-1).
  - Postgres with row level security on every table. Parent ownership is checked on the server for every child record; knowing an ID is never permission.
  - Learning engine as SQL functions (`supabase/migrations/*`): `start_session`, `advance_session` (state machine), `record_hint`, `submit_attempt` (server-side scoring from answer keys the browser cannot read), `finish_session`, `get_studio_state`, `get_parent_report`, deletion and consent functions. Every write is idempotent on a client event id, so refresh or reconnect never duplicates attempts or awards.
  - Content is versioned. Published content is immutable; fixes ship as a new version and every attempt is bound to the version it used.
  - Edge functions: `billing-checkout`, `billing-webhook` (`supabase/functions/*`).
- **Parent / child separation:** one authenticated parent session. Entering the Studio closes the server-side gate; child mode can only reach Studio functions. Parent-only data (reports, billing, settings, consent, audit log, raw attempts) is readable only while the gate is open.
- **Content:** `src/data/activities.ts` (lessons) and `src/content/items.ts` (generated practice and baseline items, each wrong option tied to a named misconception). `scripts/generate-seed.ts` validates everything and emits the seed.

API surface (PRD §14 mapping): `POST /api/children` → `upsert_child`; `/plan`, `/recommendations` → `get_studio_state`; `POST /api/sessions` → `start_session`; `GET /api/activities/:id` → `activities` (public columns only); `POST /api/attempts` → `submit_attempt`; `POST /api/interactions/batch` → `record_events`; `POST /api/sessions/:id/complete` → `finish_session`; `/progress` → `get_parent_report`; billing → edge functions; `/privacy/deletion-requests` → `delete_child_data` / `delete_account`.

## Run locally

```bash
bun install
bun run dev        # http://localhost:3000, talks to the production Supabase project by default
bun run test       # 55 unit tests: shape lab, state machine, hints, transfer, reconnect, content, webhook signature
bun run lint       # typecheck
bun run build
```

Point at another Supabase project with `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`), apply `supabase/migrations/*` in order, then load content with `bun run content:seed` and run `supabase/seed/content.sql`.

## Required one-time settings (Supabase dashboard)

1. **Auth → URL Configuration:** Site URL `https://www.hierofwisdom.me`; add `https://www.hierofwisdom.me/**` and `http://localhost:3000/**` to redirect URLs. Without this, verification and reset links point to localhost.
2. **Auth → SMTP:** set a custom SMTP sender (e.g. Resend, Postmark). Supabase's built-in mailer only delivers to project team members and is heavily rate-limited, so real parents will not receive verification emails until this is set.
3. **Billing (when ready):** set edge function secrets `STRIPE_SECRET_KEY`, `STRIPE_PRICE_FAMILY_MONTHLY`, `STRIPE_WEBHOOK_SECRET`, and point a Stripe webhook at `https://rkeuluoykwvfgjpgxyio.supabase.co/functions/v1/billing-webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Assumptions and known limitations

- Answer keys never reach a signed-in child's browser. The no-account demo bundles the answers for its four lessons in a lazily loaded chunk.
- Skill statuses use interpretable rules (minimum 3 pieces of evidence; "applying independently" needs 2+ independent transfers). They are prototype hypotheses to calibrate with child testing, not validated measurement.
- Content target in the PRD (30 missions, 150+ variants) is not reached: 13 lessons, 10 baseline and 31 practice items today. Paper folding is not covered.
- Reflections are short free text visible only to the parent; consider replacing with fixed choices if counsel prefers no child free text.
- Microsoft Clarity loads only on public marketing pages for signed-out visitors and never in the Studio, demo, sign-up or parent area.

## Security and compliance gaps to close before public launch

- Legal review of the privacy policy, terms and COPPA consent method (pages are marked as drafts).
- Custom SMTP, Supabase Auth leaked-password protection, and MFA for parent accounts.
- Backups and incident runbook; rate limits beyond Supabase defaults.
- Accessibility audit with real assistive technology and tablet testing.
