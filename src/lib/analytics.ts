/**
 * Microsoft Clarity runs only on public marketing pages. It is never loaded in the child Studio,
 * the no-account demo, sign-up/sign-in, or the parent area, so no child activity is recorded.
 * Once loaded it stays for the tab, so we load it only when a session *starts* on a marketing page
 * and the visitor is not signed in.
 */
const CLARITY_ID = 'z10l2mtd39';
export const MARKETING_PATHS = new Set(['/', '/how-it-works', '/curriculum', '/pricing', '/faq']);

let loaded = false;

export function maybeLoadMarketingAnalytics(path: string, signedIn: boolean) {
  if (loaded || signedIn || !MARKETING_PATHS.has(path)) return;
  if (typeof window === 'undefined' || navigator.doNotTrack === '1') return;
  loaded = true;
  const w = window as unknown as { clarity?: { q?: unknown[] } & ((...a: unknown[]) => void) };
  w.clarity = w.clarity || Object.assign((...args: unknown[]) => { ((w.clarity as { q?: unknown[] }).q ??= []).push(args); }, {});
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
}

/** True when the current page must never carry third-party scripts. */
export const isProtectedPath = (path: string) => !MARKETING_PATHS.has(path);

export const analyticsLoaded = () => loaded;
