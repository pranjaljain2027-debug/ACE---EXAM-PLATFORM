/**
 * Revised lesson final questions (content audit, 2026-10-24).
 * - Every final question now has four answer choices (most had two, so a guess scored 50%).
 * - ref-102: the marked answer was the left-right mirror, not the reflection in the water.
 * - ref-101: a flipped arrow equals a half-turned arrow, so it did not test flipping. Now an L-shape.
 * - rot-103: prompt named the wrong shapes.
 * - rot-104: a hexagon looks the same every 60°, so 45° steps were not visible. Now a flag.
 * Answers are computed with the same world-space geometry the Shape Lab uses, so they cannot drift.
 */
import { reflectWorld, rotateWorld } from '../engine/geometry';
import type { ShapeType, VisualObject } from '../types/reasoning';

export interface RevisedOption { id: string; objects: VisualObject[]; isCorrect: boolean; explanation: string }
export interface TransferRevision {
  prompt?: string;
  ruleContext?: string;
  frames?: { stepIndex: number; label: string; isMissing?: boolean; objects: VisualObject[] }[];
  options: RevisedOption[];
  note: string;
}

let n = 0;
const obj = (shape: ShapeType, o: Partial<VisualObject> = {}): VisualObject =>
  ({ id: `rv${++n}`, shape, x: 50, y: 50, rotation: 0, scale: 1, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1, ...o });
const withId = (o: VisualObject): VisualObject => ({ ...o, id: `rv${++n}` });
const row = (count: number, shape: ShapeType, color: string, scale: number): VisualObject[] => {
  const xs = count === 1 ? [50] : Array.from({ length: count }, (_, i) => Math.round(15 + (70 * i) / (count - 1)));
  return xs.map((x) => obj(shape, { x, color, scale }));
};
const opt = (id: string, objects: VisualObject[], isCorrect: boolean, explanation: string): RevisedOption => ({ id, objects, isCorrect, explanation });
const frame = (i: number, label: string, objects: VisualObject[]) => ({ stepIndex: i, label, objects });
const missing = (i: number, label = '?') => ({ stepIndex: i, label, isMissing: true, objects: [] as VisualObject[] });

const NAVY = '#0E2235', OCHRE = '#C99543', SAGE = '#718C7B', BLUE = '#2B4C7E', SLATE = '#5C6B73';

// ref-101: L-shape turned a quarter, mirrored left to right.
const ell = obj('ell', { rotation: 90, color: NAVY });
// ref-102: flag above the water line, reflected top to bottom.
const flagUp = obj('flag', { rotation: 90, y: 35, color: SAGE });
const below = (o: VisualObject) => ({ ...withId(o), y: 65 });

