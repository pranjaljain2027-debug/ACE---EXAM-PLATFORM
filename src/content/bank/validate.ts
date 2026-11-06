/**
 * Fail-closed validator for question-bank records (plan §18.4).
 * Structural checks for every type; deterministic recomputation for spatial, figural and quantitative
 * types; verbal items are flagged for mandatory human semantic review.
 */
import { gridKey, isAchiral, rotate, reflect, rotationInvariant, sameShape, shapeKey, validateGrid, validateShape, view, type Cell } from '../../engine/voxel';
import { visualSignature } from '../../engine/voxelRender';
import { sceneSignature } from '../../engine/geometry';
import { RULES } from '../figureRules';
import { ALL_TOPICS, QUESTION_TYPES, TOPIC_IDS } from './taxonomy';
import type { BankQuestion, GridOption, NumberPuzzlePayload, SeriesRule, TextOption, ValidationIssue, ValidationReport, VoxelOption } from './schema';

export const VALIDATOR_VERSION = 'bank-validator/1.0.0';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function seriesTerms(rule: SeriesRule, first: number, n: number): number[] {
  const out = [first];
  for (let i = 1; i < n; i++) {
    const prev = out[i - 1];
    if (rule.kind === 'arithmetic') out.push(prev + rule.step);
    else if (rule.kind === 'geometric') out.push(prev * rule.ratio);
    else if (rule.kind === 'alternating_add') out.push(prev + rule.steps[(i - 1) % rule.steps.length]);
    else out.push(prev + rule.first_step + (i - 1) * rule.step_increase);
  }
  return out;
}

/** Positive-integer assignments (1..12) that balance every scale. The asked ratio must be the same in all of them. */
export function solveBalance(p: NumberPuzzlePayload): Record<string, number>[] {
  const shapes = [...new Set(p.scales.flatMap((s) => [...Object.keys(s.left), ...Object.keys(s.right)]))].sort();
  const sols: Record<string, number>[] = [];
  const assign: Record<string, number> = {};
  const rec = (i: number) => {
    if (sols.length > 5000) return;
    if (i === shapes.length) {
      const ok = p.scales.every((s) => {
        const sum = (side: Record<string, number>) => Object.entries(side).reduce((t, [k, n]) => t + assign[k] * n, 0);
        return sum(s.left) === sum(s.right);
      });
      if (ok) sols.push({ ...assign });
      return;
    }
    for (let v = 1; v <= 12; v++) { assign[shapes[i]] = v; rec(i + 1); }
  };
  rec(0);
  return sols;
}

