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
 *
 * This origin is resolved at deployment time. The local origin is used while
 * developing; point this at the deployment origin when there is one. If
 * AUTH_PROVIDER is set to a non-demo value and the deployment guard detects
 * a public origin, the build will fail until the sitemap is updated.
 */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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