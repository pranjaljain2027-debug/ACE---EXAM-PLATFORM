/**
 * Original practice and baseline items, generated deterministically from transformation rules.
 * Nothing here is copied from a test publisher: every figure is built from the studio's own shapes,
 * and distractors are constructed from named misconceptions so wrong answers are diagnostic.
 */
import type { ShapeType, VisualObject } from '../types/reasoning';
import { reflectWorld, rotateWorld, sceneSignature } from '../engine/geometry';
import { DOMAIN_TAGS, CONTENT_VERSION, REVIEWER } from './lessons';
import type { ActivityType, ContentMode, Domain, ItemActivity, ItemPayload, ItemStem } from './types';

type Scene = VisualObject[];

export const COLORS = { navy: '#233D5B', ochre: '#B98E4C', forest: '#547B62', brick: '#A4493D', slate: '#6E7F8D' } as const;
const CYCLE = [COLORS.navy, COLORS.ochre, COLORS.forest];

let uid = 0;
function o(shape: ShapeType, opts: Partial<VisualObject> = {}): VisualObject {
  uid += 1;
  return { id: `g${uid}`, shape, x: 50, y: 50, rotation: 0, scale: 1, color: COLORS.navy, reflectedX: false, reflectedY: false, zIndex: 1, ...opts };
}
const clone = (s: Scene): Scene => s.map((x) => ({ ...x, id: `g${++uid}` }));
const each = (f: (x: VisualObject) => VisualObject) => (s: Scene): Scene => clone(s).map(f);

const dots = (n: number, color: string = COLORS.navy, shape: ShapeType = 'circle'): Scene =>
  Array.from({ length: n }, (_, i) => o(shape, { x: 50 + (i - (n - 1) / 2) * 16, y: 50, scale: 0.42, color }));

const nextColor = (c: string, step = 1) => {
  const i = CYCLE.findIndex((x) => x.toLowerCase() === c.toLowerCase());
  return CYCLE[(((i < 0 ? 0 : i) + step) % 3 + 3) % 3];
};

interface Confuser {
  f: (s: Scene) => Scene;
  tag: string;
}

interface Rule {
  id: string;
  domain: Domain;
  skill: string;
  ruleCount: number;
  says: string; // child-facing statement of the rule
  f: (s: Scene) => Scene;
  confusers: Confuser[];
}

const rot = (d: number) => each((x) => rotateWorld(x, d));
const flip = (axis: 'vertical' | 'horizontal') => each((x) => reflectWorld(x, axis));
const recolor = (step: number) => each((x) => ({ ...x, color: nextColor(x.color, step) }));
const grow = (d: number) => each((x) => ({ ...x, scale: Math.round(Math.min(1.4, Math.max(0.6, (x.scale || 1) + d)) * 10) / 10 }));
const same = (s: Scene) => clone(s);
const countBy = (d: number) => (s: Scene) => dots(Math.max(1, s.length + d), s[0]?.color, s[0]?.shape);