export function validateQuestion(q: BankQuestion): ValidationReport {
  const issues: ValidationIssue[] = [];
  const checks: string[] = [];
  const err = (path: string, rule: string) => issues.push({ question: q?.id ?? '?', path, rule, severity: 'error' });
  const warn = (path: string, rule: string) => issues.push({ question: q?.id ?? '?', path, rule, severity: 'warning' });
  let semantic = false;

  // ---------------------------------------------------------------- common
  if (!q || typeof q !== 'object') return { validator_version: VALIDATOR_VERSION, question: '?', version: 0, passed: false, checks, issues: [{ question: '?', path: '', rule: 'not_an_object', severity: 'error' }], needs_semantic_review: false };
  if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(q.id ?? '')) err('id', 'id_format');
  if (!Number.isInteger(q.version) || q.version < 1) err('version', 'version_positive_integer');
  const type = QUESTION_TYPES.find((t) => t.id === q.question_type);
  if (!type) err('question_type', 'unknown_question_type');
  else if (type.engine !== 'available') err('question_type', 'question_type_not_supported_yet');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untrusted input, each branch checks its own shape
  const p = q.payload as any;
  const k = q.answer_key;
  if (!p || typeof p !== 'object') { err('payload', 'missing'); return finish(); }
  if (!k || typeof k !== 'object') { err('answer_key', 'missing'); return finish(); }
  if (p.family !== q.question_type) err('payload.family', 'family_must_match_question_type');
  if (!q.title?.trim()) err('title', 'required');
  if (!p.prompt?.trim()) err('payload.prompt', 'required');
  if (!p.hint?.trim()) err('payload.hint', 'required');
  if (![1, 2, 3, 4, 5].includes(q.difficulty)) err('difficulty', 'range_1_5');
  if (type && !type.ageBands.includes(q.age_band)) err('age_band', 'not_supported_for_type');
  if (!['low', 'medium', 'high'].includes(q.reading_load)) err('reading_load', 'enum');
  if (!q.learning_objective?.trim()) err('learning_objective', 'required');
  if (!q.accessibility?.alt?.trim()) err('accessibility.alt', 'required');
  if (typeof q.accessibility?.relies_on_color !== 'boolean') err('accessibility.relies_on_color', 'required');
  if (q.accessibility?.relies_on_color) warn('accessibility.relies_on_color', 'question_relies_on_colour');
  if (!TOPIC_IDS.has(q.primary_topic)) err('primary_topic', 'unknown_topic');
  else if (!ALL_TOPICS.find((t) => t.id === q.primary_topic)!.types.includes(q.question_type)) err('primary_topic', 'topic_does_not_list_this_type');
  for (const [i, t] of (q.secondary_topics ?? []).entries()) if (!TOPIC_IDS.has(t)) err(`secondary_topics[${i}]`, 'unknown_topic');
  for (const [i, a] of (q.exam_alignment ?? []).entries()) {
    const topic = ALL_TOPICS.find((t) => t.id === a.topic);
    if (!topic || topic.pathId !== a.exam) err(`exam_alignment[${i}].topic`, 'topic_not_in_exam_path');
    else if (!topic.types.includes(q.question_type)) err(`exam_alignment[${i}].topic`, 'exam_topic_does_not_list_this_type');
    if (!a.rationale?.trim()) err(`exam_alignment[${i}].rationale`, 'required');
  }
  checks.push('metadata', 'taxonomy_references');

  const opts = (p.options ?? []) as { id: string }[];
  if (!Array.isArray(p.options) || opts.length !== 4) err('payload.options', 'exactly_four_options');
  const ids = opts.map((o) => o.id);
  if (new Set(ids).size !== ids.length || ids.some((x) => !x)) err('payload.options', 'option_ids_unique_nonempty');
  if (!ids.includes(k.correct)) err('answer_key.correct', 'not_an_option');
  for (const id of ids) {
    if (!k.rationales?.[id]?.trim()) err(`answer_key.rationales.${id}`, 'rationale_required_for_every_option');
    if (id !== k.correct && !k.distractor_kinds?.[id]?.trim()) err(`answer_key.distractor_kinds.${id}`, 'required_for_every_distractor');
  }
  if (!k.explanation?.summary?.trim() || !Array.isArray(k.explanation?.steps) || !k.explanation.steps.length) err('answer_key.explanation', 'summary_and_steps_required');
  if (/\b(answer|correct one) is\b|\boption [a-d]\b/i.test(p.hint ?? '')) err('payload.hint', 'hint_reveals_answer');
  if (JSON.stringify(p).match(/"(correct|is_correct|isCorrect|distractor_kinds|rationales)"/)) err('payload', 'answer_data_in_public_payload');
  checks.push('four_options', 'key_references_option', 'rationales', 'explanation', 'hint_no_leak');

  // ---------------------------------------------------------------- spatial
  if (q.question_type?.startsWith('spatial_')) {
    const src = p.source?.occupied_cells as Cell[];
    const se = validateShape(src);
    if (se.length) se.forEach((e) => err('payload.source', e));
    if (p.interaction?.predict_first !== true) err('payload.interaction', 'spatial_items_are_predict_first');
    const task = p.task;
    if (!task?.described_as?.trim() || !p.prompt?.includes(task.described_as)) err('payload.task.described_as', 'prompt_must_state_the_transformation_verbatim');
    if (!se.length && task) {
      let solutionCells: Cell[] | null = null;
      let solutionGrid: string[] | null = null;
      if (task.type === 'rotation') {
        if (!['x', 'y', 'z'].includes(task.axis) || !Number.isInteger(task.quarter_turns) || task.quarter_turns % 4 === 0 || Math.abs(task.quarter_turns) > 3) err('payload.task', 'rotation_task_invalid');
        else {
          solutionCells = rotate(src, task.axis, task.quarter_turns);
          if (rotationInvariant(src, task.axis, task.quarter_turns)) err('payload.source', 'shape_unchanged_by_this_rotation');
        }
      } else if (task.type === 'reflection') {
        solutionCells = reflect(src, task.plane_normal);
        if (sameShape(solutionCells, src)) err('payload.source', 'shape_symmetric_across_this_mirror');
        else if (isAchiral(src)) warn('payload.source', 'achiral_shape_mirror_image_is_also_a_turned_copy');
      } else if (task.type === 'viewpoint') {
        solutionGrid = view(src, task.side);
      } else err('payload.task', 'unknown_task');

      if (solutionCells) {
        const vo = p.options as VoxelOption[];
        const matches = vo.filter((o) => o.kind === 'voxel' && !validateShape(o.cells).length && sameShape(o.cells, solutionCells!));
        vo.forEach((o, i) => { if (o.kind !== 'voxel') err(`payload.options[${i}]`, 'expected_voxel_option'); else validateShape(o.cells).forEach((e) => err(`payload.options[${i}].cells`, e)); });
        if (matches.length !== 1) err('payload.options', `exactly_one_option_must_equal_the_solution (found ${matches.length})`);
        else if (matches[0].id !== k.correct) err('answer_key.correct', 'key_disagrees_with_computed_solution');
        if (new Set(vo.map((o) => shapeKey(o.cells ?? []))).size !== vo.length) err('payload.options', 'equivalent_options');
        const sigs = vo.map((o) => (o.cells ? visualSignature(o.cells) : ''));
        if (new Set(sigs).size !== sigs.length) err('payload.options', 'options_render_identically');
        if (k.solution?.cells && !sameShape(k.solution.cells, solutionCells)) err('answer_key.solution', 'stored_solution_disagrees');
        checks.push('geometry_recomputed', 'options_not_equivalent', 'options_visually_distinct');
      }
      if (solutionGrid) {
        const go = p.options as GridOption[];
        go.forEach((o, i) => { if (o.kind !== 'grid') err(`payload.options[${i}]`, 'expected_grid_option'); else validateGrid(o.grid).forEach((e) => err(`payload.options[${i}].grid`, e)); });
        const matches = go.filter((o) => o.grid && gridKey(o.grid) === gridKey(solutionGrid!));
        if (matches.length !== 1) err('payload.options', `exactly_one_option_must_equal_the_view (found ${matches.length})`);
        else if (matches[0].id !== k.correct) err('answer_key.correct', 'key_disagrees_with_computed_view');
        if (new Set(go.map((o) => gridKey(o.grid ?? []))).size !== go.length) err('payload.options', 'equivalent_options');
        if (k.solution?.grid && gridKey(k.solution.grid) !== gridKey(solutionGrid)) err('answer_key.solution', 'stored_solution_disagrees');
        checks.push('view_recomputed', 'options_not_equivalent');
      }
    }
  }

  // ---------------------------------------------------------------- number series
  if (q.question_type === 'number_series') {
    const seq: (number | null)[] = p.sequence ?? [];
    const gaps = seq.filter((x) => x === null).length;
    if (gaps !== 1) err('payload.sequence', 'exactly_one_missing_term');
    if (!k.rule) err('answer_key.rule', 'required');
    else if (typeof seq[0] !== 'number') err('payload.sequence', 'first_term_must_be_given');
    else {
      const terms = seriesTerms(k.rule, seq[0] as number, seq.length);
      seq.forEach((v, i) => { if (v !== null && v !== terms[i]) err(`payload.sequence[${i}]`, 'term_does_not_follow_rule'); });
      const missing = terms[seq.indexOf(null)];
      const to = p.options as TextOption[];
      const hits = to.filter((o) => Number(o.text) === missing);
      if (hits.length !== 1) err('payload.options', `exactly_one_option_must_equal_${missing}`);
      else if (hits[0].id !== k.correct) err('answer_key.correct', 'key_disagrees_with_rule');
      if (k.answer_value !== undefined && k.answer_value !== missing) err('answer_key.answer_value', 'disagrees_with_rule');
      if (new RegExp(`\\b${missing}\\b`).test(p.hint)) err('payload.hint', 'hint_contains_answer');
      checks.push('series_recomputed');
    }
  }

  // ---------------------------------------------------------------- balance puzzle
  if (q.question_type === 'number_puzzle') {
    const sols = solveBalance(p as NumberPuzzlePayload);
    const ask = p.ask;
    const values = new Set(sols.map((s) => (ask && s[ask.in_terms_of] ? s[ask.shape] / s[ask.in_terms_of] : NaN)));
    if (!sols.length) err('payload.scales', 'no_solution_in_1_to_12');
    else if (values.size !== 1) err('payload.ask', `answer_not_unique (${values.size} possible values)`);
    else {
      const value = [...values][0];
      if (!Number.isInteger(value)) err('payload.ask', 'answer_not_a_whole_number');
      const to = p.options as TextOption[];
      const hits = to.filter((o) => Number(o.text) === value);
      if (hits.length !== 1) err('payload.options', `exactly_one_option_must_equal_${value}`);
      else if (hits[0].id !== k.correct) err('answer_key.correct', 'key_disagrees_with_solution');
      if (k.answer_value !== undefined && k.answer_value !== value) err('answer_key.answer_value', 'disagrees_with_search');
      if (new RegExp(`\\b${value}\\b`).test(p.hint)) err('payload.hint', 'hint_contains_answer');
      checks.push('unique_answer_by_search');
    }
  }

  // ---------------------------------------------------------------- verbal
  if (q.question_type === 'verbal_analogy' || q.question_type === 'verbal_classification') {
    semantic = true;
    const to = p.options as TextOption[];
    if (new Set(to.map((o) => norm(o.text ?? ''))).size !== to.length || to.some((o) => !o.text?.trim())) err('payload.options', 'option_text_distinct_nonempty');
    if (q.question_type === 'verbal_analogy' && !(p.stem?.a && p.stem?.b && p.stem?.c)) err('payload.stem', 'analogy_needs_a_b_c');
    const correct = to.find((o) => o.id === k.correct);
    if (correct && norm(p.hint).includes(norm(correct.text))) err('payload.hint', 'hint_contains_answer');
    if (!k.semantic_relation?.trim()) err('answer_key.semantic_relation', 'required');
    checks.push('verbal_structure', 'needs_human_semantic_review');
  }

  // ---------------------------------------------------------------- figural
  if (['figure_matrix', 'figural_analogy', 'figural_series', 'figure_classification'].includes(q.question_type)) {
    const fo = p.options as unknown as { id: string; objects: Parameters<typeof sceneSignature>[0] }[];
    if (new Set(fo.map((o) => sceneSignature(o.objects ?? []))).size !== fo.length) err('payload.options', 'equivalent_options');
    const expectKind = { figure_matrix: 'matrix', figural_analogy: 'analogy', figural_series: 'sequence', figure_classification: 'classification' }[q.question_type as 'figure_matrix'];
    if (p.stem?.kind !== expectKind) err('payload.stem.kind', `expected_${expectKind}`);
    const ruleId = k.figure_rule;
    const rule = ruleId ? RULES[ruleId] : undefined;
    if (p.stem?.kind !== 'classification') {
      if (!rule) err('answer_key.figure_rule', 'required_for_recomputation');
      else {
        let expected = null as null | Parameters<typeof sceneSignature>[0];
        const s = p.stem;
        if (s.kind === 'analogy') expected = rule.f(s.c);
        if (s.kind === 'sequence') expected = rule.f(s.frames[s.frames.length - 2]!);
        if (s.kind === 'matrix') expected = rule.f(s.cells[s.cells.length - 2]!);
        const hits = fo.filter((o) => expected && sceneSignature(o.objects) === sceneSignature(expected));
        if (hits.length !== 1) err('payload.options', 'exactly_one_option_must_follow_the_rule');
        else if (hits[0].id !== k.correct) err('answer_key.correct', 'key_disagrees_with_rule');
        checks.push('figure_rule_recomputed');
      }
    } else semantic = true;
  }

  return finish();

  function finish(): ValidationReport {
    return {
      validator_version: VALIDATOR_VERSION,
      question: q?.id ?? '?',
      version: q?.version ?? 0,
      passed: !issues.some((i) => i.severity === 'error'),
      checks,
      issues,
      needs_semantic_review: semantic,
    };
  }
}

