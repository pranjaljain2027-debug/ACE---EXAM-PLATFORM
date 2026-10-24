/**
 * No-account demo backend. Runs entirely in this browser tab: nothing about the child is collected or sent.
 * It applies the same rules as the server (src/engine/learning.ts mirrors the SQL functions).
 */
import {
  canTransition,
  hintAllowed,
  recordAttempt,
  recordHint,
  transferOutcome,
  type LessonProgress,
  type LessonState,
} from '../engine/learning';
import type { Catalog, LearningBackend, SessionStart, SessionSummary, StudioState } from './types';

type ContentModule = typeof import('../content/index');
let contentPromise: Promise<ContentModule> | null = null;
const content = () => (contentPromise ??= import('../content/index'));

export const DEMO_CHILD_ID = 'demo-child';
export const DEMO_LESSONS = ['rot-101', 'ref-101', 'prog-101', 'attr-101'];
export const DEMO_PRACTICE = ['pr-rot-01', 'pr-ref-06', 'pr-pro-01', 'pr-att-01'];

interface DemoSession {
  id: string;
  mode: 'lesson' | 'baseline' | 'practice';
  activityId: string | null;
  items: string[];
  timed: boolean;
  progress: LessonProgress;
  itemAnswers: Record<string, { answer: unknown; time_ms?: number }>;
  summary: SessionSummary | null;
  startedAt: string;
}

const sessions = new Map<string, DemoSession>();
const completed: { activityId: string; outcome: string; note?: string; at: string }[] = [];
let lastRec: SessionSummary['recommendation'] | null = null;

const id = () => `demo-${Math.random().toString(36).slice(2, 10)}`;

function get(sessionId: string): DemoSession {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('not_found');
  return s;
}

