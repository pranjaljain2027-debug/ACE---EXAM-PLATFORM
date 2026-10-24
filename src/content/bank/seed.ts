/**
 * Seed batch 001: 24 original questions (plan §20 first slice).
 * Spatial, figural and number items are produced by deterministic generators, so the correct answer is
 * computed from geometry or arithmetic, never typed by hand. Verbal items are AI-assisted drafts and
 * require human semantic review. Every item is imported as `review_required`; none is published until
 * a named human reviewer approves it in /staff.
 */
import { gridKey, flipGridVertical, mirrorGrid, reflect, rotate, shapeKey, view, type Axis, type Cell, type Side } from '../../engine/voxel';
import { visualSignature } from '../../engine/voxelRender';
import { FIGURE_BUILDERS, MISCONCEPTION_TEXT, RULES, COLORS } from '../items';
import type { BankQuestion, GridOption, SeriesRule, SpatialTask, TextOption, VoxelOption } from './schema';

export const BATCH_ID = 'seed-batch-001';
const LETTERS = ['a', 'b', 'c', 'd'];
const GEN = { source: 'deterministic_generator' as const, author: 'heir-bank-generator/1', notes: 'Parameters chosen in an AI-assisted authoring session. Answer computed by the generator. Needs human review before publishing.' };
const DRAFT = { source: 'ai_assisted_draft' as const, author: 'heir-bank-drafts/1', notes: 'AI-assisted draft. Wording, vocabulary level and the single-answer claim need human semantic review.' };

// Deterministic order shuffle (same as items.ts) so the correct letter varies.
function shuffle<T>(xs: T[], seed: string): T[] {
  let a = [...seed].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

interface Cand<T> { value: T; kind: string; why: string }

function letterOptions<T>(id: string, correct: T, correctWhy: string, cands: Cand<T>[], key: (v: T) => string, look?: (v: T) => string) {
  const seen = new Set([key(correct)]);
  const looks = new Set(look ? [look(correct)] : []);
  const picked: Cand<T>[] = [];
  for (const c of cands) {
    if (seen.has(key(c.value)) || (look && looks.has(look(c.value)))) continue;
    seen.add(key(c.value));
    if (look) looks.add(look(c.value));
    picked.push(c);
    if (picked.length === 3) break;
  }
  if (picked.length !== 3) throw new Error(`${id}: only ${picked.length} distinct distractors`);
  const all = shuffle([{ value: correct, kind: '', why: correctWhy }, ...picked], id);
  const opts = all.map((x, i) => ({ id: LETTERS[i], ...x }));
  const correctId = opts.find((x) => x.kind === '')!.id;
  return {
    opts,
    correct: correctId,
    rationales: Object.fromEntries(opts.map((x) => [x.id, x.why])),
    distractor_kinds: Object.fromEntries(opts.filter((x) => x.kind).map((x) => [x.id, x.kind])),
  };
}

// ---------------------------------------------------------------------------
// Spatial
// ---------------------------------------------------------------------------

const SHAPES: Record<string, Cell[]> = {
  screw: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  hook: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1]],
  zig: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]],
  chair: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [2, 0, 1]],
  step: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 0, 1], [0, 0, 2]],
  tower: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, -1]],
};

const TURN_WORDS: Record<string, string> = {
  'y:1': 'a quarter turn around the up-and-down pole, so the side facing you swings to your right',
  'y:-1': 'a quarter turn around the up-and-down pole, so the side facing you swings to your left',
  'x:1': 'a quarter turn around the left-to-right pole, so the top tips toward you',
  'x:-1': 'a quarter turn around the left-to-right pole, so the top tips away from you',
  'z:1': 'a quarter turn counterclockwise, as you look at it, like a steering wheel turning left',
  'z:-1': 'a quarter turn clockwise, as you look at it, like a steering wheel turning right',
};
const MIRROR_WORDS: Record<Axis, string> = {
  x: 'a mirror standing just to its right, so left and right swap',
  y: 'a mirror lying flat on the table under it, so top and bottom swap',
  z: 'a mirror standing just behind it, so front and back swap',
};
const VIEW_WORDS: Record<Side, string> = {
  front: 'from the front, the way it is drawn',
  back: 'from the back, after walking around behind it',
  right: 'from its right side, so the back of the shape is on your right',
  left: 'from its left side, so the back of the shape is on your left',
  top: 'from straight above, so the back of the shape is at the top of the picture',
  bottom: 'from straight below, so the front of the shape is at the top of the picture',
};

