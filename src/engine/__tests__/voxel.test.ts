import { describe, expect, it } from 'vitest';
import { allOrientations, congruentByRotation, isAchiral, isConnected, normalize, reflect, rotate, rotationInvariant, sameShape, validateShape, view, type Cell } from '../voxel';
import { projectShape, visualSignature, axisScale } from '../voxelRender';

const L: Cell[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]];
// A chiral 4-cube "screw" (tetracube that has a distinct mirror image).
const CHIRAL: Cell[] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]];

describe('voxel shape validation', () => {
  it('rejects empty, duplicate, non-integer, disconnected and oversized shapes', () => {
    expect(validateShape([])).toContain('shape_empty');
    expect(validateShape([[0, 0, 0], [0, 0, 0]])).toContain('duplicate_cell_0,0,0');
    expect(validateShape([[0, 0.5, 0]])).toContain('cell_not_integer_triple');
    expect(validateShape([[0, 0, 0], [2, 0, 0]])).toContain('shape_disconnected');
    expect(validateShape([0, 1, 2, 3, 4, 5].map((x) => [x, 0, 0]))).toContain('shape_too_large');
    expect(validateShape(L)).toEqual([]);
    expect(isConnected(L)).toBe(true);
  });
});

describe('rotation conventions (right-hand rule, Y up)', () => {
  it('a +90° turn about Y sends +X toward -Z', () => {
    // [1,0,0] -> [0,0,-1]: the arm pointing right ends up pointing away from the viewer.
    expect(sameShape(rotate([[0, 0, 0], [1, 0, 0]], 'y', 1), [[0, 0, -1], [0, 0, 0]])).toBe(true);
    const r = rotate([[0, 0, 0], [1, 0, 0], [0, 1, 0]], 'y', 1);
    expect(sameShape(r, normalize([[0, 0, 0], [0, 0, -1], [0, 1, 0]]))).toBe(true);
  });
  it('a +90° turn about Z sends +X toward +Y', () => {
    expect(sameShape(rotate([[0, 0, 0], [1, 0, 0], [0, 0, 1]], 'z', 1), [[0, 0, 0], [0, 1, 0], [0, 0, 1]])).toBe(true);
  });
  it('a +90° turn about X sends +Y toward +Z', () => {
    expect(sameShape(rotate([[0, 0, 0], [0, 1, 0], [1, 0, 0]], 'x', 1), [[0, 0, 0], [0, 0, 1], [1, 0, 0]])).toBe(true);
  });
  it('four quarter turns is the identity and -1 equals +3', () => {
    for (const a of ['x', 'y', 'z'] as const) {
      expect(sameShape(rotate(L, a, 4), L)).toBe(true);
      expect(sameShape(rotate(L, a, -1), rotate(L, a, 3))).toBe(true);
    }
  });
  it('equality is translation invariant', () => {
    expect(sameShape(L, L.map(([x, y, z]) => [x + 3, y - 2, z + 7] as Cell))).toBe(true);
  });
});

describe('orientations and chirality', () => {
  it('an asymmetric shape has 24 orientations; the screw has 12 (half-turn symmetry); a bar has 3', () => {
    expect(allOrientations([[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1]])).toHaveLength(24);
    expect(allOrientations(CHIRAL)).toHaveLength(12);
    expect(allOrientations([[0, 0, 0], [1, 0, 0], [2, 0, 0]])).toHaveLength(3);
  });
  it('a mirror image of a chiral shape is not reachable by rotation', () => {
    expect(isAchiral(CHIRAL)).toBe(false);
    expect(congruentByRotation(CHIRAL, reflect(CHIRAL, 'x'))).toBe(false);
    expect(congruentByRotation(CHIRAL, rotate(CHIRAL, 'z', 1))).toBe(true);
  });
  it('a flat L is achiral (its mirror is a turned copy)', () => {
    expect(isAchiral(L)).toBe(true);
  });
  it('detects rotation-invariant cases so trivial questions are rejected', () => {
    const bar: Cell[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0]];
    expect(rotationInvariant(bar, 'x', 1)).toBe(true);
    expect(rotationInvariant(L, 'z', 1)).toBe(false);
  });
});

describe('orthographic views', () => {
  it('front view of the L is an L with the tall part on the left', () => {
    expect(view(L, 'front')).toEqual(['#..', '###']);
  });
  it('back view is the front view mirrored left to right', () => {
    expect(view(L, 'back')).toEqual(['..#', '###']);
  });
  it('top view puts the far side (-Z) at the top', () => {
    const s: Cell[] = [[0, 0, 0], [1, 0, 0], [0, 0, -1]];
    expect(view(s, 'top')).toEqual(['#.', '##']);
  });
  it('right view puts the far side (-Z) on the right', () => {
    const s: Cell[] = [[0, 0, 0], [0, 0, -1], [0, 1, -1]];
    expect(view(s, 'right')).toEqual(['.#', '##']);
    expect(view(s, 'left')).toEqual(['#.', '##']);
  });
});

describe('projection', () => {
  it('culls internal faces and shows at most three faces per exposed cube', () => {
    const faces = projectShape([[0, 0, 0]]);
    expect(faces).toHaveLength(3);
    const two = projectShape([[0, 0, 0], [1, 0, 0]]);
    expect(two.length).toBeLessThanOrEqual(5);
  });
  it('keeps outward normals when an object transform mirrors the shape', () => {
    expect(projectShape([[0, 0, 0]], axisScale('x', -1))).toHaveLength(3);
  });
  it('different orientations of a chiral shape look different', () => {
    expect(visualSignature(CHIRAL)).not.toBe(visualSignature(rotate(CHIRAL, 'y', 1)));
    expect(visualSignature(CHIRAL)).not.toBe(visualSignature(reflect(CHIRAL, 'x')));
  });
});
