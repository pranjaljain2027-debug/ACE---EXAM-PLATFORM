import { describe, expect, it } from 'vitest';
import type { VisualObject } from '../../types/reasoning';
import { canonicalOrientation, orientationOf, reflectWorld, rotateWorld, sameObject, sameScene } from '../geometry';
import {
  applyAction,
  canRedo,
  canUndo,
  capabilities,
  compareToTarget,
  createHistory,
  dispatch,
  explainSolution,
  redo,
  replayFrames,
  reset,
  snap,
  stateAt,
  undo,
  GRID_STEP,
  PALETTE,
  SCALE_STEPS,
  type LabAction,
} from '../shapeLab';
import { LESSONS } from '../../content/lessons';

const obj = (shape: VisualObject['shape'], extra: Partial<VisualObject> = {}): VisualObject => ({
  id: 'a', shape, x: 50, y: 50, rotation: 0, scale: 1, color: '#233D5B', reflectedX: false, reflectedY: false, zIndex: 1, ...extra,
});

describe('geometry: semantic equivalence, not pixels', () => {
  it('treats orientations modulo 360', () => {
    expect(sameObject(obj('arrow', { rotation: 450 }), obj('arrow', { rotation: 90 }))).toBe(true);
    expect(sameObject(obj('arrow', { rotation: -90 }), obj('arrow', { rotation: 270 }))).toBe(true);
  });

  it('uses each shape\'s symmetry', () => {
    expect(sameObject(obj('square', { rotation: 90 }), obj('square'))).toBe(true);
    expect(sameObject(obj('triangle', { rotation: 120 }), obj('triangle'))).toBe(true);
    expect(sameObject(obj('triangle', { rotation: 90 }), obj('triangle'))).toBe(false);
    expect(sameObject(obj('circle', { rotation: 37, reflectedX: true }), obj('circle'))).toBe(true);
    expect(sameObject(obj('arrow', { reflectedX: true }), obj('arrow'))).toBe(true); // arrow mirrors onto itself
    expect(sameObject(obj('ell', { reflectedX: true }), obj('ell'))).toBe(false); // chiral
  });

  it('both reflections equal a half turn', () => {
    expect(sameObject(obj('ell', { reflectedX: true, reflectedY: true }), obj('ell', { rotation: 180 }))).toBe(true);
    expect(sameObject(obj('flag', { reflectedY: true }), reflectWorld(obj('flag'), 'horizontal'))).toBe(true);
  });

  it('flips across the screen axis even after a turn', () => {
    // An arrow pointing right, flipped left-right, must point left (the old canvas flipped it in place).
    const right = rotateWorld(obj('arrow'), 90);
    const flipped = reflectWorld(right, 'vertical');
    expect(sameObject(flipped, obj('arrow', { rotation: 270 }))).toBe(true);
    // Flipping up-down twice returns the original.
    const twice = reflectWorld(reflectWorld(obj('ell', { rotation: 90 }), 'horizontal'), 'horizontal');
    expect(sameObject(twice, obj('ell', { rotation: 90 }))).toBe(true);
  });

  it('canonical orientation of crescent folds its mirror into a half turn', () => {
    const c = canonicalOrientation('crescent', { r: 0, m: true });
    expect(c).toEqual({ r: 180, m: false });
  });

  it('matches scenes regardless of object order', () => {
    const a = [obj('ell', { id: '1', x: 25 }), obj('flag', { id: '2', x: 75 })];
    const b = [obj('flag', { id: 'x', x: 75 }), obj('ell', { id: 'y', x: 25 })];
    expect(sameScene(a, b)).toBe(true);
  });
});