export const RULES: Record<string, Rule> = {
  rot_cw: {
    id: 'rot_cw', domain: 'rotation', skill: 'rot-quarter-cw', ruleCount: 1,
    says: 'Each step turns a quarter turn clockwise (to the right).', f: rot(90),
    confusers: [{ f: rot(-90), tag: 'wrong_direction' }, { f: flip('vertical'), tag: 'flipped_instead_of_turned' }, { f: same, tag: 'no_change_applied' }, { f: rot(180), tag: 'wrong_step_size' }],
  },
  rot_ccw: {
    id: 'rot_ccw', domain: 'rotation', skill: 'rot-quarter-ccw', ruleCount: 1,
    says: 'Each step turns a quarter turn counterclockwise (to the left).', f: rot(-90),
    confusers: [{ f: rot(90), tag: 'wrong_direction' }, { f: flip('horizontal'), tag: 'flipped_instead_of_turned' }, { f: same, tag: 'no_change_applied' }, { f: rot(180), tag: 'wrong_step_size' }],
  },
  rot_180: {
    id: 'rot_180', domain: 'rotation', skill: 'rot-half-turn', ruleCount: 1,
    says: 'Each step turns a half turn, so the shape ends up upside down.', f: rot(180),
    confusers: [{ f: flip('horizontal'), tag: 'flipped_instead_of_turned' }, { f: rot(90), tag: 'wrong_step_size' }, { f: same, tag: 'no_change_applied' }, { f: flip('vertical'), tag: 'flipped_instead_of_turned' }],
  },
  flip_lr: {
    id: 'flip_lr', domain: 'reflection', skill: 'ref-horizontal', ruleCount: 1,
    says: 'The shape flips left to right, like looking in a mirror.', f: flip('vertical'),
    confusers: [{ f: rot(180), tag: 'turned_instead_of_flipped' }, { f: flip('horizontal'), tag: 'wrong_mirror_axis' }, { f: same, tag: 'no_change_applied' }, { f: rot(90), tag: 'turned_instead_of_flipped' }],
  },
  flip_ud: {
    id: 'flip_ud', domain: 'reflection', skill: 'ref-vertical', ruleCount: 1,
    says: 'The shape flips top to bottom, like a reflection in water.', f: flip('horizontal'),
    confusers: [{ f: rot(180), tag: 'turned_instead_of_flipped' }, { f: flip('vertical'), tag: 'wrong_mirror_axis' }, { f: same, tag: 'no_change_applied' }, { f: rot(-90), tag: 'turned_instead_of_flipped' }],
  },
  count_up: {
    id: 'count_up', domain: 'progression', skill: 'prog-count-step', ruleCount: 1,
    says: 'Each step adds exactly one more.', f: countBy(1),
    confusers: [{ f: countBy(2), tag: 'wrong_step_size' }, { f: same, tag: 'no_change_applied' }, { f: countBy(-1), tag: 'wrong_direction' }],
  },
  grow: {
    id: 'grow', domain: 'progression', skill: 'prog-size-scale', ruleCount: 1,
    says: 'Each step makes the shape a little bigger.', f: grow(0.2),
    confusers: [{ f: grow(-0.2), tag: 'wrong_direction' }, { f: same, tag: 'no_change_applied' }, { f: grow(0.4), tag: 'wrong_step_size' }],
  },
  color_cycle: {
    id: 'color_cycle', domain: 'attributes', skill: 'attr-color-cycle', ruleCount: 1,
    says: 'The colour goes navy, then ochre, then forest green, then starts again.', f: recolor(1),
    confusers: [{ f: recolor(2), tag: 'wrong_direction' }, { f: same, tag: 'no_change_applied' }, { f: (s) => rot(90)(recolor(0)(s)), tag: 'tracks_wrong_attribute' }],
  },
  rot_and_color: {
    id: 'rot_and_color', domain: 'attributes', skill: 'attr-dual-conjunction', ruleCount: 2,
    says: 'Two things change at once: a quarter turn clockwise and the next colour.', f: (s) => rot(90)(recolor(1)(s)),
    confusers: [{ f: rot(90), tag: 'partial_rule' }, { f: recolor(1), tag: 'partial_rule' }, { f: (s) => rot(-90)(recolor(1)(s)), tag: 'wrong_direction' }, { f: same, tag: 'no_change_applied' }],
  },
};

export const MISCONCEPTION_TEXT: Record<string, string> = {
  wrong_direction: 'This went the opposite way.',
  flipped_instead_of_turned: 'This is a mirror image. The rule turns the shape. It does not flip it.',
  turned_instead_of_flipped: 'This one was turned, not flipped. Check the mirror line.',
  wrong_mirror_axis: 'This flipped across the other mirror line.',
  no_change_applied: 'Nothing changed here, but the rule always changes something.',
  wrong_step_size: 'Close, but this changed by too much.',
  copied_neighbor: 'This copies the picture next to it. Apply the rule to the new shape instead.',
  tracks_wrong_attribute: 'This changes the wrong thing.',
  partial_rule: 'Only one of the two changes happened.',
  treats_rotation_as_different: 'This one is only turned. A turned shape is still the same shape.',
  odd_count_missed: 'Count the pieces in each picture. Colours are only there to distract.',
};

