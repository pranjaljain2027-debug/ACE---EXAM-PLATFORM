/**
 * Learning state machine, hint accounting and transfer classification.
 * The server (Supabase RPCs) is the source of truth for signed-in children; this module mirrors the
 * same rules for the no-account demo and is what the unit tests pin down.
 */

export type LessonState = 'OBSERVE' | 'EXPERIMENT' | 'DISCOVER' | 'APPLY' | 'REMEDIATION' | 'REFLECT' | 'COMPLETE';
export type Stage = 'observe' | 'discover' | 'apply';

export interface AttemptRecord {
  stage: Stage | 'practice' | 'baseline';
  itemId: string;
  answer: unknown;
  isCorrect: boolean | null;
  isFirstAttempt: boolean;
  hintLevel: number;
  assisted: boolean;
  clientEventId: string;
}

export interface LessonProgress {
  state: LessonState;
  attempts: AttemptRecord[];
  hintLevels: Partial<Record<'discover' | 'apply', number>>;
}

export const LESSON_ORDER: LessonState[] = ['OBSERVE', 'EXPERIMENT', 'DISCOVER', 'APPLY', 'REFLECT', 'COMPLETE'];

const has = (p: LessonProgress, stage: Stage, pred: (a: AttemptRecord) => boolean = () => true) =>
  p.attempts.some((a) => a.stage === stage && pred(a));

/** Same guard conditions as public.advance_session. */
export function canTransition(p: LessonProgress, to: LessonState): boolean {
  const from = p.state;
  if (from === to) return true;
  if (from === 'COMPLETE') return false;
  if (from === 'OBSERVE' && to === 'EXPERIMENT') return has(p, 'observe');
  if (from === 'EXPERIMENT' && to === 'DISCOVER') return true;
  if (from === 'DISCOVER' && to === 'EXPERIMENT') return true;
  if (from === 'DISCOVER' && to === 'APPLY') return has(p, 'discover', (a) => a.isCorrect === true);
  if (from === 'APPLY' && to === 'REMEDIATION') return has(p, 'apply', (a) => a.isFirstAttempt && a.isCorrect === false);
  if (from === 'REMEDIATION' && to === 'APPLY') return true;
  if ((from === 'APPLY' || from === 'REMEDIATION') && to === 'REFLECT') return has(p, 'apply');
  if (from === 'REFLECT' && to === 'COMPLETE') return true;
  return false;
}

export function transition(p: LessonProgress, to: LessonState): LessonProgress {
  if (!canTransition(p, to)) throw new Error(`invalid_transition ${p.state} -> ${to}`);
  return { ...p, state: to };
}

/** Same rules as public.record_hint: progressive, discover or post-first-attempt transfer only. */
export function hintAllowed(p: LessonProgress, stage: 'discover' | 'apply', level: number): { ok: boolean; reason?: string } {
  if (level < 1 || level > 3) return { ok: false, reason: 'invalid_hint_level' };
  if (stage === 'discover' && p.state !== 'DISCOVER') return { ok: false, reason: 'hint_stage_mismatch' };
  if (stage === 'apply') {
    if (p.state !== 'APPLY' && p.state !== 'REMEDIATION') return { ok: false, reason: 'hint_stage_mismatch' };
    if (!has(p, 'apply')) return { ok: false, reason: 'no_hints_before_first_transfer_attempt' };
  }
  const current = p.hintLevels[stage] ?? 0;
  if (level > current + 1) return { ok: false, reason: 'hints_must_be_progressive' };
  return { ok: true };
}

export function recordHint(p: LessonProgress, stage: 'discover' | 'apply', level: number): LessonProgress {
  const check = hintAllowed(p, stage, level);
  if (!check.ok) throw new Error(check.reason);
  return { ...p, hintLevels: { ...p.hintLevels, [stage]: Math.max(p.hintLevels[stage] ?? 0, level) } };
}

/** Classify a new attempt. Idempotent on clientEventId (reconnect/refresh safe). */
export function recordAttempt(
  p: LessonProgress,
  input: { stage: Stage; itemId?: string; answer: unknown; isCorrect: boolean | null; clientEventId: string },
): { progress: LessonProgress; attempt: AttemptRecord; duplicate: boolean } {
  const existing = p.attempts.find((a) => a.clientEventId === input.clientEventId);
  if (existing) return { progress: p, attempt: existing, duplicate: true };
  const itemId = input.itemId ?? input.stage;
  const isFirstAttempt = !p.attempts.some((a) => a.stage === input.stage && a.itemId === itemId);
  const hintLevel = input.stage === 'observe' ? 0 : p.hintLevels[input.stage] ?? 0;
  const attempt: AttemptRecord = {
    stage: input.stage,
    itemId,
    answer: input.answer,
    isCorrect: input.isCorrect,
    isFirstAttempt,
    hintLevel,
    assisted: hintLevel > 0 || !isFirstAttempt,
    clientEventId: input.clientEventId,
  };
  return { progress: { ...p, attempts: [...p.attempts, attempt] }, attempt, duplicate: false };
}

export type TransferOutcome = 'independent' | 'assisted' | 'not_yet';

/** Correct after hints is assisted, never independent. Only the first, hint-free attempt counts as independent. */
export function transferOutcome(p: LessonProgress): TransferOutcome {
  const applies = p.attempts.filter((a) => a.stage === 'apply');
  const first = applies[0];
  if (first && first.isCorrect && first.hintLevel === 0) return 'independent';
  if (applies.some((a) => a.isCorrect)) return 'assisted';
  return 'not_yet';
}

// ---------------------------------------------------------------------------
// Skill status (mirrors public.skill_status) and recommendation rules
// ---------------------------------------------------------------------------

export interface SkillEvidence {
  independent: number;
  assisted: number;
  failed: number;
  practiceCorrect: number;
  practiceTotal: number;
  lastEvidenceAt?: string | null;
}

export type SkillStatus = 'insufficient_evidence' | 'applying_independently' | 'developing' | 'needs_support' | 'review_due';

export function skillStatus(e: SkillEvidence, now = new Date()): SkillStatus {
  const evidence = e.independent + e.assisted + e.failed + e.practiceTotal;
  if (evidence < 3) return 'insufficient_evidence';
  const practiceOk = e.practiceTotal === 0 || e.practiceCorrect / e.practiceTotal >= 0.7;
  if (e.independent >= 2 && e.independent >= e.failed && practiceOk) {
    if (e.lastEvidenceAt && now.getTime() - new Date(e.lastEvidenceAt).getTime() > 21 * 86400000) return 'review_due';
    return 'applying_independently';
  }
  if (e.independent + e.assisted >= 1 || (e.practiceTotal > 0 && e.practiceCorrect / e.practiceTotal >= 0.5)) return 'developing';
  return 'needs_support';
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  insufficient_evidence: 'Not enough evidence yet',
  applying_independently: 'Applying independently',
  developing: 'Developing',
  needs_support: 'Needs more support',
  review_due: 'Review due',
};

export type RecommendationKind = 'remediate' | 'new_transfer' | 'advance' | 'break' | 'continue' | 'baseline';

/** Same decision rules as public.complete_session for lessons. */
export function lessonRecommendationKind(outcome: TransferOutcome, priorFailuresInSkill: number, independentInSkill: number): RecommendationKind {
  if (outcome === 'not_yet') return priorFailuresInSkill >= 1 ? 'break' : 'remediate';
  if (outcome === 'assisted') return 'new_transfer';
  return independentInSkill >= 2 ? 'advance' : 'new_transfer';
}

export const newEventId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
