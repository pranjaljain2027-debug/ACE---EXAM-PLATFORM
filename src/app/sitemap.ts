import type { MetadataRoute } from "next";

/**
 * The public sitemap (R13).
 *
 * Public routes only. Nothing behind an account is listed, and none of those
 * route modules are imported to find out what they are — a sitemap that pulls
 * an authenticated page's component in is a sitemap that can drift out of date
 * without anyone noticing. `sitemap.test.tsx` asserts both of those, and it
 * also asserts the other direction: the list has to keep up with the routes
 * that exist. When a unit adds a public page — U4's landing page, U9's legal
 * pages — add it here in the same change or that test fails.
 */

/**
 * A sitemap entry must be an absolute URL, and this repository has no canonical
 * origin configured: the plan leaves the domain unresolved. The local origin is
 * used rather than an invented hostname, because a fabricated domain in a file
 * crawlers read is a worse mistake than an obviously provisional one. Point
 * this at the deployment origin when there is one.
 */
const SITE_ORIGIN = "http://localhost:3000";

const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/assessments", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  // Legal pages (U9). Indexed deliberately: a privacy notice and terms a
  // crawler cannot find are not much use to the people they are written for.
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_ORIGIN}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}