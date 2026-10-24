import type { AllowedAction, VisualObject } from '../types/reasoning';
import {
  DEFAULT_TOLERANCE,
  MatchTolerance,
  canonicalOrientation,
  directionWord,
  orientationOf,
  reflectWorld,
  rotateWorld,
  sameObject,
  sameOrientation,
  sameScene,
} from './geometry';

/**
 * Deterministic Shape Lab engine (spec section 9).
 * State is derived by replaying an immutable action log from the initial state, so
 * undo/redo/reset/replay are exact and two clients replaying the same log get the same scene.
 */

export type LabAction =
  | { type: 'rotate'; id: string; deg: number }
  | { type: 'reflect'; id: string; axis: 'vertical' | 'horizontal' }
  | { type: 'recolor'; id: string; color: string }
  | { type: 'resize'; id: string; scale: number }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'add'; id: string; template: VisualObject; x: number; y: number }
  | { type: 'remove'; id: string };

export interface LabHistory {
  initial: VisualObject[];
  actions: LabAction[];
  cursor: number; // number of actions currently applied (actions after cursor are redo-able)
}

export const SCALE_STEPS = [0.6, 0.8, 1.0, 1.2, 1.4];
export const GRID_STEP = 12.5; // snapping grid, in percentage units
export const MAX_OBJECTS = 8;

/** Accessible swatches: every colour has a name so the UI never relies on colour alone. */
export const PALETTE: { hex: string; name: string; pattern: string }[] = [
  { hex: '#233D5B', name: 'Navy', pattern: 'solid' },
  { hex: '#B98E4C', name: 'Ochre', pattern: 'dots' },
  { hex: '#547B62', name: 'Forest', pattern: 'stripes' },
  { hex: '#A4493D', name: 'Brick', pattern: 'cross' },
  { hex: '#6E7F8D', name: 'Slate', pattern: 'grid' },
  { hex: '#F2EEE4', name: 'Ivory', pattern: 'ring' },
];

export const colorName = (hex: string): string =>
  PALETTE.find((p) => p.hex.toLowerCase() === hex.toLowerCase())?.name ?? LEGACY_COLOR_NAMES[hex.toLowerCase()] ?? 'Colour';

const LEGACY_COLOR_NAMES: Record<string, string> = {
  '#0e2235': 'Navy',
  '#c99543': 'Ochre',
  '#718c7b': 'Forest',
  '#2b4c7e': 'Blue',
  '#b84a39': 'Brick',
  '#5c6b73': 'Slate',
};

export const snap = (v: number, step = GRID_STEP): number => {
  const s = Math.round(v / step) * step;
  return Math.min(100 - step, Math.max(step, s));
};

export function createHistory(initial: VisualObject[]): LabHistory {
  return { initial: initial.map((o) => ({ ...o })), actions: [], cursor: 0 };
}

export function applyAction(objects: VisualObject[], a: LabAction): VisualObject[] {
  switch (a.type) {
    case 'rotate':
      return objects.map((o) => (o.id === a.id ? rotateWorld(o, a.deg) : o));
    case 'reflect':
      return objects.map((o) => (o.id === a.id ? reflectWorld(o, a.axis) : o));
    case 'recolor':
      return objects.map((o) => (o.id === a.id ? { ...o, color: a.color } : o));
    case 'resize':
      return objects.map((o) => (o.id === a.id ? { ...o, scale: a.scale } : o));
    case 'move':
      return objects.map((o) => (o.id === a.id ? { ...o, x: snap(a.x), y: snap(a.y) } : o));
    case 'add':
      if (objects.length >= MAX_OBJECTS || objects.some((o) => o.id === a.id)) return objects;
      return [...objects, { ...a.template, id: a.id, x: snap(a.x), y: snap(a.y), zIndex: objects.length + 1 }];
    case 'remove':
      return objects.length <= 1 ? objects : objects.filter((o) => o.id !== a.id);
  }
}

export function stateAt(h: LabHistory, cursor = h.cursor): VisualObject[] {
  return h.actions.slice(0, cursor).reduce(applyAction, h.initial);
}

export function dispatch(h: LabHistory, a: LabAction): LabHistory {
  const before = stateAt(h);
  const after = applyAction(before, a);
  if (after === before) return h; // no-op (e.g. remove last object) is not recorded
  return { ...h, actions: [...h.actions.slice(0, h.cursor), a], cursor: h.cursor + 1 };
}

export const canUndo = (h: LabHistory) => h.cursor > 0;
export const canRedo = (h: LabHistory) => h.cursor < h.actions.length;
export const undo = (h: LabHistory): LabHistory => (canUndo(h) ? { ...h, cursor: h.cursor - 1 } : h);
export const redo = (h: LabHistory): LabHistory => (canRedo(h) ? { ...h, cursor: h.cursor + 1 } : h);
export const reset = (h: LabHistory): LabHistory => createHistory(h.initial);

/** Frames for replay: initial state followed by the state after each applied action. */
export function replayFrames(h: LabHistory): VisualObject[][] {
  const frames: VisualObject[][] = [h.initial];
  for (let i = 1; i <= h.cursor; i++) frames.push(stateAt(h, i));
  return frames;
}