const otherAxes = (a: Axis) => (['x', 'y', 'z'] as Axis[]).filter((x) => x !== a);
const spatialMeta = (topic: string, nnatTopic: string, age: string, diff: 1 | 2 | 3 | 4 | 5) => ({
  primary_topic: topic,
  secondary_topics: [nnatTopic],
  exam_alignment: [{ exam: 'nnat' as const, topic: nnatTopic, rationale: 'Original practice for the publicly described spatial visualization skill. Not affiliated with the test publisher.' }],
  age_band: age,
  reading_load: 'medium' as const,
  difficulty: diff,
  language: 'en-US' as const,
});

function rotationItem(n: number, shape: string, axis: Axis, turns: 1 | -1, age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `sp-rot-${String(n).padStart(3, '0')}`;
  const src = SHAPES[shape];
  const sol = rotate(src, axis, turns);
  const said = TURN_WORDS[`${axis}:${turns}`];
  const [o1, o2] = otherAxes(axis);
  const cands: Cand<Cell[]>[] = [
    { value: rotate(src, axis, -turns), kind: 'wrong_direction', why: 'This is the same turn, but the other way.' },
    { value: reflect(sol, axis === 'x' ? 'y' : 'x'), kind: 'mirror_image', why: 'This is a mirror image. Turning never makes a mirror image.' },
    { value: rotate(src, o1, turns), kind: 'wrong_axis', why: 'This turned around a different pole.' },
    { value: rotate(src, axis, 2), kind: 'wrong_step_size', why: 'This turned twice as far, a half turn.' },
    { value: rotate(src, o2, turns), kind: 'wrong_axis', why: 'This turned around a different pole.' },
    { value: src, kind: 'no_change_applied', why: 'This is the shape before it turned.' },
  ];
  const L = letterOptions(id, sol, 'Yes. This is the shape after exactly that quarter turn.', cands, shapeKey, (c) => visualSignature(c));
  const task: SpatialTask = { type: 'rotation', axis, quarter_turns: turns, described_as: said };
  return {
    id, version: 1, question_type: 'spatial_cube_rotation', title: `Cube turn ${n}`,
    ...spatialMeta('gen-3d-rotation', 'nnat-spatial', age, diff),
    learning_objective: 'Predict how a connected-cube shape looks after a stated quarter turn, and tell a turn apart from a mirror image.',
    accessibility: { relies_on_color: false, alt: `A shape made of ${src.length} cubes. Which shape shows it after ${said}?`, notes: 'Rotate buttons and keyboard controls are available after the first answer.' },
    transfer_target: `sp-rot-${String((n % 4) + 1).padStart(3, '0')}`,
    payload: {
      schema_version: 1, family: 'spatial_cube_rotation',
      prompt: `Imagine giving this shape ${said}. Which shape do you get?`,
      read_aloud: `Imagine giving this shape ${said}. Which of the four shapes do you get?`,
      hint: 'Pick one cube at the end of the shape and follow only that cube through the turn.',
      source: { geometry_type: 'voxel_shape', coordinate_system: 'right_handed_y_up', occupied_cells: src },
      task,
      options: L.opts.map((x): VoxelOption => ({ id: x.id, kind: 'voxel', cells: x.value })),
      interaction: { predict_first: true, exploration: 'after_prediction' },
    },
    answer_key: {
      correct: L.correct,
      explanation: { summary: `The whole shape makes ${said}. Every cube moves together, and the shape is never flipped.`, steps: ['Find the cube at one end of the shape.', 'Picture where that cube goes during the turn.', 'Check that the rest of the shape follows it without flipping.'] },
      rationales: L.rationales, distractor_kinds: L.distractor_kinds, solution: { cells: sol },
    },
    authoring: GEN,
  };
}

