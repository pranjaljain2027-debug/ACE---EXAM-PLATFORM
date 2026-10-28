# SEO Baseline — Heir of Wisdom (heirOfWisdom.me)

**Source:** ace-repo (Vite + React SPA), public/, index.html, vite.config.ts, src/views/  
**Status:** Baseline audit — draft for review. Nothing published.  
**Date:** 2026-10-22

---

## 1. Crawlability & Indexation

| Factor | Finding | Status |
|--------|---------|--------|
| `robots.txt` | To be added to `/public/` | 🟡 To create |
| `sitemap.xml` | To be added to `/public/` | 🟡 To create |
| Canonical tags | To be added to index.html | 🟡 To create |
| `index.html` meta tags | title, description, og:title, og:description, og:type, twitter:card present | ✅ Present |
| Client-side rendering | Vite + React SPA (single index.html, `#root` mount) | ✅ Googlebot renders JS |
| PWA / service worker | VitePWA plugin configured with workbox precaching | ✅ Present (offline-capable) |
| HTTPS enforcement | To be enforced at deploy level | 🟡 Deploy-level |

**Crawlability opportunity:** The site is a client-side rendered SPA with a single HTML shell. Googlebot can execute JavaScript. Adding sitemap and robots.txt will help search engines discover pages faster.

---

## 2. Existing Public Pages

| Route | Component | Purpose | Crawlability Readiness |
|-------|-----------|---------|-------------------|
| `/` | LandingPage | Hero, value prop, CTA | ✅ Ready (entry point) |
| `/how-it-works` | HowItWorksPage | Five stages: Observe → Experiment → Discover → Apply → Transfer | 🟡 Ready (SPA route) |
| `/curriculum` | ChildLearnMap | Four core spatial skill families | 🟡 Ready (SPA route) |
| `/pricing` | PricingPage | Plan selection (no prices published) | 🟡 Ready (SPA route) |
| `/parent/onboarding` | ParentOnboarding | Account setup flow | 🔒 Auth-gated (authenticated) |
| `/parent/dashboard` | ParentDashboard | Child's learning journey | 🔒 Auth-gated (authenticated) |
| `/parent/settings` | ParentSettings | Account settings | 🔒 Auth-gated (authenticated) |
| `/studio` | ChildStudioHome | Child entry point | 🔒 Auth-gated (authenticated) |
| `/studio/learn` | ChildLearnMap | Topic exploration | 🔒 Auth-gated (authenticated) |
| `/studio/labs` | ChildRuleLab | Rule laboratory | 🔒 Auth-gated (authenticated) |
| `/studio/progress` | ChildProgressView | Progress tracking | 🔒 Auth-gated (authenticated) |

**Pages ready for SEO indexing:** `/`, `/how-it-works`, `/curriculum`, `/pricing` (public, unauthenticated).  
**Pages for authenticated users only:** All `/parent/*` and `/studio/*` routes (require login).

---

## 3. On-Page Elements Observed

**index.html (homepage shell):**
- `<title>`: "Heir of Wisdom — Interactive Visual Reasoning Studio"
- `<meta name="description">`: "A premium visual reasoning studio for children aged 8–12. Discover how patterns work, build cognitive thinking, and master visual reasoning."
- `<meta property="og:title">`: "Heir of Wisdom — Interactive Visual Reasoning Studio"
- `<meta property="og:description">`: matches description
- `<meta property="og:type">`: "website"
- `<meta name="twitter:card">`: "summary_large_image"
- `<meta name="theme-color">`: "#0E2235"
- Favicon + apple-touch-icon + PWA icons present
- Microsoft Clarity script present

**Opportunities to enhance:**
- Add `<meta name="robots">` directive
- Add `<link rel="canonical">`
- Add JSON-LD structured data (Organization, WebSite, FAQPage)

---

## 4. Buyer-Question Opportunity

**Two verified customer questions (from founder):**
1. "Will this help my child for real?" — Addressed in landing page objections section + How It Works page
2. "How long will it be before I see some improvement in my kid?" — Addressed in objections section but **no dedicated content exists**

**Opportunity:** The second question ("time to improvement") is answered only in a single objection-handling line on the landing page. There is room for a blog post, guide, or FAQ article dedicated to timeline of results, stage-by-stage progression expectations, or parent dashboard visibility into growth. This is a high-intent, consideration-stage search topic with room for content coverage.

**Recommended target:** A searchable blog post addressing "How long does it take to see improvement in visual reasoning?" or similar, mapped to the consideration/decision buyer stage.

---

## 5. Prioritized Action Plan

| Priority | Action | Rationale |
|----------|--------|-----------|
| 1 | Add `robots.txt` to `/public/` | Guide crawling of public pages, suggest `robots.txt` for auth-gated routes |
| 2 | Add `sitemap.xml` to `/public/` | List public pages for discovery |
| 3 | Add `<link rel="canonical">` to index.html | Define canonical URL |
| 4 | Add JSON-LD structured data (Organization, WebSite, FAQPage) | Enable rich results, help AI assistants understand content |
| 5 | Publish blog post on timeline-to-improvement | Fill buyer-question gap, capture consideration-stage search |
| 6 | Add internal links from `/how-it-works` to new blog post | Distribute link equity, improve crawl depth |

---

## 6. Evidence vs. Guesses Register

| Claim | Label | Basis |
|-------|-------|-------|
| No sitemap.xml in public/ | **[Evidence]** | Directory listing confirmed |
| No robots.txt in public/ | **[Evidence]** | Directory listing confirmed |
| SPA architecture (single index.html, #root) | **[Evidence]** | index.html and vite.config.ts confirmed |
| VitePWA plugin configured | **[Evidence]** | vite.config.ts confirmed |
| Googlebot can execute JS but crawl budget affected | **[Guess]** | General SEO knowledge, not tested on this site |
| "How long" question gap | **[Evidence]** | No blog/content exists for this question; only landing page objection line |

---

## 7. Next Steps (Draft Only — Do Not Publish)

1. Create `public/robots.txt` allowing `/`, `/how-it-works`, `/curriculum`, `/pricing`; suggest `robots.txt` for auth-gated routes  
2. Create `public/sitemap.xml` with public page URLs  
3. Add canonical tag to index.html  
4. Add JSON-LD Organization + WebSite schema to index.html  
5. Draft blog post on timeline-to-improvement (see `growth/blog-outline.md`)  
6. User must approve before any files are committed or pushed