/** Map lesson-level allowed actions to toolbar capabilities. */
export function capabilities(allowed: AllowedAction[]) {
  return {
    rotate90: allowed.includes('rotate-90-cw') || allowed.includes('rotate-90-ccw'),
    rotate45: allowed.includes('rotate-45'),
    reflectVertical: allowed.includes('reflect-x'),
    reflectHorizontal: allowed.includes('reflect-y'),
    recolor: allowed.includes('change-color'),
    resize: allowed.includes('resize'),
    move: allowed.includes('reposition'),
    add: allowed.includes('add-element'),
    remove: allowed.includes('remove-element'),
  };
}

export function nextScale(current: number, dir: 1 | -1): number {
  const idx = SCALE_STEPS.reduce((best, s, i) => (Math.abs(s - current) < Math.abs(SCALE_STEPS[best] - current) ? i : best), 0);
  return SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, Math.max(0, idx + dir))];
}

// ---------------------------------------------------------------------------
// Feedback: explain *what* still differs, and *why* a solution worked
// ---------------------------------------------------------------------------

export interface LabFeedback {
  matched: boolean;
  hints: string[]; // child-friendly, about the closest object
}

export function compareToTarget(current: VisualObject[], target: VisualObject[], tol: MatchTolerance = DEFAULT_TOLERANCE): LabFeedback {
  if (sameScene(current, target, tol)) return { matched: true, hints: [] };
  const hints: string[] = [];
  if (current.length !== target.length) {
    hints.push(current.length < target.length ? `The target has ${target.length} pieces. You have ${current.length}.` : `The target has only ${target.length}. Try removing one.`);
    return { matched: false, hints };
  }
  // Compare each target object with the most similar current object of the same shape.
  const used = new Set<number>();
  for (const t of target) {
    let bestIdx = -1;
    let bestScore = -1;
    current.forEach((c, i) => {
      if (used.has(i) || c.shape !== t.shape) return;
      const score =
        (sameOrientation(c.shape, orientationOf(c), orientationOf(t), tol.rotationDeg) ? 4 : 0) +
        (c.color.toLowerCase() === t.color.toLowerCase() ? 2 : 0) +
        (Math.abs((c.scale || 1) - (t.scale || 1)) <= tol.scale ? 1 : 0) +
        (Math.abs(c.x - t.x) <= tol.position && Math.abs(c.y - t.y) <= tol.position ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestIdx < 0) {
      hints.push(`Look for a ${t.shape} in the target. Its shape is different from yours.`);
      continue;
    }
    used.add(bestIdx);
    const c = current[bestIdx];
    if (sameObject(c, t, tol)) continue;
    const co = canonicalOrientation(c.shape, orientationOf(c));
    const to = canonicalOrientation(t.shape, orientationOf(t));
    if (co.m !== to.m) hints.push('It looks like the mirror image. Does it need a flip?');
    else if (!sameOrientation(c.shape, orientationOf(c), orientationOf(t), tol.rotationDeg)) hints.push('Same shape, different direction. Try turning it.');
    if (c.color.toLowerCase() !== t.color.toLowerCase()) hints.push(`Check the colour. The target is ${colorName(t.color)}.`);
    if (Math.abs((c.scale || 1) - (t.scale || 1)) > tol.scale) hints.push((c.scale || 1) < (t.scale || 1) ? 'The target is bigger.' : 'The target is smaller.');
    if (Math.abs(c.x - t.x) > tol.position || Math.abs(c.y - t.y) > tol.position) hints.push('Check where it sits in the box.');
  }
  return { matched: false, hints: hints.slice(0, 2) };
}

/** Summarise the net effect of the applied actions, so a child can see *why* it worked. */
export function explainSolution(h: LabHistory): string {
  const applied = h.actions.slice(0, h.cursor);
  if (applied.length === 0) return 'It already matched. Nothing needed to change.';
  const parts: string[] = [];
  const turns = applied.filter((a): a is Extract<LabAction, { type: 'rotate' }> => a.type === 'rotate');
  const flips = applied.filter((a): a is Extract<LabAction, { type: 'reflect' }> => a.type === 'reflect');
  if (turns.length) {
    const net = turns.reduce((s, a) => s + a.deg, 0);
    const n = ((net % 360) + 360) % 360;
    if (n === 0) parts.push('your turns added up to a full circle');
    else parts.push(n <= 180 ? `you turned it ${n}° clockwise in total` : `you turned it ${360 - n}° counterclockwise in total`);
  }
  if (flips.length) {
    const v = flips.filter((f) => f.axis === 'vertical').length % 2;
    const hz = flips.filter((f) => f.axis === 'horizontal').length % 2;
    if (v && hz) parts.push('two flips in different directions, which is the same as a half turn');
    else if (v) parts.push('one left-right flip made the mirror image');
    else if (hz) parts.push('one up-down flip made the mirror image');
    else parts.push('your flips cancelled each other out');
  }
  if (applied.some((a) => a.type === 'recolor')) parts.push('you changed the colour');
  if (applied.some((a) => a.type === 'resize')) parts.push('you changed the size');
  if (applied.some((a) => a.type === 'move')) parts.push('you moved it');
  if (applied.some((a) => a.type === 'add' || a.type === 'remove')) parts.push('you changed how many pieces there are');
  const final = stateAt(h);
  const first = final[0];
  const tail = first && first.shape === 'arrow' ? ` Now it points ${directionWord(orientationOf(first).r)}.` : '';
  return `It matched because ${parts.join(', and ')}.${tail}`;
}

/** Short action label for logs (no raw pointer traces). */
export const actionLabel = (a: LabAction): string =>
  a.type === 'rotate' ? `rotate_${a.deg}` : a.type === 'reflect' ? `reflect_${a.axis}` : a.type;