function reflectionItem(n: number, shape: string, normal: Axis, age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `sp-ref-${String(n).padStart(3, '0')}`;
  const src = SHAPES[shape];
  const sol = reflect(src, normal);
  const said = MIRROR_WORDS[normal];
  const [o1, o2] = otherAxes(normal);
  const cands: Cand<Cell[]>[] = [
    { value: rotate(src, o1, 2), kind: 'turned_instead_of_flipped', why: 'This one was turned around, not reflected.' },
    { value: reflect(src, o1), kind: 'wrong_mirror_axis', why: 'This is what a mirror in a different place would show.' },
    { value: src, kind: 'no_change_applied', why: 'This is the shape itself. A mirror shows it reversed.' },
    { value: reflect(src, o2), kind: 'wrong_mirror_axis', why: 'This is what a mirror in a different place would show.' },
    { value: rotate(src, normal, 2), kind: 'turned_instead_of_flipped', why: 'This one was turned around, not reflected.' },
  ];
  const L = letterOptions(id, sol, 'Yes. Each cube is the same distance from the mirror, on the other side.', cands, shapeKey, (c) => visualSignature(c));
  return {
    id, version: 1, question_type: 'spatial_plane_reflection', title: `Cube mirror ${n}`,
    ...spatialMeta('gen-mirrors', 'nnat-spatial', age, diff),
    learning_objective: 'Predict the mirror image of a cube shape across a stated plane, and tell it apart from a turned copy.',
    accessibility: { relies_on_color: false, alt: `A shape made of ${src.length} cubes and ${said}. Which shape is its reflection?` },
    transfer_target: `sp-ref-${String((n % 4) + 1).padStart(3, '0')}`,
    payload: {
      schema_version: 1, family: 'spatial_plane_reflection',
      prompt: `Picture ${said}. Which shape is the reflection in the mirror?`,
      read_aloud: `Picture ${said}. Which of the four shapes is the reflection?`,
      hint: 'Cubes close to the mirror stay close to it. Cubes far from the mirror stay far away.',
      source: { geometry_type: 'voxel_shape', coordinate_system: 'right_handed_y_up', occupied_cells: src },
      task: { type: 'reflection', plane_normal: normal, described_as: said },
      options: L.opts.map((x): VoxelOption => ({ id: x.id, kind: 'voxel', cells: x.value })),
      interaction: { predict_first: true, exploration: 'after_prediction' },
    },
    answer_key: {
      correct: L.correct,
      explanation: { summary: `With ${said}, each cube lands the same distance away on the other side of the mirror.`, steps: ['Find the cube nearest the mirror.', 'Keep its distance to the mirror but put it on the other side.', 'Do the same for the cubes further away.'] },
      rationales: L.rationales, distractor_kinds: L.distractor_kinds, solution: { cells: sol },
    },
    authoring: GEN,
  };
}