export const demoBackend: LearningBackend = {
  kind: 'demo',
  async catalog(): Promise<Catalog> {
    const c = await content();
    const meta = (a: (typeof c.ALL_CONTENT)[number]) => ({
      id: a.id, content_version: a.content_version, title: a.title, domain: a.domain, skill_id: a.skill_id, mode: a.mode,
      activity_type: a.activity_type, prerequisites: a.prerequisites, difficulty: a.difficulty, age_min: a.age_min, age_max: a.age_max,
    });
    return {
      skills: c.SKILLS,
      lessons: c.LESSONS.filter((l) => DEMO_LESSONS.includes(l.id)).map((l) => ({ meta: meta(l), payload: l.payload })),
      items: [...c.BASELINE_ITEMS, ...c.PRACTICE_ITEMS].filter((i) => DEMO_PRACTICE.includes(i.id)).map((i) => ({ meta: meta(i), payload: i.payload })),
    };
  },
  async studioState(): Promise<StudioState> {
    return {
      child: { id: DEMO_CHILD_ID, nickname: 'Explorer', avatar: 'owl', avatar_color: '#B98E4C', age: 9, grade: '4' },
      schedule: null,
      baseline_done: true,
      completed_lessons: [...new Set(completed.map((c) => c.activityId))],
      independent_lessons: [...new Set(completed.filter((c) => c.outcome === 'independent').map((c) => c.activityId))],
      open_sessions: [],
      recommendation: lastRec ?? { kind: 'continue', activity_id: 'rot-101', reason: 'Start with turning shapes.' },
      discoveries: completed.map((c) => ({ activity_id: c.activityId, note: c.note ?? null, outcome: c.outcome, at: c.at })),
    };
  },
  async start(_child, mode, opts = {}): Promise<SessionStart> {
    if (mode === 'baseline') throw new Error('Create a free parent account to run the Discovery Quest.');
    if (mode === 'lesson' && !DEMO_LESSONS.includes(opts.activityId ?? '')) throw new Error('not_found');
    const items = mode === 'practice' ? (opts.itemIds ?? []).filter((x) => DEMO_PRACTICE.includes(x)) : [];
    const s: DemoSession = {
      id: id(), mode, activityId: opts.activityId ?? null, items, timed: Boolean(opts.timed),
      progress: { state: mode === 'lesson' ? 'OBSERVE' : ('IN_PROGRESS' as LessonState), attempts: [], hintLevels: {} },
      itemAnswers: {}, summary: null, startedAt: new Date().toISOString(),
    };
    sessions.set(s.id, s);
    return {
      session: {
        id: s.id, mode, activity_id: s.activityId, state: s.progress.state, item_refs: items.map((x) => ({ id: x, version: 1 })),
        timed: s.timed, time_limit_seconds: s.timed ? 60 * items.length : null, checkpoint: {}, started_at: s.startedAt,
      },
      resumed: false, attempts: [], hint_levels: {},
    };
  },
  async advance(sessionId, to) {
    const s = get(sessionId);
    if (!canTransition(s.progress, to as LessonState)) throw new Error(`invalid_transition ${s.progress.state} -> ${to}`);
    s.progress = { ...s.progress, state: to as LessonState };
  },
  async hint(sessionId, stage, level) {
    const s = get(sessionId);
    if (s.mode !== 'lesson') throw new Error('hints_not_available_in_scored_mode');
    const ok = hintAllowed(s.progress, stage, level);
    if (!ok.ok) throw new Error(ok.reason);
    s.progress = recordHint(s.progress, stage, level);
  },
  async submit(sessionId, stage, itemId, answer, eventId, timeMs) {
    const s = get(sessionId);
    const c = await content();
    if (s.mode === 'lesson') {
      const lesson = c.getLesson(s.activityId!)!;
      const key = lesson.answer_key;
      let isCorrect: boolean;
      let feedback: string | null = null;
      if (stage === 'observe') {
        const a = [...(answer as string[])].sort();
        const k = [...key.observe.correct].sort();
        isCorrect = a.length === k.length && a.every((x, i) => x === k[i]);
      } else {
        const ck = key[stage as 'discover' | 'apply'];
        isCorrect = answer === ck.correct;
        feedback = ck.feedback[answer as string] ?? null;
      }
      const r = recordAttempt(s.progress, { stage: stage as 'observe' | 'discover' | 'apply', answer, isCorrect, clientEventId: eventId });
      s.progress = r.progress;
      return {
        is_correct: isCorrect, feedback, observe_key: stage === 'observe' ? key.observe.correct : null,
        is_first_attempt: r.attempt.isFirstAttempt, assisted: r.attempt.assisted,
        independent: isCorrect && r.attempt.isFirstAttempt && r.attempt.hintLevel === 0, duplicate: r.duplicate,
      };
    }
    s.itemAnswers[itemId!] = { answer, time_ms: timeMs };
    return { is_correct: null, is_first_attempt: true, assisted: false };
  },
  async events() {},
  async checkpoint() {},
  async finish(sessionId, reflection = {}) {
    const s = get(sessionId);
    if (s.summary) return { ...s.summary, already_completed: true };
    const c = await content();
    if (s.mode === 'lesson') {
      if (s.progress.state !== 'REFLECT') throw new Error('reflect_stage_required');
      const outcome = transferOutcome(s.progress);
      const next = DEMO_LESSONS[(DEMO_LESSONS.indexOf(s.activityId!) + 1) % DEMO_LESSONS.length];
      s.summary = {
        mode: 'lesson', transfer_outcome: outcome,
        discover_hints_used: (s.progress.hintLevels.discover ?? 0) > 0,
        recommendation: {
          kind: outcome === 'independent' ? 'advance' : 'new_transfer',
          activity_id: next,
          reason: outcome === 'independent' ? 'Solved the new problem on the first try with no hints.' : 'Solved with some help. Practice will make it stick.',
        },
      };
      completed.push({ activityId: s.activityId!, outcome, note: reflection.note, at: new Date().toISOString() });
    } else {
      const items = s.items.map((itemId) => {
        const it = c.getItem(itemId)!;
        const a = s.itemAnswers[itemId];
        const skipped = !a || a.answer == null;
        return {
          item_id: itemId, answer: a?.answer ?? null, skipped, is_correct: !skipped && a.answer === it.answer_key.item.correct,
          correct_option: it.answer_key.item.correct, explanation: it.answer_key.item.explanation, time_ms: a?.time_ms ?? null,
        };
      });
      s.summary = {
        mode: s.mode, items, timed: s.timed, provisional: false,
        correct: items.filter((x) => x.is_correct).length, total: items.length, answered: items.filter((x) => !x.skipped).length,
        recommendation: { kind: 'continue', activity_id: 'rot-101', reason: 'Missed items point to the lesson to revisit.' },
      };
    }
    lastRec = s.summary.recommendation ?? null;
    s.progress = { ...s.progress, state: 'COMPLETE' };
    return s.summary;
  },
  async practiceItemsForSkill() {
    return DEMO_PRACTICE;
  },
};
