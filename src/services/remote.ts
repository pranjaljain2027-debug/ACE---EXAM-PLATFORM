import { supabase } from '../lib/supabase';
import type { Skill } from '../content/types';
import type { ActivityMeta, Catalog, LearningBackend, SessionStart, StudioState, SessionSummary, AttemptResult } from './types';

/** Retry transient network failures. Safe because every write is idempotent on a client event id. */
async function rpc<T>(fn: string, args: Record<string, unknown>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    const { data, error } = await supabase.rpc(fn, args);
    if (!error) return data as T;
    lastErr = error;
    const transient = /fetch|network|timeout|503|502/i.test(error.message ?? '');
    if (!transient) break;
    await new Promise((r) => setTimeout(r, 400 * 2 ** i));
  }
  throw lastErr instanceof Error ? lastErr : new Error((lastErr as { message?: string })?.message ?? 'request_failed');
}

let catalogCache: Promise<Catalog> | null = null;

async function loadCatalog(): Promise<Catalog> {
  const [{ data: skills, error: e1 }, { data: acts, error: e2 }] = await Promise.all([
    supabase.from('skills').select('*').order('sort_order'),
    supabase
      .from('activities')
      .select('id,content_version,title,domain,skill_id,mode,activity_type,prerequisites,difficulty,age_min,age_max,payload')
      .order('content_version', { ascending: false }),
  ]);
  if (e1 || e2) throw e1 ?? e2;
  const latest = new Map<string, (typeof acts)[number]>();
  for (const a of acts ?? []) if (!latest.has(a.id)) latest.set(a.id, a);
  const rows = [...latest.values()];
  const meta = (a: (typeof rows)[number]): ActivityMeta => {
    const { payload: _p, ...m } = a;
    return m as ActivityMeta;
  };
  return {
    skills: (skills ?? []) as Skill[],
    lessons: rows.filter((a) => a.mode === 'lesson').map((a) => ({ meta: meta(a), payload: a.payload })).sort((x, y) => x.meta.id.localeCompare(y.meta.id)),
    items: rows.filter((a) => a.mode !== 'lesson').map((a) => ({ meta: meta(a), payload: a.payload })).sort((x, y) => x.meta.id.localeCompare(y.meta.id)),
  };
}

export const remoteBackend: LearningBackend = {
  kind: 'remote',
  catalog() {
    if (!catalogCache) catalogCache = loadCatalog().catch((e) => { catalogCache = null; throw e; });
    return catalogCache;
  },
  studioState: (childId) => rpc<StudioState>('get_studio_state', { p_child: childId }),
  start: (childId, mode, opts = {}) =>
    rpc<SessionStart>('start_session', {
      p_child: childId,
      p_mode: mode,
      p_activity: opts.activityId ?? null,
      p_item_ids: opts.itemIds ?? null,
      p_timed: Boolean(opts.timed),
    }),
  advance: async (sessionId, to) => { await rpc('advance_session', { p_session: sessionId, p_to: to }); },
  hint: async (sessionId, stage, level, eventId) => {
    await rpc('record_hint', { p_session: sessionId, p_stage: stage, p_level: level, p_client_event: eventId });
  },
  submit: (sessionId, stage, itemId, answer, eventId, timeMs) =>
    rpc<AttemptResult>('submit_attempt', {
      p_session: sessionId, p_stage: stage, p_item: itemId, p_answer: answer === undefined ? null : answer,
      p_client_event: eventId, p_time_ms: timeMs ?? null,
    }),
  events: async (sessionId, events) => {
    if (events.length) await rpc('record_events', { p_session: sessionId, p_events: events }, 1);
  },
  checkpoint: async (sessionId, data) => { await rpc('save_checkpoint', { p_session: sessionId, p_checkpoint: data }, 1); },
  finish: (sessionId, reflection = {}) => rpc<SessionSummary>('finish_session', { p_session: sessionId, p_reflection: reflection }),
  practiceItemsForSkill: (skillId) => rpc<string[]>('practice_items_for_skill', { p_skill: skillId }),
};

// ---------------------------------------------------------------------------
// Parent-side API (all gate-protected on the server)
// ---------------------------------------------------------------------------