function viewItem(n: number, shape: string, side: Side, age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `sp-view-${String(n).padStart(3, '0')}`;
  const src = SHAPES[shape];
  const sol = view(src, side);
  const said = VIEW_WORDS[side];
  const others: Side[] = (['front', 'top', 'right', 'left', 'back', 'bottom'] as Side[]).filter((s) => s !== side);
  const cands: Cand<string[]>[] = [
    { value: mirrorGrid(sol), kind: 'mirrored_view', why: 'This is the right view, but flipped left to right.' },
    ...others.map((s) => ({ value: view(src, s), kind: 'wrong_side', why: `This is what you see ${VIEW_WORDS[s].split(',')[0]}.` })),
    { value: flipGridVertical(sol), kind: 'upside_down_view', why: 'This is the right view, but upside down.' },
  ];
  const L = letterOptions(id, sol, `Yes. This is exactly what you see ${said.split(',')[0]}.`, cands, gridKey);
  return {
    id, version: 1, question_type: 'spatial_viewpoint', title: `Cube view ${n}`,
    ...spatialMeta('gen-viewpoints', 'nnat-spatial', age, diff),
    learning_objective: 'Picture a cube structure from a stated side and pick its flat view.',
    accessibility: { relies_on_color: false, alt: `A shape made of ${src.length} cubes. Which flat picture shows it ${said}?` },
    transfer_target: `sp-view-${String((n % 4) + 1).padStart(3, '0')}`,
    payload: {
      schema_version: 1, family: 'spatial_viewpoint',
      prompt: `Look at the shape ${said}. Which picture shows what you see?`,
      read_aloud: `Look at the shape ${said}. Which flat picture shows what you see?`,
      hint: 'Imagine standing where the viewer stands. Which cubes are closest to you, and which are hidden behind them?',
      source: { geometry_type: 'voxel_shape', coordinate_system: 'right_handed_y_up', occupied_cells: src },
      task: { type: 'viewpoint', side, described_as: said },
      options: L.opts.map((x): GridOption => ({ id: x.id, kind: 'grid', grid: x.value })),
      interaction: { predict_first: true, exploration: 'after_prediction' },
    },
    answer_key: {
      correct: L.correct,
      explanation: { summary: `Seen ${said.split(',')[0]}, every column of cubes becomes one filled square. Cubes behind others are hidden.`, steps: ['Stand where the viewer stands.', 'For each spot, ask whether any cube is in that line of sight.', 'Keep left and right as the viewer sees them.'] },
      rationales: L.rationales, distractor_kinds: L.distractor_kinds, solution: { grid: sol },
    },
    authoring: GEN,
  };
}

// ---------------------------------------------------------------------------
// Figure matrices (reuse the 2D generators)
// ---------------------------------------------------------------------------

function matrixItem(n: number, ruleId: keyof typeof RULES, build: () => ReturnType<typeof FIGURE_BUILDERS.matrix2>, age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `fg-mtx-${String(n).padStart(3, '0')}`;
  const rule = RULES[ruleId];
  const b = build();
  const raw = FIGURE_BUILDERS.pickOptions(id, b.correct, b.wrong);
  if (raw.length !== 4) throw new Error(`${id}: needs 4 options`);
  const opts = raw.map((x, i) => ({ ...x, id: LETTERS[i] }));
  const correct = opts.find((x) => x.tag === '')!;
  return {
    id, version: 1, question_type: 'figure_matrix', title: `Picture grid ${n}`,
    primary_topic: 'gen-matrices',
    secondary_topics: ['cogat-figure-matrices', 'olsat-matrices', 'nnat-analogy'],
    exam_alignment: [
      { exam: 'cogat', topic: 'cogat-figure-matrices', rationale: 'Original figure matrix. Not affiliated with the test publisher.' },
      { exam: 'olsat', topic: 'olsat-matrices', rationale: 'Original pattern matrix. Not affiliated with the test publisher.' },
      { exam: 'nnat', topic: 'nnat-analogy', rationale: 'Original reasoning-by-analogy grid. Not affiliated with the test publisher.' },
    ],
    age_band: age, reading_load: 'low', difficulty: diff, language: 'en-US',
    learning_objective: `Find the rule across each row and apply it: ${rule.says}`,
    accessibility: { relies_on_color: false, alt: `A grid of pictures with one missing. ${rule.says}` },
    payload: {
      schema_version: 1, family: 'figure_matrix',
      prompt: 'Which picture completes the grid?',
      read_aloud: 'Look across each row. Which picture belongs in the empty square?',
      hint: 'Look at the first row. What changed from the first picture to the next?',
      stem: b.stem,
      options: opts.map((x) => ({ id: x.id, objects: x.objects })),
      interaction: { predict_first: false },
    },
    answer_key: {
      correct: correct.id,
      explanation: { summary: rule.says, steps: ['Look at how the first row changes.', 'Check the same change happens in every row.', 'Apply it to the last picture in the bottom row.'] },
      rationales: Object.fromEntries(opts.map((x) => [x.id, x.tag ? MISCONCEPTION_TEXT[x.tag] : `Yes. ${rule.says}`])),
      distractor_kinds: Object.fromEntries(opts.filter((x) => x.tag).map((x) => [x.id, x.tag])),
      figure_rule: rule.id,
    },
    authoring: GEN,
  };
}