describe('Shape Lab history', () => {
  const start = [obj('flag')];
  const rot: LabAction = { type: 'rotate', id: 'a', deg: 90 };
  const flip: LabAction = { type: 'reflect', id: 'a', axis: 'vertical' };

  it('undo, redo and reset are deterministic', () => {
    let h = createHistory(start);
    h = dispatch(h, rot);
    h = dispatch(h, flip);
    const after = stateAt(h);
    h = undo(h);
    expect(canRedo(h)).toBe(true);
    expect(sameScene(stateAt(h), [rotateWorld(start[0], 90)])).toBe(true);
    h = redo(h);
    expect(sameScene(stateAt(h), after)).toBe(true);
    h = reset(h);
    expect(canUndo(h)).toBe(false);
    expect(sameScene(stateAt(h), start)).toBe(true);
  });

  it('a new action after undo discards the redo branch', () => {
    let h = dispatch(dispatch(createHistory(start), rot), rot);
    h = undo(h);
    h = dispatch(h, flip);
    expect(h.actions.length).toBe(2);
    expect(canRedo(h)).toBe(false);
  });

  it('replaying the log twice yields the same frames', () => {
    let h = createHistory(start);
    for (const a of [rot, flip, rot, { type: 'recolor', id: 'a', color: PALETTE[1].hex } as LabAction]) h = dispatch(h, a);
    expect(replayFrames(h)).toEqual(replayFrames(JSON.parse(JSON.stringify(h))));
    expect(replayFrames(h)).toHaveLength(5);
  });

  it('snaps moves to the grid and keeps shapes inside the board', () => {
    expect(snap(51)).toBe(50);
    expect(snap(5)).toBe(GRID_STEP);
    expect(snap(99)).toBe(100 - GRID_STEP);
    const moved = applyAction(start, { type: 'move', id: 'a', x: 63, y: 41 });
    expect(moved[0].x).toBe(62.5);
    expect(moved[0].y).toBe(37.5);
  });

  it('does not record no-op actions (removing the last piece)', () => {
    const h = dispatch(createHistory(start), { type: 'remove', id: 'a' });
    expect(h.actions).toHaveLength(0);
  });

  it('every palette colour has a name (never colour alone)', () => {
    for (const p of PALETTE) expect(p.name.length).toBeGreaterThan(2);
  });

  it('explains why a solution worked and what still differs', () => {
    const target = [rotateWorld(start[0], 90)];
    let h = createHistory(start);
    expect(compareToTarget(stateAt(h), target).hints[0]).toMatch(/turning/i);
    h = dispatch(h, rot);
    expect(compareToTarget(stateAt(h), target).matched).toBe(true);
    expect(explainSolution(h)).toMatch(/90° clockwise/);
    const mirrored = [reflectWorld(start[0], 'vertical')];
    expect(compareToTarget(stateAt(createHistory(start)), mirrored).hints.join(' ')).toMatch(/mirror/i);
  });
});

/** Breadth-first search over the lesson's allowed actions: every Shape Lab goal must be reachable. */
function solvable(initial: VisualObject[], target: VisualObject[], allowed: Parameters<typeof capabilities>[0]): number | null {
  const caps = capabilities(allowed);
  const key = (s: VisualObject[]) => JSON.stringify(s.map((o) => [o.shape, canonicalOrientation(o.shape, orientationOf(o)), o.color, o.scale, o.x, o.y]).sort());
  const moves = (s: VisualObject[]): LabAction[] => {
    const out: LabAction[] = [];
    for (const o of s) {
      if (caps.rotate90) out.push({ type: 'rotate', id: o.id, deg: 90 }, { type: 'rotate', id: o.id, deg: -90 });
      if (caps.rotate45) out.push({ type: 'rotate', id: o.id, deg: 45 });
      if (caps.reflectVertical) out.push({ type: 'reflect', id: o.id, axis: 'vertical' });
      if (caps.reflectHorizontal) out.push({ type: 'reflect', id: o.id, axis: 'horizontal' });
      if (caps.recolor) for (const p of [...PALETTE.map((x) => x.hex), ...new Set(target.map((t) => t.color))]) out.push({ type: 'recolor', id: o.id, color: p });
      if (caps.resize) for (const sc of SCALE_STEPS) out.push({ type: 'resize', id: o.id, scale: sc });
      if (caps.move) for (const t of target) out.push({ type: 'move', id: o.id, x: t.x, y: t.y });
      if (caps.remove) out.push({ type: 'remove', id: o.id });
    }
    if (caps.add && s[0]) for (const t of target) out.push({ type: 'add', id: `n${s.length}`, template: s[0], x: t.x, y: t.y });
    return out;
  };
  const seen = new Set([key(initial)]);
  let frontier: VisualObject[][] = [initial];
  for (let depth = 0; depth <= 5; depth++) {
    for (const s of frontier) if (compareToTarget(s, target).matched) return depth;
    const next: VisualObject[][] = [];
    for (const s of frontier) for (const m of moves(s)) {
      const n = applyAction(s, m);
      const k = key(n);
      if (!seen.has(k)) { seen.add(k); next.push(n); }
    }
    frontier = next;
  }
  return null;
}

describe('lesson content: every Shape Lab goal is reachable with the lesson\'s own tools', () => {
  for (const l of LESSONS) {
    it(`${l.id} ${l.title}`, () => {
      expect(solvable(l.payload.initialState, l.payload.targetState, l.payload.allowedActions)).not.toBeNull();
    });
  }
});