export interface ChildRow {
  id: string;
  nickname: string;
  age: number;
  grade: string;
  avatar: string;
  avatar_color: string;
  created_at: string;
}

export interface GateStatus {
  has_pin: boolean;
  unlocked: boolean;
  unlocked_until: string | null;
  pin_locked_until: string | null;
}

export const parentApi = {
  gateStatus: () => rpc<GateStatus>('gate_status', {}),
  setPin: (pin: string) => rpc<void>('set_parent_pin', { p_pin: pin }),
  verifyPin: (pin: string) => rpc<{ ok: boolean; reason?: string; remaining?: number; locked_until?: string }>('verify_parent_pin', { p_pin: pin }, 1),
  unlockAfterLogin: () => rpc<{ ok: boolean }>('unlock_gate_after_login', {}),
  lockGate: () => rpc<void>('lock_parent_gate', {}),
  async children(): Promise<ChildRow[]> {
    const { data, error } = await supabase.from('child_profiles').select('id,nickname,age,grade,avatar,avatar_color,created_at').order('created_at');
    if (error) throw error;
    return data ?? [];
  },
  async childSetup(childId: string) {
    const [{ data: goals }, { data: sched }] = await Promise.all([
      supabase.from('learning_goals').select('goal').eq('child_id', childId),
      supabase.from('learning_schedules').select('*').eq('child_id', childId).maybeSingle(),
    ]);
    return { goals: (goals ?? []).map((g) => g.goal as string), schedule: sched };
  },
  upsertChild: (args: {
    id: string | null; nickname: string; age: number; grade: string; avatar: string; avatarColor: string;
    goals: string[] | null; schedule: Record<string, unknown> | null;
  }) =>
    rpc<string>('upsert_child', {
      p_child: args.id, p_nickname: args.nickname, p_age: args.age, p_grade: args.grade, p_avatar: args.avatar,
      p_avatar_color: args.avatarColor, p_goals: args.goals, p_schedule: args.schedule,
    }, 1),
  report: (childId: string) => rpc<ParentReport>('get_parent_report', { p_child: childId }),
  billing: () => rpc<{ plan: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean; provider: string | null }>('get_billing', {}),
  setReminderConsent: (granted: boolean) => rpc<void>('set_reminder_consent', { p_granted: granted }, 1),
  deleteChild: (childId: string) => rpc<{ request_id: string; status: string }>('delete_child_data', { p_child: childId }, 1),
  deleteAccount: () => rpc<{ request_id: string; status: string }>('delete_account', {}, 1),
  async consents() {
    const { data, error } = await supabase.from('consent_records').select('consent_type,document_version,granted,method,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async auditLog() {
    const { data, error } = await supabase.from('audit_logs').select('action,target_type,created_at').order('created_at', { ascending: false }).limit(25);
    if (error) throw error;
    return data ?? [];
  },
  async checkout(): Promise<{ configured: boolean; url?: string; error?: string }> {
    const { data, error } = await supabase.functions.invoke('billing-checkout', { body: {} });
    if (error) {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try { return await ctx.json(); } catch { /* fall through */ }
      }
      return { configured: false, error: 'checkout_unavailable' };
    }
    return data;
  },
};

export interface ParentReport {
  generated_at: string;
  skills: {
    skill_id: string; title: string; domain: string;
    independent_transfers: number; assisted_transfers: number; failed_transfers: number;
    discover_with_hints: number; discover_independent: number;
    practice_correct: number; practice_total: number; evidence_count: number;
    first_evidence_at: string | null; last_evidence_at: string | null; status: string;
  }[];
  weekly: { week_start: string; sessions: number; independent_transfers: number; minutes: number }[];
  independent_transfers_this_week: number;
  hint_reliance: { discover_with_hints: number; discover_independent: number };
  misconceptions: { tag: string; count: number }[];
  baseline: (SessionSummary & { items: (SessionSummary['items'] extends (infer U)[] | undefined ? U & { domain?: string } : never)[] }) | null;
  recent_sessions: { id: string; mode: string; activity_id: string | null; completed_at: string; outcome: string | null; correct: number | null; total: number | null; timed: boolean }[];
  recommendation: { kind: string; activity_id: string | null; reason: string; at: string } | null;
}