// ---------------------------------------------------------------------------
// Quantitative
// ---------------------------------------------------------------------------

function seriesItem(n: number, terms: number[], rule: SeriesRule, wrong: Cand<number>[], said: string, age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `qn-ser-${String(n).padStart(3, '0')}`;
  const answer = terms[terms.length - 1];
  const L = letterOptions(id, answer, `Yes. ${said}`, wrong, String);
  return {
    id, version: 1, question_type: 'number_series', title: `Number pattern ${n}`,
    primary_topic: 'gen-number-series', secondary_topics: ['cogat-number-series', 'olsat-number'],
    exam_alignment: [
      { exam: 'cogat', topic: 'cogat-number-series', rationale: 'Original number series. Not affiliated with the test publisher.' },
      { exam: 'olsat', topic: 'olsat-number', rationale: 'Original number relationship item. Not affiliated with the test publisher.' },
    ],
    age_band: age, reading_load: 'low', difficulty: diff, language: 'en-US',
    learning_objective: 'Find the rule that links each number to the next, then use it.',
    accessibility: { relies_on_color: false, alt: `The numbers ${terms.slice(0, -1).join(', ')}, then a blank. Which number comes next?` },
    payload: {
      schema_version: 1, family: 'number_series',
      prompt: 'Which number comes next?',
      read_aloud: `Here are some numbers: ${terms.slice(0, -1).join(', ')}. Which number comes next?`,
      hint: 'Work out how much each number changes to get to the next one.',
      sequence: [...terms.slice(0, -1), null],
      options: L.opts.map((x): TextOption => ({ id: x.id, text: String(x.value) })),
      interaction: { predict_first: false },
    },
    answer_key: {
      correct: L.correct,
      explanation: { summary: said, steps: ['Write down the change between each pair of numbers.', 'Find the pattern in those changes.', 'Use it once more on the last number.'] },
      rationales: L.rationales, distractor_kinds: L.distractor_kinds, rule, answer_value: answer,
    },
    authoring: GEN,
  };
}

function balanceItem(n: number, scales: { left: Record<string, number>; right: Record<string, number> }[], ask: { shape: string; in_terms_of: string }, answer: number, wrong: Cand<number>[], said: string, steps: string[], age: string, diff: 1 | 2 | 3 | 4 | 5): BankQuestion {
  const id = `qn-bal-${String(n).padStart(3, '0')}`;
  const L = letterOptions(id, answer, `Yes. ${said}`, wrong, String);
  const words = (side: Record<string, number>) => Object.entries(side).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(' and ');
  return {
    id, version: 1, question_type: 'number_puzzle', title: `Balance puzzle ${n}`,
    primary_topic: 'gen-balance', secondary_topics: ['cogat-number-puzzles', 'olsat-number'],
    exam_alignment: [
      { exam: 'cogat', topic: 'cogat-number-puzzles', rationale: 'Original balance puzzle. Not affiliated with the test publisher.' },
      { exam: 'olsat', topic: 'olsat-number', rationale: 'Original number puzzle. Not affiliated with the test publisher.' },
    ],
    age_band: age, reading_load: 'medium', difficulty: diff, language: 'en-US',
    learning_objective: 'Use balanced scales to swap equal amounts and find an unknown.',
    accessibility: { relies_on_color: false, alt: scales.map((s) => `${words(s.left)} balance ${words(s.right)}.`).join(' ') + ` How many ${ask.in_terms_of}s balance 1 ${ask.shape}?` },
    payload: {
      schema_version: 1, family: 'number_puzzle',
      prompt: `How many ${ask.in_terms_of}s balance 1 ${ask.shape}?`,
      read_aloud: scales.map((s) => `${words(s.left)} balance ${words(s.right)}.`).join(' ') + ` How many ${ask.in_terms_of}s balance 1 ${ask.shape}?`,
      hint: 'If two things balance, you can swap one for the other on any scale.',
      scales, ask,
      options: L.opts.map((x): TextOption => ({ id: x.id, text: String(x.value) })),
      interaction: { predict_first: false },
    },
    answer_key: { correct: L.correct, explanation: { summary: said, steps }, rationales: L.rationales, distractor_kinds: L.distractor_kinds, answer_value: answer },
    authoring: GEN,
  };
}