// Deterministic shuffle so content is stable across builds.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

interface Built {
  stem: ItemStem;
  correct: Scene;
  wrong: { scene: Scene; tag: string }[];
  steps: number;
}

function pickOptions(id: string, correct: Scene, wrong: { scene: Scene; tag: string }[]) {
  const seen = new Set([sceneSignature(correct)]);
  const chosen: { scene: Scene; tag: string }[] = [];
  for (const w of wrong) {
    const sig = sceneSignature(w.scene);
    if (seen.has(sig)) continue;
    seen.add(sig);
    chosen.push(w);
    if (chosen.length === 3) break;
  }
  if (chosen.length < 2) throw new Error(`${id}: not enough distinct distractors`);
  const all = [{ scene: correct, tag: '' }, ...chosen];
  const r = rng(hash(id));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const letters = ['a', 'b', 'c', 'd'];
  return all.map((x, i) => ({ id: `${id}-${letters[i]}`, objects: x.scene, tag: x.tag }));
}

const matrix2 = (rule: Rule, A: Scene, B: Scene): Built => {
  const RA = rule.f(A);
  return {
    stem: { kind: 'matrix', cols: 2, cells: [A, RA, B, null] },
    correct: rule.f(B),
    wrong: [...rule.confusers.map((c) => ({ scene: c.f(B), tag: c.tag })), { scene: clone(RA), tag: 'copied_neighbor' }],
    steps: 1,
  };
};

const analogy = (rule: Rule, A: Scene, C: Scene): Built => ({
  stem: { kind: 'analogy', a: A, b: rule.f(A), c: C },
  correct: rule.f(C),
  wrong: [...rule.confusers.map((cf) => ({ scene: cf.f(C), tag: cf.tag })), { scene: rule.f(A), tag: 'copied_neighbor' }],
  steps: 1,
});

const sequence = (rule: Rule, X: Scene): Built => {
  const f1 = rule.f(X);
  const f2 = rule.f(f1);
  return {
    stem: { kind: 'sequence', frames: [X, f1, f2, null] },
    correct: rule.f(f2),
    wrong: [...rule.confusers.map((c) => ({ scene: c.f(f2), tag: c.tag })), { scene: clone(f1), tag: 'wrong_direction' }],
    steps: 2,
  };
};

const matrix3 = (rule: Rule, X: Scene, Y: Scene, Z: Scene): Built => {
  const rows = [X, Y, Z].map((s) => [s, rule.f(s), rule.f(rule.f(s))]);
  return {
    stem: { kind: 'matrix', cols: 3, cells: [...rows[0], ...rows[1], rows[2][0], rows[2][1], null] },
    correct: rows[2][2],
    wrong: [...rule.confusers.map((c) => ({ scene: c.f(rows[2][1]), tag: c.tag })), { scene: clone(rows[1][2]), tag: 'copied_neighbor' }],
    steps: 2,
  };
};

/** "Which one does not belong?" Three are turns of one shape; the odd one is its mirror image. */
const oddMirror = (shape: ShapeType, color: string): Built => {
  const base = o(shape, { color });
  const turned = [0, 90, 180].map((d) => [rotateWorld(base, d)]);
  return {
    stem: { kind: 'classification' },
    correct: [rotateWorld(reflectWorld(base, 'vertical'), 270)],
    wrong: turned.map((s) => ({ scene: clone(s), tag: 'treats_rotation_as_different' })),
    steps: 2,
  };
};

/** Three pictures have the same number of pieces in noisy colours; the odd one has a different count. */
const oddCount = (n: number, shape: ShapeType): Built => {
  const cols = [COLORS.navy, COLORS.ochre, COLORS.forest, COLORS.brick];
  return {
    stem: { kind: 'classification' },
    correct: dots(n + 1, cols[3], shape),
    wrong: [0, 1, 2].map((i) => ({ scene: dots(n, cols[i], shape), tag: 'odd_count_missed' })),
    steps: 1,
  };
};

const PROMPTS: Record<ItemStem['kind'], string> = {
  matrix: 'Which picture completes the grid?',
  analogy: 'The first pair follows a rule. Which picture finishes the second pair the same way?',
  sequence: 'What comes next?',
  classification: 'Which one does not belong with the others?',
};

