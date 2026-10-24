/**
 * Voxel geometry (plan §2, §5.1, §6). Pure functions, no rendering.
 *
 * Coordinate system: right-handed, +X right, +Y up, +Z toward the viewer in the canonical front view.
 * Rotations are integer quarter-turns about a principal axis, positive by the right-hand rule
 * (counterclockwise when looking from the positive end of the axis toward the origin).
 * Equivalence is translation-invariant and orientation-sensitive: mirror images are NOT equal.
 */

export type Cell = [number, number, number];
export type Axis = 'x' | 'y' | 'z';
export type Side = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export const MAX_EXTENT = 5;
export const MAX_CELLS = 12;

export function validateShape(cells: unknown, opts: { connected?: boolean } = { connected: true }): string[] {
  const errs: string[] = [];
  if (!Array.isArray(cells) || cells.length === 0) return ['shape_empty'];
  if (cells.length > MAX_CELLS) errs.push('shape_too_many_cells');
  const seen = new Set<string>();
  for (const c of cells) {
    if (!Array.isArray(c) || c.length !== 3 || !c.every((v) => Number.isInteger(v))) {
      errs.push('cell_not_integer_triple');
      continue;
    }
    const k = c.join(',');
    if (seen.has(k)) errs.push(`duplicate_cell_${k}`);
    seen.add(k);
  }
  if (errs.length) return errs;
  const cs = cells as Cell[];
  for (const ax of [0, 1, 2]) {
    const vals = cs.map((c) => c[ax]);
    if (Math.max(...vals) - Math.min(...vals) + 1 > MAX_EXTENT) errs.push('shape_too_large');
  }
  if (opts.connected !== false && !isConnected(cs)) errs.push('shape_disconnected');
  return errs;
}

export function isConnected(cells: Cell[]): boolean {
  if (!cells.length) return false;
  const set = new Set(cells.map((c) => c.join(',')));
  const seen = new Set<string>([cells[0].join(',')]);
  const stack = [cells[0]];
  while (stack.length) {
    const [x, y, z] = stack.pop()!;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const k = `${x + dx},${y + dy},${z + dz}`;
      if (set.has(k) && !seen.has(k)) {
        seen.add(k);
        stack.push([x + dx, y + dy, z + dz]);
      }
    }
  }
  return seen.size === set.size;
}

/** Translate so every axis starts at 0, then sort. Defines the canonical form for equality. */
export function normalize(cells: Cell[]): Cell[] {
  const min = [0, 1, 2].map((a) => Math.min(...cells.map((c) => c[a])));
  return cells
    .map((c) => [c[0] - min[0], c[1] - min[1], c[2] - min[2]] as Cell)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

export const shapeKey = (cells: Cell[]): string => normalize(cells).map((c) => c.join(',')).join(';');
export const sameShape = (a: Cell[], b: Cell[]): boolean => shapeKey(a) === shapeKey(b);

const rot1 = (c: Cell, axis: Axis): Cell => {
  const [x, y, z] = c;
  if (axis === 'x') return [x, -z, y];
  if (axis === 'y') return [z, y, -x];
  return [-y, x, z];
};

/** Rotate by `turns` quarter-turns (negative = clockwise when seen from the positive end of the axis). */
export function rotate(cells: Cell[], axis: Axis, turns: number): Cell[] {
  const n = ((turns % 4) + 4) % 4;
  let out = cells.map((c) => [...c] as Cell);
  for (let i = 0; i < n; i++) out = out.map((c) => rot1(c, axis));
  return normalize(out);
}

/** Reflect across a plane perpendicular to `normalAxis` (e.g. 'x' = a vertical mirror facing left/right). */
export function reflect(cells: Cell[], normalAxis: Axis): Cell[] {
  const i = { x: 0, y: 1, z: 2 }[normalAxis];
  return normalize(cells.map((c) => { const d = [...c] as Cell; d[i] = -d[i]; return d; }));
}

/** All 24 proper orientations. */
export function allOrientations(cells: Cell[]): Cell[][] {
  const out = new Map<string, Cell[]>();
  let base = normalize(cells);
  const ups: Cell[][] = [base, rotate(base, 'x', 1), rotate(base, 'x', 2), rotate(base, 'x', 3), rotate(base, 'z', 1), rotate(base, 'z', 3)];
  for (const u of ups) for (let t = 0; t < 4; t++) {
    const r = rotate(u, 'y', t);
    out.set(shapeKey(r), r);
  }
  return [...out.values()];
}

/** True if b is a rotation of a (same object, any orientation). Mirror images are not congruent unless the shape is achiral. */
export const congruentByRotation = (a: Cell[], b: Cell[]): boolean => allOrientations(a).some((o) => sameShape(o, b));

/** True if the shape equals its own mirror image up to rotation. Chiral shapes make mirror questions meaningful. */
export const isAchiral = (cells: Cell[]): boolean => congruentByRotation(cells, reflect(cells, 'x'));

/** Shape unchanged by this rotation (would make a rotation question trivial). */
export const rotationInvariant = (cells: Cell[], axis: Axis, turns: number) => sameShape(cells, rotate(cells, axis, turns));

// ---------------------------------------------------------------------------
// Views (orthographic silhouettes)
// ---------------------------------------------------------------------------

/**
 * Viewer conventions, all with up = +Y except top/bottom:
 *  front: viewer on +Z looking toward -Z, screen-right = +X
 *  back:  viewer on -Z, screen-right = -X
 *  right: viewer on +X looking toward -X, screen-right = -Z
 *  left:  viewer on -X, screen-right = +Z
 *  top:   viewer above looking down, screen-up = -Z (the far side), screen-right = +X
 *  bottom: viewer below looking up, screen-up = +Z, screen-right = +X
 * Returned grid rows run top-to-bottom on screen; '#' filled, '.' empty.
 */
export function view(cells: Cell[], side: Side): string[] {
  const proj = cells.map(([x, y, z]) => {
    switch (side) {
      case 'front': return [x, y];
      case 'back': return [-x, y];
      case 'right': return [-z, y];
      case 'left': return [z, y];
      case 'top': return [x, -z];
      case 'bottom': return [x, z];
    }
  });
  const minC = Math.min(...proj.map((p) => p[0]));
  const maxC = Math.max(...proj.map((p) => p[0]));
  const minR = Math.min(...proj.map((p) => p[1]));
  const maxR = Math.max(...proj.map((p) => p[1]));
  const rows: string[] = [];
  for (let up = maxR; up >= minR; up--) {
    let row = '';
    for (let c = minC; c <= maxC; c++) row += proj.some((p) => p[0] === c && p[1] === up) ? '#' : '.';
    rows.push(row);
  }
  return rows;
}

export const gridKey = (g: string[]) => g.join('/');
export const mirrorGrid = (g: string[]) => g.map((r) => [...r].reverse().join(''));
export const flipGridVertical = (g: string[]) => [...g].reverse();
export const transposeGrid = (g: string[]) => [...g[0]].map((_, c) => g.map((r) => r[c]).join(''));

export function validateGrid(g: unknown): string[] {
  if (!Array.isArray(g) || !g.length || !g.every((r) => typeof r === 'string' && /^[#.]+$/.test(r))) return ['grid_invalid'];
  if (new Set(g.map((r: string) => r.length)).size !== 1) return ['grid_ragged'];
  if (!g.some((r: string) => r.includes('#'))) return ['grid_empty'];
  return [];
}

export const sideLabel: Record<Side, string> = { front: 'the front', back: 'the back', left: 'the left side', right: 'the right side', top: 'above', bottom: 'below' };