// ---------------------------------------------------------------------------
// Verbal (AI-assisted drafts, need semantic review)
// ---------------------------------------------------------------------------

function verbalAnalogy(n: number, a: string, b: string, c: string, answer: string, relation: string, wrong: Cand<string>[], age: string, diff: 1 | 2 | 3): BankQuestion {
  const id = `vb-ana-${String(n).padStart(3, '0')}`;
  const L = letterOptions(id, answer, `Yes. ${relation}`, wrong, (s) => s.toLowerCase());
  return {
    id, version: 1, question_type: 'verbal_analogy', title: `Word pair ${n}`,
    primary_topic: 'gen-word-analogies', secondary_topics: ['cogat-verbal-analogies', 'olsat-verbal-analogies'],
    exam_alignment: [
      { exam: 'cogat', topic: 'cogat-verbal-analogies', rationale: 'Original word analogy. Not affiliated with the test publisher.' },
      { exam: 'olsat', topic: 'olsat-verbal-analogies', rationale: 'Original verbal analogy. Not affiliated with the test publisher.' },
    ],
    age_band: age, reading_load: 'medium', difficulty: diff, language: 'en-US',
    learning_objective: 'Name how the first two words are linked, then find a word linked to the third in the same way.',
    accessibility: { relies_on_color: false, alt: `${a} is to ${b} as ${c} is to what?` },
    payload: {
      schema_version: 1, family: 'verbal_analogy',
      prompt: `${a} is to ${b} as ${c} is to ...?`,
      read_aloud: `${a} goes with ${b}. ${c} goes with which word, in the same way?`,
      hint: `Say a sentence that links ${a.toLowerCase()} and ${b.toLowerCase()}. Then use the same sentence for ${c.toLowerCase()}.`,
      stem: { a, b, c },
      options: L.opts.map((x): TextOption => ({ id: x.id, text: x.value })),
      interaction: { predict_first: false },
    },
    answer_key: { correct: L.correct, explanation: { summary: relation, steps: [`Make a sentence about ${a.toLowerCase()} and ${b.toLowerCase()}.`, `Try the same sentence with ${c.toLowerCase()} and each choice.`, 'Keep the choice where the sentence still works.'] }, rationales: L.rationales, distractor_kinds: L.distractor_kinds, semantic_relation: relation },
    authoring: DRAFT,
  };
}

