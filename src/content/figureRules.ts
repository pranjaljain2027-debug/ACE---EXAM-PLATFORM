/**
 * Figural transformation rules and misconception text. Pure: no lesson data, so the
 * question-bank validator can bundle it into the bank-import edge function.
 */
import type { ShapeType, VisualObject } from '../types/reasoning';
import { reflectWorld, rotateWorld } from '../engine/geometry';
import type { Domain } from './types';

export type Scene = VisualObject[];

export const COLORS = { navy: '#233D5B', ochre: '#B98E4C', forest: '#547B62', brick: '#A4493D', slate: '#6E7F8D' } as const;
const CYCLE = [COLORS.navy, COLORS.ochre, COLORS.forest];

let uid = 0;
export function o(shape: ShapeType, opts: Partial<VisualObject> = {}): VisualObject {
  uid += 1;
  return { id: `g${uid}`, shape, x: 50, y: 50, rotation: 0, scale: 1, color: COLORS.navy, reflectedX: false, reflectedY: false, zIndex: 1, ...opts };
}
export const clone = (s: Scene): Scene => s.map((x) => ({ ...x, id: `g${++uid}` }));
const each = (f: (x: VisualObject) => VisualObject) => (s: Scene): Scene => clone(s).map(f);

export const dots = (n: number, color: string = COLORS.navy, shape: ShapeType = 'circle'): Scene =>
  Array.from({ length: n }, (_, i) => o(shape, { x: 50 + (i - (n - 1) / 2) * 16, y: 50, scale: 0.42, color }));

const nextColor = (c: string, step = 1) => {
  const i = CYCLE.findIndex((x) => x.toLowerCase() === c.toLowerCase());
  return CYCLE[(((i < 0 ? 0 : i) + step) % 3 + 3) % 3];
};

interface Confuser {
  f: (s: Scene) => Scene;
  tag: string;
}

export interface Rule {
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