/** Batch-level checks: duplicates, references, likely near-duplicates. Never drops content silently. */
export function validateBatch(qs: BankQuestion[], existing: { id: string; version: number; fingerprint?: string }[] = []) {
  const reports = qs.map(validateQuestion);
  const batchIssues: ValidationIssue[] = [];
  const seen = new Map<string, number>();
  qs.forEach((q, i) => {
    const key = `${q.id}@${q.version}`;
    if (seen.has(key)) batchIssues.push({ question: q.id, path: `[${i}]`, rule: `duplicate_id_and_version_in_batch (also at [${seen.get(key)}])`, severity: 'error' });
    seen.set(key, i);
    if (existing.some((e) => e.id === q.id && e.version === q.version)) batchIssues.push({ question: q.id, path: `[${i}]`, rule: 'version_already_exists_create_a_new_version', severity: 'error' });
  });
  const fp = qs.map(fingerprint);
  fp.forEach((f, i) => {
    const j = fp.findIndex((g, jj) => jj !== i && g === f);
    if (j >= 0 && j < i && qs[i].id !== qs[j].id) batchIssues.push({ question: qs[i].id, path: `[${i}]`, rule: `likely_duplicate_of_${qs[j].id}`, severity: 'warning' });
    const ex = existing.find((e) => e.fingerprint === f && e.id !== qs[i].id);
    if (ex) batchIssues.push({ question: qs[i].id, path: `[${i}]`, rule: `likely_duplicate_of_existing_${ex.id}`, severity: 'warning' });
  });
  const ids = new Set([...qs.map((q) => q.id), ...existing.map((e) => e.id)]);
  qs.forEach((q, i) => { if (q.transfer_target && !ids.has(q.transfer_target)) batchIssues.push({ question: q.id, path: `[${i}].transfer_target`, rule: 'unknown_transfer_target', severity: 'error' }); });
  const ok = !batchIssues.some((x) => x.severity === 'error') && reports.every((r) => r.passed);
  return { ok, reports, batchIssues };
}

/** Content fingerprint for near-duplicate detection: prompt words plus option content, ids removed. */
export function fingerprint(q: BankQuestion): string {
  const p = q.payload as unknown as Record<string, unknown>;
  const strip = (v: unknown): unknown => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, strip(x)])) : v);
  return `${q.question_type}|${norm(String(p.prompt ?? ''))}|${JSON.stringify(strip({ ...p, prompt: undefined, hint: undefined, read_aloud: undefined }))}`;
}