function verbalOdd(n: number, words: string[], odd: string, relation: string, rationales: Record<string, string>, age: string, diff: 1 | 2 | 3): BankQuestion {
  const id = `vb-cls-${String(n).padStart(3, '0')}`;
  const order = shuffle(words, id);
  const opts = order.map((w, i) => ({ id: LETTERS[i], text: w }));
  const correct = opts.find((o) => o.text === odd)!.id;
  return {
    id, version: 1, question_type: 'verbal_classification', title: `Odd word out ${n}`,
    primary_topic: 'gen-word-groups', secondary_topics: ['cogat-verbal-classification', 'olsat-verbal-analogies'],
    exam_alignment: [
      { exam: 'cogat', topic: 'cogat-verbal-classification', rationale: 'Original word classification. Not affiliated with the test publisher.' },
      { exam: 'olsat', topic: 'olsat-verbal-analogies', rationale: 'Original verbal classification. Not affiliated with the test publisher.' },
    ],
    age_band: age, reading_load: 'medium', difficulty: diff, language: 'en-US',
    learning_objective: 'Find what most of the words share, and spot the one that does not share it.',
    accessibility: { relies_on_color: false, alt: `Four words: ${order.join(', ')}. Which one does not belong?` },
    payload: {
      schema_version: 1, family: 'verbal_classification',
      prompt: 'Which word does not belong with the others?',
      read_aloud: `Listen to these words: ${order.join(', ')}. Which one does not belong?`,
      hint: 'Find something that three of the words have in common.',
      options: opts,
      interaction: { predict_first: false },
    },
    answer_key: {
      correct,
      explanation: { summary: relation, steps: ['Say what each word is.', 'Find what three of them share.', 'The one left over does not belong.'] },
      rationales: Object.fromEntries(opts.map((o) => [o.id, rationales[o.text]])),
      distractor_kinds: Object.fromEntries(opts.filter((o) => o.id !== correct).map((o) => [o.id, 'member_of_group'])),
      semantic_relation: relation,
    },
    authoring: DRAFT,
  };
}

// ---------------------------------------------------------------------------
// The batch
// ---------------------------------------------------------------------------

