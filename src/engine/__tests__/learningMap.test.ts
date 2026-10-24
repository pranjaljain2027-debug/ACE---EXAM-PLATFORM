import { describe, expect, it } from 'vitest';
import { buildLearningMap, pickMission } from '../learningMap';
import { LESSONS } from '../../content/lessons';

const lessons = LESSONS.map((l) => ({ id: l.id, skill_id: l.skill_id, domain: l.domain, prerequisites: l.prerequisites }));
const base = { lessons, completed: [] as string[], independent: [] as string[], openLessonIds: [] as string[], recommendedId: null as string | null };

describe('learning map', () => {
  it('starts with entry lessons available and dependent lessons locked', () => {
    const m = buildLearningMap(base);
    expect(m['rot-101'].state).toBe('available');
    expect(m['rot-102'].state).toBe('locked');
    expect(m['rot-102'].missing).toContain('rot-quarter-cw');
  });

  it('unlocks by prerequisite skill and keeps completed lessons revisitable', () => {
    const m = buildLearningMap({ ...base, completed: ['rot-101'], independent: [] });
    expect(m['rot-102'].state).toBe('available');
    expect(m['rot-101'].state).toBe('review');
    const m2 = buildLearningMap({ ...base, completed: ['rot-101'], independent: ['rot-101'] });
    expect(m2['rot-101'].state).toBe('mastered');
  });

  it('marks the recommended and in-progress lessons', () => {
    const m = buildLearningMap({ ...base, recommendedId: 'ref-101', openLessonIds: ['prog-101'] });
    expect(m['ref-101'].state).toBe('recommended');
    expect(m['prog-101'].state).toBe('in_progress');
  });

  it('one mission: baseline first, then resume, then recommendation', () => {
    expect(pickMission({ ...base, baselineDone: false, openBaseline: false }).kind).toBe('baseline');
    expect(pickMission({ ...base, baselineDone: true, openBaseline: false, openLessonIds: ['ref-101'] })).toEqual({ kind: 'resume', id: 'ref-101' });
    expect(pickMission({ ...base, baselineDone: true, openBaseline: false, recommendedId: 'pr-rot-01' })).toEqual({ kind: 'practice', id: 'pr-rot-01' });
    expect(pickMission({ ...base, baselineDone: true, openBaseline: false }).kind).toBe('lesson');
  });
});
