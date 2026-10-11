/**
 * The banner's own styling, shipped beside it.
 *
 * Kept in its own module rather than in the global sheet so the banner cannot be
 * restyled into looking like ordinary page content by a later edit to a shared
 * rule. R14 asks for demo mode to be *visually* distinct, and a distinction that
 * depends on a stylesheet someone else owns is not one.
 */
export const STYLE_ID = "auth-demo";

export const styles = `
.auth-demo-banner {
  display: block;
  border: 1px solid var(--color-warning-border, #b45309);
  border-left-width: 4px;
  border-radius: 0.375rem;
  background: var(--color-warning-surface, #fef3c7);
  color: var(--color-text, #1f2937);
  padding: 0.75rem 1rem;
  margin: 0 0 1.5rem;
}

.auth-demo-banner__title {
  margin: 0 0 0.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-demo-banner__body {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.auth-demo-banner__body:last-child {
  margin-bottom: 0;
}

@media (prefers-reduced-motion: reduce) {
  .auth-demo-banner {
    transition: none;
  }
}
`;
