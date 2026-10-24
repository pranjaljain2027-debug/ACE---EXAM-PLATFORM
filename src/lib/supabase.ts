import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});

const FRIENDLY: Record<string, string> = {
  parent_gate_required: 'A grown-up needs to unlock this with the parent PIN.',
  pin_required_before_child_mode: 'Set a parent PIN first, so the Studio can be locked for your child.',
  pin_must_be_4_digits: 'The PIN must be 4 digits.',
  child_limit_reached: 'You can add up to 6 children.',
  at_least_one_goal: 'Choose at least one goal.',
  consent_required: 'Please accept the terms, privacy policy and parental consent to continue.',
  not_found: 'That item could not be found.',
  session_complete: 'This session is already finished.',
  no_hints_before_first_transfer_attempt: 'Try once on your own first. Hints open after your first try.',
  hints_not_available_in_scored_mode: 'No hints during practice. You will see every answer explained at the end.',
  'Invalid login credentials': 'That email and password do not match.',
  'Email not confirmed': 'Please confirm your email first. Check your inbox for the link.',
  'User already registered': 'An account with this email already exists. Try signing in.',
};

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  for (const [k, v] of Object.entries(FRIENDLY)) if (msg.includes(k)) return v;
  if (/fetch|network|Failed to fetch/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