interface Spec {
  id: string;
  mode: ContentMode;
  rule: Rule;
  build: () => Built;
  title: string;
  skill?: string; // override (classification items)
  domain?: Domain;
  explanation?: string;
}

function toItem(s: Spec): ItemActivity {
  const b = s.build();
  const options = pickOptions(s.id, b.correct, b.wrong);
  const correct = options.find((x) => x.tag === '')!;
  const kind = b.stem.kind;
  const payload: ItemPayload = {
    prompt: PROMPTS[kind],
    stem: b.stem,
    options: kind === 'classification' ? options.map(({ id, objects }) => ({ id, objects })) : options.map(({ id, objects }) => ({ id, objects })),
  };
  const explanation = s.explanation ?? s.rule.says;
  const domain = s.domain ?? s.rule.domain;
  const type: ActivityType = kind === 'classification' ? 'classification' : kind;
  return {
    id: s.id,
    content_version: CONTENT_VERSION,
    title: s.title,
    domain,
    skill_id: s.skill ?? s.rule.skill,
    subskills: [s.skill ?? s.rule.skill],
    assessment_tags: DOMAIN_TAGS[domain],
    mode: s.mode,
    activity_type: type,
    age_min: 8,
    age_max: 10,
    prerequisites: [],
    difficulty: { rule_count: s.rule.ruleCount, reasoning_steps: b.steps, distractor_complexity: options.length >= 4 ? 2 : 1 },
    payload,
    answer_key: {
      item: {
        correct: correct.id,
        explanation,
        feedback: Object.fromEntries(options.map((x) => [x.id, x.tag ? MISCONCEPTION_TEXT[x.tag] : `Yes. ${explanation}`])),
        misconceptions: Object.fromEntries(options.filter((x) => x.tag).map((x) => [x.id, x.tag])),
      },
    },
    accessibility_metadata: { alt: `${PROMPTS[kind]} ${explanation}`, colorIndependent: !['color_cycle', 'rot_and_color'].includes(s.rule.id) },
    review_status: 'published',
    reviewed_by: REVIEWER,
  };
}

const R = RULES;
const { navy, ochre, forest, brick, slate } = COLORS;

const BASELINE_SPECS: Spec[] = [
  { id: 'bq-01', mode: 'baseline', rule: R.rot_cw, title: 'Turning flag', build: () => sequence(R.rot_cw, [o('flag', { color: navy })]) },
  { id: 'bq-02', mode: 'baseline', rule: R.count_up, title: 'Counting dots', build: () => sequence(R.count_up, dots(1, ochre)) },
  { id: 'bq-03', mode: 'baseline', rule: R.color_cycle, title: 'Colour grid', build: () => matrix2(R.color_cycle, [o('triangle', { color: navy })], [o('square', { color: ochre })]) },
  { id: 'bq-04', mode: 'baseline', rule: R.flip_lr, title: 'Mirror pair', build: () => analogy(R.flip_lr, [o('ell', { color: ochre })], [o('flag', { color: forest })]) },
  { id: 'bq-05', mode: 'baseline', rule: R.rot_180, title: 'Half turn pair', build: () => analogy(R.rot_180, [o('ell', { color: forest })], [o('flag', { color: navy })]) },
  { id: 'bq-06', mode: 'baseline', rule: R.grow, title: 'Growing diamond', build: () => sequence(R.grow, [o('diamond', { color: forest, scale: 0.6 })]) },
  { id: 'bq-07', mode: 'baseline', rule: R.flip_ud, title: 'Water reflection', build: () => matrix2(R.flip_ud, [o('flag', { color: slate })], [o('ell', { color: navy })]) },
  { id: 'bq-08', mode: 'baseline', rule: R.flip_lr, skill: 'ref-vs-rotation', title: 'Odd one out', explanation: 'Three pictures are the same shape, only turned. The odd one is the mirror image.', build: () => oddMirror('ell', ochre) },
  { id: 'bq-09', mode: 'baseline', rule: R.rot_ccw, title: 'Turning grid', build: () => matrix3(R.rot_ccw, [o('arrow', { color: navy })], [o('flag', { color: ochre })], [o('ell', { color: forest })]) },
  { id: 'bq-10', mode: 'baseline', rule: R.rot_and_color, title: 'Two changes', build: () => analogy(R.rot_and_color, [o('ell', { color: navy })], [o('flag', { color: ochre })]) },
];