export function buildSeedBatch(): BankQuestion[] {
  const { o, dots, matrix2, matrix3 } = FIGURE_BUILDERS;
  const { navy, ochre, forest, brick } = COLORS;
  const off = (v: number, kind: string, why: string): Cand<number> => ({ value: v, kind, why });
  return [
    rotationItem(1, 'chair', 'y', 1, '8-10', 2),
    rotationItem(2, 'hook', 'z', -1, '8-10', 2),
    rotationItem(3, 'zig', 'x', 1, '10-12', 3),
    rotationItem(4, 'screw', 'y', -1, '10-12', 4),
    viewItem(1, 'chair', 'top', '8-10', 2),
    viewItem(2, 'step', 'right', '8-10', 2),
    viewItem(3, 'tower', 'front', '10-12', 3),
    viewItem(4, 'zig', 'left', '10-12', 3),
    reflectionItem(1, 'chair', 'x', '8-10', 2),
    reflectionItem(2, 'screw', 'z', '10-12', 3),
    reflectionItem(3, 'hook', 'y', '10-12', 3),
    reflectionItem(4, 'zig', 'x', '10-12', 4),
    matrixItem(1, 'rot_cw', () => matrix2(RULES.rot_cw, [o('flag', { color: navy })], [o('ell', { color: ochre, rotation: 90 })]), '8-10', 1),
    matrixItem(2, 'flip_lr', () => matrix2(RULES.flip_lr, [o('ell', { color: forest })], [o('flag', { color: brick, rotation: 180 })]), '8-10', 2),
    matrixItem(3, 'count_up', () => matrix2(RULES.count_up, dots(2, navy, 'triangle'), dots(3, ochre, 'square')), '8-10', 1),
    matrixItem(4, 'rot_ccw', () => matrix3(RULES.rot_ccw, [o('flag', { color: brick })], [o('ell', { color: navy })], [o('arrow', { color: forest, rotation: 90 })]), '10-12', 3),
    seriesItem(1, [3, 7, 11, 15, 19], { kind: 'arithmetic', step: 4 }, [
      off(18, 'off_by_one', 'Close, but each number goes up by 4, not 3, at the last step.'),
      off(20, 'off_by_one', 'Close, but this goes up by 5 at the last step.'),
      off(23, 'skipped_term', 'This skips a number. It is two steps after 15.'),
    ], 'Each number is 4 more than the one before, so 15 + 4 = 19.', '8-10', 1),
    seriesItem(2, [1, 2, 4, 7, 11, 16], { kind: 'growing_add', first_step: 1, step_increase: 1 }, [
      off(15, 'repeated_last_step', 'This adds 4 again. The amount added grows by one each time.'),
      off(22, 'assumed_doubling', 'This doubles 11. The numbers do not double; the amount added grows by one.'),
      off(17, 'wrong_step_size', 'This adds 6. The next amount to add is one more than 4.'),
    ], 'The amount added grows by one each time: +1, +2, +3, +4, so next is +5. 11 + 5 = 16.', '10-12', 3),
    balanceItem(1, [{ left: { square: 1 }, right: { circle: 2 } }, { left: { triangle: 1 }, right: { square: 1, circle: 1 } }], { shape: 'triangle', in_terms_of: 'circle' }, 3, [
      off(2, 'ignored_second_scale', 'This counts only the square. The triangle also needs one more circle.'),
      off(4, 'counted_square_twice', 'This counts the square as more than 2 circles.'),
      off(1, 'counted_shapes_not_weight', 'This counts the extra circle only. The square is worth circles too.'),
    ], 'A square weighs the same as 2 circles. A triangle is a square plus 1 circle, so it is 2 + 1 = 3 circles.', ['The first scale says 1 square = 2 circles.', 'The second scale says 1 triangle = 1 square + 1 circle.', 'Swap the square for 2 circles: 1 triangle = 3 circles.'], '8-10', 2),
    balanceItem(2, [{ left: { star: 1 }, right: { square: 2 } }, { left: { square: 1 }, right: { circle: 3 } }], { shape: 'star', in_terms_of: 'circle' }, 6, [
      off(5, 'added_instead_of_multiplied', 'This adds 2 and 3. Each of the 2 squares is worth 3 circles.'),
      off(3, 'used_one_square', 'This swaps only one square. The star balances two squares.'),
      off(8, 'wrong_combination', 'Check again: 2 squares, each worth 3 circles.'),
    ], 'A star balances 2 squares. Each square balances 3 circles. So a star balances 3 + 3 = 6 circles.', ['The first scale says 1 star = 2 squares.', 'The second scale says 1 square = 3 circles.', 'Swap each square for 3 circles: 1 star = 6 circles.'], '10-12', 3),
    verbalAnalogy(1, 'Bird', 'nest', 'Bee', 'hive', 'A bird lives in a nest. A bee lives in a hive.', [
      { value: 'honey', kind: 'related_not_parallel', why: 'Bees make honey, but a nest is a home, not something a bird makes to eat.' },
      { value: 'flower', kind: 'related_not_parallel', why: 'Bees visit flowers, but they do not live in them.' },
      { value: 'wing', kind: 'part_not_home', why: 'A wing is part of a bee, not where it lives.' },
    ], '8-10', 1),
    verbalAnalogy(2, 'Glove', 'hand', 'Sock', 'foot', 'A glove is worn on a hand. A sock is worn on a foot.', [
      { value: 'shoe', kind: 'related_not_parallel', why: 'A shoe goes over a sock, but the sock is worn on the foot.' },
      { value: 'warm', kind: 'property_not_relation', why: 'Socks can be warm, but that does not match "worn on".' },
      { value: 'leg', kind: 'near_miss', why: 'Close, but a sock is worn on the foot, not the leg.' },
    ], '8-10', 1),
    verbalOdd(1, ['apple', 'banana', 'carrot', 'pear'], 'carrot', 'Apple, banana and pear are fruits. A carrot is a vegetable.', {
      apple: 'An apple is a fruit, like banana and pear.', banana: 'A banana is a fruit, like apple and pear.', pear: 'A pear is a fruit, like apple and banana.', carrot: 'Yes. A carrot is a vegetable. The others are fruits.',
    }, '8-10', 1),
    verbalOdd(2, ['river', 'lake', 'ocean', 'mountain'], 'mountain', 'A river, a lake and an ocean are bodies of water. A mountain is land.', {
      river: 'A river is water, like a lake and an ocean.', lake: 'A lake is water, like a river and an ocean.', ocean: 'An ocean is water, like a river and a lake.', mountain: 'Yes. A mountain is land. The others are water.',
    }, '8-10', 2),
  ];
}

export const SEED_SHAPES = SHAPES;
