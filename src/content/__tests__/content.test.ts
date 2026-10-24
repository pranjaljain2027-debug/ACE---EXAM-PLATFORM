import { describe, expect, it } from 'vitest';
import { ALL_CONTENT, BASELINE_ITEMS, LESSONS, PRACTICE_ITEMS, SKILLS, validateActivity } from '../index';
import { sceneSignature } from '../../engine/geometry';
import type { ItemActivity, LessonActivity } from '../types';

describe('content validation (publish gate)', () => {
  it('every published activity passes validation', () => {
    const problems = ALL_CONTENT.flatMap((a) => validateActivity(a).map((e) => `${a.id}: ${e}`));
    expect(problems).toEqual([]);
  });

  it('rejects unreviewed or invalid content', () => {
    const l = structuredClone(LESSONS[0]) as LessonActivity;
    l.reviewed_by = undefined;
    expect(validateActivity(l)).toContain('cannot_publish_unreviewed_content');
    const i = structuredClone(PRACTICE_ITEMS[0]) as ItemActivity;
    i.answer_key.item.correct = 'nope';
    expect(validateActivity(i)).toContain('item_key_not_in_options');
    const leak = structuredClone(PRACTICE_ITEMS[0]) as ItemActivity;
    (leak.payload.options[0] as unknown as Record<string, unknown>).isCorrect = true;
    expect(validateActivity(leak)).toContain('answers_leaked_into_public_payload');
  });

  it('public payloads carry no answers', () => {
    for (const a of ALL_CONTENT) expect(JSON.stringify(a.payload)).not.toMatch(/isCorrect|isKeyFactor/);
  });

  it('has enough original content for the seed set', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(12);
    expect(BASELINE_ITEMS.length).toBeGreaterThanOrEqual(8);
    expect(BASELINE_ITEMS.length).toBeLessThanOrEqual(12);
    expect(PRACTICE_ITEMS.length).toBeGreaterThanOrEqual(30);
    const types = new Set(PRACTICE_ITEMS.map((p) => p.activity_type));
    for (const t of ['matrix', 'analogy', 'classification', 'sequence']) expect(types).toContain(t);
  });

  it('every activity is tagged with assessment, domain, skill, difficulty and prerequisites', () => {
    const skillIds = new Set(SKILLS.map((s) => s.id));
    for (const a of ALL_CONTENT) {
      expect(a.assessment_tags.length).toBeGreaterThan(0);
      expect(skillIds.has(a.skill_id)).toBe(true);
      for (const p of a.prerequisites) expect(skillIds.has(p)).toBe(true);
      expect(a.difficulty.rule_count).toBeGreaterThan(0);
    }
  });

  it('every wrong option is tied to a named misconception', () => {
    for (const i of [...BASELINE_ITEMS, ...PRACTICE_ITEMS]) {
      const wrong = i.payload.options.filter((o) => o.id !== i.answer_key.item.correct);
      for (const w of wrong) expect(i.answer_key.item.misconceptions[w.id]).toBeTruthy();
    }
  });

  it('baseline and practice items do not reuse the same figures (transfer uses new configurations)', () => {
    const sig = (i: ItemActivity) => JSON.stringify(i.payload.stem) + i.payload.options.map((o) => sceneSignature(o.objects)).join('#');
    const base = new Set(BASELINE_ITEMS.map(sig));
    for (const p of PRACTICE_ITEMS) expect(base.has(sig(p))).toBe(false);
  });

  it('lesson transfer problems use a different configuration from the lesson itself', () => {
    for (const l of LESSONS) {
      const lessonFrames = JSON.stringify(l.payload.frames.map((f) => f.objects.map((o) => [o.shape, o.color])));
      const transferFrames = JSON.stringify(l.payload.transferChallenge.frames.map((f) => f.objects.map((o) => [o.shape, o.color])));
      expect(transferFrames).not.toEqual(lessonFrames);
    }
  });

  it('prerequisites form no cycles', () => {
    const graph = new Map(SKILLS.map((s) => [s.id, s.prerequisites]));
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string): void => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`cycle at ${id}`);
      visiting.add(id);
      for (const p of graph.get(id) ?? []) visit(p);
      visiting.delete(id);
      done.add(id);
    };
    for (const s of SKILLS) expect(() => visit(s.id)).not.toThrow();
  });
});