const PRACTICE_SPECS: Spec[] = [
  // Rotation
  { id: 'pr-rot-01', mode: 'practice', rule: R.rot_cw, title: 'Quarter turn grid', build: () => matrix2(R.rot_cw, [o('ell', { color: navy })], [o('flag', { color: ochre })]) },
  { id: 'pr-rot-02', mode: 'practice', rule: R.rot_cw, title: 'Arrow steps', build: () => sequence(R.rot_cw, [o('arrow', { color: forest, rotation: 90 })]) },
  { id: 'pr-rot-03', mode: 'practice', rule: R.rot_cw, title: 'Turn pair', build: () => analogy(R.rot_cw, [o('flag', { color: brick })], [o('ell', { color: navy, rotation: 180 })]) },
  { id: 'pr-rot-04', mode: 'practice', rule: R.rot_cw, title: 'Three-row turns', build: () => matrix3(R.rot_cw, [o('flag', { color: navy })], [o('arrow', { color: ochre })], [o('ell', { color: forest })]) },
  { id: 'pr-rot-05', mode: 'practice', rule: R.rot_ccw, title: 'Left turns', build: () => sequence(R.rot_ccw, [o('flag', { color: ochre })]) },
  { id: 'pr-rot-06', mode: 'practice', rule: R.rot_ccw, title: 'Left turn pair', build: () => analogy(R.rot_ccw, [o('arrow', { color: navy })], [o('ell', { color: brick })]) },
  { id: 'pr-rot-07', mode: 'practice', rule: R.rot_ccw, title: 'Left turn grid', build: () => matrix2(R.rot_ccw, [o('ell', { color: forest, rotation: 90 })], [o('flag', { color: slate })]) },
  { id: 'pr-rot-08', mode: 'practice', rule: R.rot_180, title: 'Upside down pair', build: () => analogy(R.rot_180, [o('flag', { color: forest })], [o('arrow', { color: ochre, rotation: 90 })]) },
  { id: 'pr-rot-09', mode: 'practice', rule: R.rot_180, title: 'Half turn grid', build: () => matrix2(R.rot_180, [o('ell', { color: brick })], [o('flag', { color: navy })]) },
  { id: 'pr-rot-10', mode: 'practice', rule: R.rot_180, title: 'Half turn steps', build: () => sequence(R.rot_180, [o('ell', { color: ochre, rotation: 90 })]) },
  // Reflection
  { id: 'pr-ref-01', mode: 'practice', rule: R.flip_lr, title: 'Mirror grid', build: () => matrix2(R.flip_lr, [o('flag', { color: navy })], [o('ell', { color: ochre, rotation: 90 })]) },
  { id: 'pr-ref-02', mode: 'practice', rule: R.flip_lr, title: 'Mirror pair', build: () => analogy(R.flip_lr, [o('ell', { color: forest })], [o('flag', { color: brick, rotation: 90 })]) },
  { id: 'pr-ref-03', mode: 'practice', rule: R.flip_lr, title: 'Mirror steps', build: () => sequence(R.flip_lr, [o('flag', { color: slate })]) },
  { id: 'pr-ref-04', mode: 'practice', rule: R.flip_ud, title: 'Water grid', build: () => matrix2(R.flip_ud, [o('ell', { color: navy })], [o('flag', { color: forest })]) },
  { id: 'pr-ref-05', mode: 'practice', rule: R.flip_ud, title: 'Water pair', build: () => analogy(R.flip_ud, [o('flag', { color: ochre })], [o('ell', { color: brick, rotation: 270 })]) },
  { id: 'pr-ref-06', mode: 'practice', rule: R.flip_lr, skill: 'ref-vs-rotation', title: 'Turned or flipped? 1', explanation: 'Three pictures are the same shape, only turned. The odd one is the mirror image.', build: () => oddMirror('ell', navy) },
  { id: 'pr-ref-07', mode: 'practice', rule: R.flip_lr, skill: 'ref-vs-rotation', title: 'Turned or flipped? 2', explanation: 'Three pictures are the same flag, only turned. The odd one is the mirror image.', build: () => oddMirror('flag', forest) },
  { id: 'pr-ref-08', mode: 'practice', rule: R.flip_lr, skill: 'ref-vs-rotation', title: 'Turned or flipped? 3', explanation: 'Three pictures are the same shape, only turned. The odd one is the mirror image.', build: () => oddMirror('ell', brick) },
  // Progression
  { id: 'pr-pro-01', mode: 'practice', rule: R.count_up, title: 'Counting up', build: () => sequence(R.count_up, dots(1, navy, 'square')) },
  { id: 'pr-pro-02', mode: 'practice', rule: R.count_up, title: 'Counting grid', build: () => matrix2(R.count_up, dots(1, forest), dots(3, ochre, 'triangle')) },
  { id: 'pr-pro-03', mode: 'practice', rule: R.count_up, title: 'Counting pair', build: () => analogy(R.count_up, dots(2, brick, 'diamond'), dots(1, navy, 'star')) },
  { id: 'pr-pro-04', mode: 'practice', rule: R.grow, title: 'Growing steps', build: () => sequence(R.grow, [o('hexagon', { color: ochre, scale: 0.6 })]) },
  { id: 'pr-pro-05', mode: 'practice', rule: R.grow, title: 'Growing pair', build: () => analogy(R.grow, [o('square', { color: navy, scale: 0.8 })], [o('star', { color: forest, scale: 0.6 })]) },
  { id: 'pr-pro-06', mode: 'practice', rule: R.count_up, skill: 'attr-distractor-filter', domain: 'attributes', title: 'Odd count out', explanation: 'Three pictures have the same number of pieces. The odd one has one more. The colours do not matter.', build: () => oddCount(2, 'circle') },
  { id: 'pr-pro-07', mode: 'practice', rule: R.count_up, skill: 'attr-distractor-filter', domain: 'attributes', title: 'Odd count out 2', explanation: 'Three pictures have the same number of pieces. The odd one has one more. The colours do not matter.', build: () => oddCount(3, 'triangle') },
  // Attributes
  { id: 'pr-att-01', mode: 'practice', rule: R.color_cycle, title: 'Colour steps', build: () => sequence(R.color_cycle, [o('star', { color: navy })]) },
  { id: 'pr-att-02', mode: 'practice', rule: R.color_cycle, title: 'Colour grid', build: () => matrix2(R.color_cycle, [o('hexagon', { color: ochre })], [o('flag', { color: forest })]) },
  { id: 'pr-att-03', mode: 'practice', rule: R.color_cycle, title: 'Colour pair', build: () => analogy(R.color_cycle, [o('diamond', { color: forest })], [o('ell', { color: navy })]) },
  { id: 'pr-att-04', mode: 'practice', rule: R.rot_and_color, title: 'Two changes grid', build: () => matrix2(R.rot_and_color, [o('flag', { color: navy })], [o('ell', { color: ochre })]) },
  { id: 'pr-att-05', mode: 'practice', rule: R.rot_and_color, title: 'Two changes steps', build: () => sequence(R.rot_and_color, [o('ell', { color: forest })]) },
  { id: 'pr-att-06', mode: 'practice', rule: R.rot_and_color, title: 'Two changes pair', build: () => analogy(R.rot_and_color, [o('arrow', { color: ochre })], [o('flag', { color: forest, rotation: 90 })]) },
];

export const BASELINE_ITEMS: ItemActivity[] = BASELINE_SPECS.map(toItem);
export const PRACTICE_ITEMS: ItemActivity[] = PRACTICE_SPECS.map(toItem);

/** Builders reused by the question-bank seed generator (src/content/bank/seed.ts). */
export const FIGURE_BUILDERS = { o, dots, matrix2, matrix3, analogy, sequence, pickOptions };
