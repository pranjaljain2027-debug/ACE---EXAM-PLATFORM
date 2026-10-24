import { describe, expect, it } from 'vitest';
import { buildSeedBatch } from '../bank/seed';
import { fingerprint, seriesTerms, solveBalance, validateBatch, validateQuestion } from '../bank/validate';
import { QUESTION_TYPES, ALL_TOPICS, TYPE_IDS } from '../bank/taxonomy';
import { rotate } from '../../engine/voxel';
import type { BankQuestion } from '../bank/schema';

const batch = buildSeedBatch();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const byId = (id: string) => clone(batch.find((q) => q.id === id)!);
const rules = (q: BankQuestion) => validateQuestion(q).issues.filter((i) => i.severity === 'error').map((i) => i.rule);

describe('taxonomy', () => {
  it('every topic points at real question types and every type has a 200 target', () => {
    for (const t of ALL_TOPICS) for (const ty of t.types) expect(TYPE_IDS.has(ty)).toBe(true);
    for (const t of QUESTION_TYPES) expect(t.target).toBe(200);
  });
});

describe('seed batch 001', () => {
  it('has 24 questions in the planned mix and all pass validation', () => {
    expect(batch).toHaveLength(24);
    const count = (p: string) => batch.filter((q) => q.question_type.startsWith(p)).length;
    expect(count('spatial_cube_rotation')).toBe(4);
    expect(count('spatial_viewpoint')).toBe(4);
    expect(count('spatial_plane_reflection')).toBe(4);
    expect(count('figure_matrix')).toBe(4);
    expect(count('number_')).toBe(4);
    expect(count('verbal_')).toBe(4);
    const r = validateBatch(batch);
    expect(r.batchIssues).toEqual([]);
    for (const rep of r.reports) expect(rep.issues.filter((i) => i.severity === 'error'), rep.question).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it('is deterministic', () => {
    expect(JSON.stringify(buildSeedBatch().map(fingerprint))).toBe(JSON.stringify(batch.map(fingerprint)));
  });
  it('labels authorship honestly and flags verbal items for semantic review', () => {
    for (const q of batch) expect(['deterministic_generator', 'ai_assisted_draft']).toContain(q.authoring.source);
    for (const q of batch.filter((x) => x.question_type.startsWith('verbal_'))) {
      expect(q.authoring.source).toBe('ai_assisted_draft');
      expect(validateQuestion(q).needs_semantic_review).toBe(true);
    }
  });
  it('spatial items are predict-first and have transfer targets', () => {
    for (const q of batch.filter((x) => x.question_type.startsWith('spatial_'))) {
      expect((q.payload as { interaction: { predict_first: boolean } }).interaction.predict_first).toBe(true);
      expect(q.transfer_target).toBeTruthy();
    }
  });
  it('the public payload never contains answer data', () => {
    for (const q of batch) expect(JSON.stringify(q.payload)).not.toMatch(/"(correct|rationales|distractor_kinds|solution)"/);
  });
});

describe('validator fails closed', () => {
  it('rejects a wrong answer key', () => {
    const q = byId('sp-rot-001');
    q.answer_key.correct = q.answer_key.correct === 'a' ? 'b' : 'a';
    expect(rules(q)).toContain('key_disagrees_with_computed_solution');
  });
  it('rejects two options that are the same shape moved somewhere else', () => {
    const q = byId('sp-ref-001');
    const opts = (q.payload as { options: { id: string; cells: number[][] }[] }).options;
    opts[1].cells = opts[0].cells.map(([x, y, z]) => [x + 2, y, z]);
    expect(rules(q).some((r) => r.startsWith('exactly_one_option') || r === 'equivalent_options')).toBe(true);
  });
  it('rejects a rotation that leaves the shape unchanged', () => {
    const q = byId('sp-rot-001');
    const p = q.payload as { source: { occupied_cells: [number, number, number][] }; options: { cells: unknown }[] };
    p.source.occupied_cells = [[0, 0, 0], [0, 1, 0], [0, 2, 0]];
    expect(rules(q)).toContain('shape_unchanged_by_this_rotation');
  });
  it('rejects a prompt that does not state the transformation', () => {
    const q = byId('sp-rot-002');
    (q.payload as { prompt: string }).prompt = 'Which shape do you get?';
    expect(rules(q)).toContain('prompt_must_state_the_transformation_verbatim');
  });
  it('rejects a wrong viewpoint key and a missing rationale', () => {
    const q = byId('sp-view-001');
    const wrong = ['a', 'b', 'c', 'd'].find((x) => x !== q.answer_key.correct)!;
    q.answer_key.correct = wrong;
    delete q.answer_key.rationales[wrong === 'a' ? 'b' : 'a'];
    const r = rules(q);
    expect(r).toContain('key_disagrees_with_computed_view');
    expect(r).toContain('rationale_required_for_every_option');
  });
  it('rejects three options, unknown topics and unsupported types', () => {
    const q = byId('qn-ser-001');
    (q.payload as { options: unknown[] }).options.pop();
    q.primary_topic = 'nope';
    expect(rules(q)).toEqual(expect.arrayContaining(['exactly_four_options', 'unknown_topic']));
    const q2 = byId('qn-ser-001');
    q2.question_type = 'paper_folding';
    expect(rules(q2)).toContain('question_type_not_supported_yet');
  });
  it('rejects a hint that gives the number away', () => {
    const q = byId('qn-ser-001');
    (q.payload as { hint: string }).hint = 'It is 19.';
    expect(rules(q)).toContain('hint_contains_answer');
  });
  it('rejects a number series that does not follow its stated rule', () => {
    const q = byId('qn-ser-001');
    (q.payload as { sequence: (number | null)[] }).sequence[2] = 12;
    expect(rules(q)).toContain('term_does_not_follow_rule');
  });
  it('rejects a balance puzzle with more than one possible answer', () => {
    const q = byId('qn-bal-001');
    (q.payload as { scales: unknown[] }).scales.splice(0, 1);
    expect(rules(q).some((r) => r.startsWith('answer_not_unique'))).toBe(true);
  });
  it('rejects answer data leaking into the public payload', () => {
    const q = byId('vb-ana-001');
    (q.payload as unknown as Record<string, unknown>).correct = 'b';
    expect(rules(q)).toContain('answer_data_in_public_payload');
  });
  it('rejects a figure matrix whose key disagrees with the rule', () => {
    const q = byId('fg-mtx-001');
    q.answer_key.correct = q.answer_key.correct === 'a' ? 'b' : 'a';
    expect(rules(q)).toContain('key_disagrees_with_rule');
  });
  it('batch: rejects duplicate id@version and existing versions, warns on near-duplicates', () => {
    const a = byId('vb-cls-001');
    const r = validateBatch([a, clone(a)], [{ id: 'vb-cls-001', version: 1 }]);
    expect(r.ok).toBe(false);
    expect(r.batchIssues.map((i) => i.rule)).toEqual(expect.arrayContaining([expect.stringMatching(/^duplicate_id_and_version_in_batch/), 'version_already_exists_create_a_new_version']));
    const b = clone(a);
    b.id = 'vb-cls-099';
    expect(validateBatch([a, b]).batchIssues.some((i) => i.rule === 'likely_duplicate_of_vb-cls-001')).toBe(true);
  });
});

describe('helpers', () => {
  it('series and balance solvers', () => {
    expect(seriesTerms({ kind: 'growing_add', first_step: 1, step_increase: 1 }, 1, 6)).toEqual([1, 2, 4, 7, 11, 16]);
    expect(seriesTerms({ kind: 'alternating_add', steps: [2, -1] }, 5, 5)).toEqual([5, 7, 6, 8, 7]);
    const sols = solveBalance({ schema_version: 1, family: 'number_puzzle', prompt: '', hint: '', scales: [{ left: { a: 1 }, right: { b: 2 } }], ask: { shape: 'a', in_terms_of: 'b' }, options: [], interaction: { predict_first: false } });
    expect(new Set(sols.map((s) => s.a / s.b))).toEqual(new Set([2]));
    expect(rotate([[0, 0, 0]], 'x', 1)).toEqual([[0, 0, 0]]);
  });
});
