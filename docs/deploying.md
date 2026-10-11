# Deploying to Vercel

Where this deployment stands, in order, and what only you can do.

## Why you cannot skip step 2

`scripts/validate-deploy.mjs` runs as the first half of `npm run build`, and it
blocks **demo mode on a hosted environment**. A deploy with no `AUTH_PROVIDER`
set will fail with:

```
DEPLOYMENT BLOCKED: This build is in demo mode (no AUTH_PROVIDER set) and is
deploying to a hosted environment.
```

That is the guard working, not a bug. Demo mode has no real auth, no parent/child
data boundary worth the name, and no persistent accounts (R14). Pushing it to a
public URL would put an app that says "demo" in front of strangers while looking
like a product.

**The fastest way to see the site publicly today** is to deploy in demo mode
with the guard temporarily satisfied — but that option does not exist, and
should not. Do step 2 first.

---

## Step 1 — Push the repository

Vercel deploys from a Git host. This repo has no remote yet.

```bash
# Create an empty repo on GitHub/GitLab/Bitbucket first, then:
git remote add origin https://github.com/<you>/heir-of-wisdom.git
git push -u origin feat/heir-of-wisdom-u1-u5
```

Vercel also lists repositories automatically once the GitHub integration is
connected, which is the usual path.

## Step 2 — Create the Supabase project and set four env vars

1. Create a free project at [supabase.io](https://supabase.io).
2. Under **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the Supabase dashboard under **Authentication → Providers**, confirm
   **Email** is enabled (it is by default).
4. In Vercel: **Project Settings → Environment Variables**:

   | Name | Value |
   |---|---|
   | `AUTH_PROVIDER` | `supabase` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ey…` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (or your `*.vercel.app` URL) |

   Set them for **Production**, **Preview** and **Development** — the guard
   checks preview deploys too, because a preview URL is public.

`.env.example` documents each of these, including why the anon key is safe to
expose and which key never is.

## Step 3 — Deploy

Import the repository at [vercel.com/new](https://vercel.com/new). No build
settings need changing: `vercel.json` pins the framework, and the build command
is `npm run validate && next build`.

The first build runs the guard. With step 2 done it passes and the deploy
completes.

## What you get, and what still does not work

Will work immediately: the landing page, assessments, FAQ, legal pages, the
contact form's typed adapter, and the sign-in/sign-up forms.

Will not work yet, for reasons that predate the deployment and are not fixed by
it:

- **No mail transport.** The contact form reports delivery as `none`. Nobody
  receives those submissions.
- **No persistence for onboarding answers or practice sessions.** The data layer
  is file-backed and writes to `.data/`, which on Vercel is an ephemeral
  filesystem — records vanish between invocations. Only real auth sessions
  survive, in Supabase. A real database is the fix; the seam is
  `src/lib/data/`.
- **Legal copy unreviewed.** `privacy.md` and `terms.md` have not been seen by a
  qualified reviewer, and they now describe a live service.
- **The "free diagnostic" CTA is unverified.** It promises something no code
  implements a check for.
- **Accessibility is not audited.** The suite is structural regression cover, not
  a WCAG 2.2 AA conformance claim.

## Reverting to a local-only demo

If you want the public deploy stopped and to return to `localhost`:

```bash
git push --delete origin <branch>      # stop the source
# then delete the project in Vercel's dashboard
```

Locally, demo mode remains the default and needs no env vars: `npm run dev`.