export const TRANSFER_REVISIONS: Record<string, TransferRevision> = {
  'rot-102': {
    note: 'Added a fourth choice.',
    options: [
      opt('opt-tc-c', [obj('crescent', { rotation: 0, color: BLUE })], false, 'This goes back to step 1 too early.'),
      opt('opt-tc-a', [obj('crescent', { rotation: 90, color: BLUE })], true, 'Yes. Each step turns a quarter turn to the left, so after 180° comes 90°.'),
      opt('opt-tc-d', [obj('crescent', { rotation: 180, color: BLUE })], false, 'This is step 3 again. Nothing turned.'),
      opt('opt-tc-b', [obj('crescent', { rotation: 270, color: BLUE })], false, 'This repeats step 2.'),
    ],
  },
  'rot-103': {
    note: 'Prompt named a pentagon and an arrow; the shapes are a diamond and a dot. Added two choices.',
    prompt: 'The diamond and its dot make a half turn each step. Which picture comes next?',
    ruleContext: 'The whole picture turns 180° each step, so the dot swaps between top and bottom.',
    options: [
      opt('opt-ti-c', [obj('diamond', { rotation: 90, scale: 1.2, color: OCHRE }), obj('circle', { x: 70, y: 50, scale: 0.5, color: NAVY, zIndex: 2 })], false, 'This is only a quarter turn. The dot moved to the side.'),
      opt('opt-ti-b', [obj('diamond', { rotation: 0, scale: 1.2, color: OCHRE }), obj('circle', { x: 50, y: 30, scale: 0.5, color: NAVY, zIndex: 2 })], false, 'This is step 3 again. Nothing turned.'),
      opt('opt-ti-a', [obj('diamond', { rotation: 180, scale: 1.2, color: OCHRE }), obj('circle', { x: 50, y: 70, rotation: 180, scale: 0.5, color: NAVY, zIndex: 2 })], true, 'Yes. A half turn moves the dot from the top to the bottom.'),
      opt('opt-ti-d', [obj('diamond', { rotation: 270, scale: 1.2, color: OCHRE }), obj('circle', { x: 30, y: 50, scale: 0.5, color: NAVY, zIndex: 2 })], false, 'This is a quarter turn the other way. The dot moved to the side.'),
    ],
  },
  'rot-104': {
    note: 'A hexagon looks the same every 60°, so 45° steps were not visible. Switched to a flag and added two choices.',
    prompt: 'The flag turns 45° clockwise each step. Which flag comes next?',
    ruleContext: 'The flag turns 45° clockwise each step.',
    frames: [
      frame(1, '1', [obj('flag', { rotation: 0, color: NAVY })]),
      frame(2, '2', [obj('flag', { rotation: 45, color: NAVY })]),
      frame(3, '3', [obj('flag', { rotation: 90, color: NAVY })]),
      missing(4),
    ],
    options: [
      opt('opt-tp-c', [obj('flag', { rotation: 90, color: NAVY })], false, 'This is step 3 again. Nothing turned.'),
      opt('opt-tp-b', [obj('flag', { rotation: 180, color: NAVY })], false, 'This turned 90°, twice as far as each step.'),
      opt('opt-tp-a', [obj('flag', { rotation: 135, color: NAVY })], true, 'Yes. 90° plus 45° is 135°.'),
      opt('opt-tp-d', [obj('flag', { rotation: 45, color: NAVY })], false, 'This turned back the other way, to step 2.'),
    ],
  },
  'ref-101': {
    note: 'A flipped arrow looks the same as a half-turned arrow, so this did not test flipping. Now an L-shape, which a turn cannot copy.',
    prompt: 'Flip this L-shape left to right, like in a mirror. Which picture shows the result?',
    ruleContext: 'The shape reflects across a vertical mirror line.',
    frames: [frame(1, 'Original', [ell]), missing(2, 'Mirror (?)')],
    options: [
      opt('opt-ref-c', [withId(reflectWorld(ell, 'horizontal'))], false, 'This flipped top to bottom. The mirror stands at the side, so left and right swap.'),
      opt('opt-ref-b', [withId(rotateWorld(ell, 180))], false, 'This was turned halfway round, not flipped. Turning can never make a mirror image of an L.'),
      opt('opt-ref-d', [withId(ell)], false, 'This is the same shape. Nothing was flipped.'),
      opt('opt-ref-a', [withId(reflectWorld(ell, 'vertical'))], true, 'Yes. Left and right swap, and the short arm now points the other way.'),
    ],
  },
  'ref-102': {
    note: 'Marked answer was the left-right mirror. The water reflection flips top to bottom. Added two choices.',
    frames: [frame(1, 'Upper', [flagUp]), missing(2, 'Lower (?)')],
    options: [
      opt('opt-rv-b', [below(reflectWorld(flagUp, 'vertical'))], false, 'This flipped left to right. Water flips the picture top to bottom.'),
      opt('opt-rv-a', [below(reflectWorld(flagUp, 'horizontal'))], true, 'Yes. In the water the flag flips top to bottom, so the point faces the other way up.'),
      opt('opt-rv-c', [below(rotateWorld(flagUp, 180))], false, 'This was turned halfway round, not reflected.'),
      opt('opt-rv-d', [below(flagUp)], false, 'This is the same flag moved down. A reflection is flipped.'),
    ],
  },
  'prog-101': {
    note: 'Added two choices.',
    options: [
      opt('opt-ts-3', row(3, 'star', NAVY, 0.8), false, 'This is step 3 again. Each step adds one.'),
      opt('opt-ts-4', row(4, 'star', NAVY, 0.8), true, 'Yes. 1, 2, 3, then 4.'),
      opt('opt-ts-6', row(6, 'star', NAVY, 0.7), false, 'This doubled the stars. Each step adds just one.'),
      opt('opt-ts-5', row(5, 'star', NAVY, 0.7), false, 'This added two. Each step adds just one.'),
    ],
  },
  'prog-102': {
    note: 'Added two choices.',
    options: [
      opt('opt-sc-same', [obj('circle', { scale: 0.8, color: OCHRE })], false, 'This is step 3 again. Each step gets smaller.'),
      opt('opt-sc-big', [obj('circle', { scale: 1.4, color: OCHRE })], false, 'This went back to the biggest size.'),
      opt('opt-sc-mid', [obj('circle', { scale: 1.1, color: OCHRE })], false, 'This grew. Each step shrinks.'),
      opt('opt-sc-small', [obj('circle', { scale: 0.5, color: OCHRE })], true, 'Yes. Each step shrinks by the same amount.'),
    ],
  },
  'prog-103': {
    note: 'Added two choices.',
    options: [
      opt('opt-tco-tr', [obj('diamond', { x: 75, y: 25, scale: 0.6, color: SAGE })], false, 'This moved backwards, the other way round.'),
      opt('opt-tco-bl', [obj('diamond', { x: 25, y: 75, scale: 0.6, color: SAGE })], true, 'Yes. Top left, top right, bottom right, then bottom left.'),
      opt('opt-tco-br', [obj('diamond', { x: 75, y: 75, scale: 0.6, color: SAGE })], false, 'This stayed in the same corner as step 3.'),
      opt('opt-tco-tl', [obj('diamond', { x: 25, y: 25, scale: 0.6, color: SAGE })], false, 'This skipped a corner and went back to the start.'),
    ],
  },
  'attr-101': {
    note: 'Added two choices.',
    options: [
      opt('opt-tcl-navy', [obj('star', { color: NAVY })], false, 'Navy comes after ochre. After sage the cycle starts again.'),
      opt('opt-tcl-sage', [obj('star', { color: SAGE })], false, 'This is step 3 again.'),
      opt('opt-tcl-slate', [obj('star', { color: SLATE })], false, 'This grey is not one of the three colours in the cycle.'),
      opt('opt-tcl-ochre', [obj('star', { color: OCHRE })], true, 'Yes. Ochre, navy, sage, then back to ochre.'),
    ],
  },
  'attr-102': {
    note: 'Added two choices.',
    options: [
      opt('opt-dt-navy-left', [obj('triangle', { rotation: 270, color: NAVY })], true, 'Yes. It turns a quarter turn clockwise and switches to navy.'),
      opt('opt-dt-navy-back', [obj('triangle', { rotation: 90, color: NAVY })], false, 'The colour is right, but it turned the wrong way.'),
      opt('opt-dt-ochre-left', [obj('triangle', { rotation: 270, color: OCHRE })], false, 'The turn is right, but the colour should switch to navy.'),
      opt('opt-dt-navy-still', [obj('triangle', { rotation: 180, color: NAVY })], false, 'The colour switched, but it did not turn.'),
    ],
  },
  'attr-103': {
    note: 'Added two choices.',
    options: [
      opt('opt-tdf-still', [obj('crescent', { rotation: 180, color: NAVY })], false, 'This did not turn. Ignore the colour and watch the direction.'),
      opt('opt-tdf-up', [obj('crescent', { rotation: 0, color: OCHRE })], false, 'This matches step 1’s colour, but colour is not the rule.'),
      opt('opt-tdf-left', [obj('crescent', { rotation: 270, color: SLATE })], true, 'Yes. It keeps turning a quarter turn clockwise. The colour does not matter.'),
      opt('opt-tdf-back', [obj('crescent', { rotation: 90, color: SAGE })], false, 'This turned back the other way.'),
    ],
  },
};
