/**
 * Public runtime configuration.
 * The Supabase URL and publishable key are designed to be public: every table is protected by
 * row level security and every write goes through server functions that check parent ownership.
 * Override with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY for other environments.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? 'https://ahokskmczlkhsppzqcuk.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_dYPYOiF16QVPAvaUDVgWdQ_bZ75d5o-';

/** Pricing is configurable; checkout stays disabled until the payment provider is configured server-side. */
export const PRICING = {
  currency: 'USD',
  familyMonthly: Number(env.VITE_PRICE_FAMILY_MONTHLY ?? 14),
};

export const CONSENT_VERSION = '2026-10-24';
export const SUPPORT_EMAIL = env.VITE_SUPPORT_EMAIL ?? 'privacy@hierofwisdom.me';
