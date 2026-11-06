import React, { useEffect, useState } from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  if (path === window.location.pathname + window.location.search) return;
  if (opts.replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
  listeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
}

export function usePath(): { path: string; search: URLSearchParams } {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    window.addEventListener('popstate', l);
    return () => {
      listeners.delete(l);
      window.removeEventListener('popstate', l);
    };
  }, []);
  return { path: window.location.pathname.replace(/\/+$/, '') || '/', search: new URLSearchParams(window.location.search) };
}

/** Match "/studio/lesson/:id" style patterns. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({ to, onClick, children, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(to);
    }}
    {...rest}
  >
    {children}
  </a>
);
