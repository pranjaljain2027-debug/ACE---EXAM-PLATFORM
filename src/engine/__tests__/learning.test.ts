import { describe, expect, it } from 'vitest';
import {
  canTransition,
  hintAllowed,
  lessonRecommendationKind,
  recordAttempt,
  recordHint,
  skillStatus,
  transferOutcome,
  transition,
  type LessonProgress,
} from '../learning';

const fresh = (): LessonProgress => ({ state: 'OBSERVE', attempts: [], hintLevels: {} });
let n = 0;
const eid = () => `evt-${++n}`;

function toApply(p = fresh(), discoverHint = false): LessonProgress {
  p = recordAttempt(p, { stage: 'observe', answer: ['x'], isCorrect: true, clientEventId: eid() }).progress;
  p = transition(p, 'EXPERIMENT');
  p = transition(p, 'DISCOVER');
  if (discoverHint) p = recordHint(p, 'discover', 1);
  p = recordAttempt(p, { stage: 'discover', answer: 'r1', isCorrect: true, clientEventId: eid() }).progress;
  return transition(p, 'APPLY');
}

describe('state machine', () => {
  it('follows OBSERVE -> EXPERIMENT -> DISCOVER -> APPLY -> REFLECT -> COMPLETE', () => {
    let p = toApply();
    p = recordAttempt(p, { stage: 'apply', answer: 'a', isCorrect: true, clientEventId: eid() }).progress;
    p = transition(p, 'REFLECT');
    p = transition(p, 'COMPLETE');
    expect(p.state).toBe('COMPLETE');
  });

  it('cannot skip observing or discovering', () => {
    expect(canTransition(fresh(), 'EXPERIMENT')).toBe(false);
    let p = recordAttempt(fresh(), { stage: 'observe', answer: [], isCorrect: false, clientEventId: eid() }).progress;
    p = transition(transition(p, 'EXPERIMENT'), 'DISCOVER');
    expect(canTransition(p, 'APPLY')).toBe(false);
    expect(() => transition(p, 'REFLECT')).toThrow(/invalid_transition/);
  });

  it('allows the DISCOVER -> EXPERIMENT retry loop and APPLY -> REMEDIATION -> APPLY', () => {
    let p = recordAttempt(fresh(), { stage: 'observe', answer: [], isCorrect: true, clientEventId: eid() }).progress;
    p = transition(transition(p, 'EXPERIMENT'), 'DISCOVER');
    expect(canTransition(p, 'EXPERIMENT')).toBe(true);
    let q = toApply();
    expect(canTransition(q, 'REMEDIATION')).toBe(false); // only after a wrong first attempt
    q = recordAttempt(q, { stage: 'apply', answer: 'b', isCorrect: false, clientEventId: eid() }).progress;
    q = transition(q, 'REMEDIATION');
    q = transition(q, 'APPLY');
    expect(q.state).toBe('APPLY');
  });
});

describe('hint accounting', () => {
  it('hints are progressive (1 then 2 then 3)', () => {
    let p = toApply();
    p = { ...p, state: 'DISCOVER' };
    expect(hintAllowed(p, 'discover', 2).ok).toBe(false);
    p = recordHint(p, 'discover', 1);
    expect(hintAllowed(p, 'discover', 2).ok).toBe(true);
  });

  it('no hints before the first transfer attempt', () => {
    const p = toApply();
    expect(hintAllowed(p, 'apply', 1)).toEqual({ ok: false, reason: 'no_hints_before_first_transfer_attempt' });
  });

  it('correct after a hint is stored as assisted, never independent', () => {
    let p = toApply();
    p = recordAttempt(p, { stage: 'apply', answer: 'b', isCorrect: false, clientEventId: eid() }).progress;
    p = transition(p, 'REMEDIATION');
    p = recordHint(p, 'apply', 1);
    p = transition(p, 'APPLY');
    const r = recordAttempt(p, { stage: 'apply', answer: 'a', isCorrect: true, clientEventId: eid() });
    expect(r.attempt.assisted).toBe(true);
    expect(r.attempt.hintLevel).toBe(1);
    expect(transferOutcome(r.progress)).toBe('assisted');
  });

  it('a hint during discovery does not taint an independent transfer', () => {
    let p = toApply(fresh(), true);
    p = recordAttempt(p, { stage: 'apply', answer: 'a', isCorrect: true, clientEventId: eid() }).progress;
    expect(transferOutcome(p)).toBe('independent');
  });

  it('a second unaided try is still assisted (only the first attempt is independent evidence)', () => {
    let p = toApply();
    p = recordAttempt(p, { stage: 'apply', answer: 'b', isCorrect: false, clientEventId: eid() }).progress;
    p = recordAttempt(p, { stage: 'apply', answer: 'a', isCorrect: true, clientEventId: eid() }).progress;
    expect(transferOutcome(p)).toBe('assisted');
  });
});

describe('reconnect safety', () => {
  it('replaying the same event id does not add a second attempt', () => {
    let p = toApply();
    const id = eid();
    p = recordAttempt(p, { stage: 'apply', answer: 'b', isCorrect: false, clientEventId: id }).progress;
    const again = recordAttempt(p, { stage: 'apply', answer: 'a', isCorrect: true, clientEventId: id });
    expect(again.duplicate).toBe(true);
    expect(again.progress.attempts.filter((a) => a.stage === 'apply')).toHaveLength(1);
    expect(transferOutcome(again.progress)).toBe('not_yet');
  });
});

describe('skill status and recommendations', () => {
  it('never decides from a single question', () => {
    expect(skillStatus({ independent: 1, assisted: 0, failed: 0, practiceCorrect: 0, practiceTotal: 0 })).toBe('insufficient_evidence');
    expect(skillStatus({ independent: 2, assisted: 0, failed: 0, practiceCorrect: 0, practiceTotal: 0 })).toBe('insufficient_evidence');
  });

  it('applying independently needs repeated independent transfer', () => {
    expect(skillStatus({ independent: 2, assisted: 1, failed: 0, practiceCorrect: 0, practiceTotal: 0 })).toBe('applying_independently');
    expect(skillStatus({ independent: 0, assisted: 3, failed: 0, practiceCorrect: 0, practiceTotal: 0 })).toBe('developing');
    expect(skillStatus({ independent: 0, assisted: 0, failed: 3, practiceCorrect: 0, practiceTotal: 0 })).toBe('needs_support');
  });

  it('flags review when independent evidence is old', () => {
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    expect(skillStatus({ independent: 3, assisted: 0, failed: 0, practiceCorrect: 0, practiceTotal: 0, lastEvidenceAt: old })).toBe('review_due');
  });

  it('maps outcomes to the PRD adaptive rules', () => {
    expect(lessonRecommendationKind('not_yet', 0, 0)).toBe('remediate');
    expect(lessonRecommendationKind('not_yet', 1, 0)).toBe('break'); // repeated struggle
    expect(lessonRecommendationKind('assisted', 0, 0)).toBe('new_transfer');
    expect(lessonRecommendationKind('independent', 0, 1)).toBe('new_transfer');
    expect(lessonRecommendationKind('independent', 0, 2)).toBe('advance');
  });
});
