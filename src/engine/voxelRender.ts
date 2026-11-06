/**
 * Deterministic SVG projection for voxel shapes (plan §6 visual conventions).
 * No WebGL: unit cubes need only an orthographic camera, back-face culling and depth ordering.
 * The same functions feed the on-screen renderer and the validator's visual-distinguishability check.
 */
import type { Axis, Cell } from './voxel';

export type Vec3 = [number, number, number];
export type Mat3 = [number, number, number, number, number, number, number, number, number];

export const I3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const mul = (a: Mat3, b: Mat3): Mat3 => [
  a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
];
export const apply = (m: Mat3, v: Vec3): Vec3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
export const det = (m: Mat3) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);

/** Right-hand rotation about a principal axis, angle in degrees. */
export function axisRotation(axis: Axis, deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  if (axis === 'x') return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 'y') return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
export const axisScale = (axis: Axis, s: number): Mat3 => (axis === 'x' ? [s, 0, 0, 0, 1, 0, 0, 0, 1] : axis === 'y' ? [1, 0, 0, 0, s, 0, 0, 0, 1] : [1, 0, 0, 0, 1, 0, 0, 0, s]);

/** Fixed camera: turned 35° around the vertical and tilted 25° down, so three faces of each cube show. */
export const CAMERA: Mat3 = mul(axisRotation('x', 25), axisRotation('y', -35));
const LIGHT: Vec3 = (() => { const v: Vec3 = [-0.45, 0.75, 0.5]; const n = Math.hypot(...v); return [v[0] / n, v[1] / n, v[2] / n]; })();

const FACES: { n: Vec3; u: Vec3; v: Vec3; tag: string }[] = [
  { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], tag: 'x+' },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], tag: 'x-' },
  { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], tag: 'y+' },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], tag: 'y-' },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], tag: 'z+' },
  { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0], tag: 'z-' },
];

export interface ProjectedFace {
  points: [number, number][];
  depth: number;
  shade: number; // 0..1 lambert
  normalClass: string; // which screen-facing direction, for signatures
  cell: Cell;
}

/** Faces of the shape after object transform `obj`, viewed through CAMERA. Painter-ordered (far first). */
export function projectShape(cells: Cell[], obj: Mat3 = I3, camera: Mat3 = CAMERA): ProjectedFace[] {
  const set = new Set(cells.map((c) => c.join(',')));
  const ctr: Vec3 = [0, 1, 2].map((a) => (Math.min(...cells.map((c) => c[a])) + Math.max(...cells.map((c) => c[a]))) / 2) as Vec3;
  const m = mul(camera, obj);
  const sign = Math.sign(det(obj)) || 1;
  const faces: ProjectedFace[] = [];
  for (const cell of cells) {
    for (const f of FACES) {
      if (set.has([cell[0] + f.n[0], cell[1] + f.n[1], cell[2] + f.n[2]].join(','))) continue; // internal face
      const c: Vec3 = [cell[0] - ctr[0] + f.n[0] * 0.5, cell[1] - ctr[1] + f.n[1] * 0.5, cell[2] - ctr[2] + f.n[2] * 0.5];
      const corners: Vec3[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [
        c[0] + 0.5 * (a * f.u[0] + b * f.v[0]), c[1] + 0.5 * (a * f.u[1] + b * f.v[1]), c[2] + 0.5 * (a * f.u[2] + b * f.v[2]),
      ]);
      const t = corners.map((p) => apply(m, p));
      const e1: Vec3 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]];
      const e2: Vec3 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
      let n: Vec3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const len = Math.hypot(...n);
      if (len < 1e-6) continue; // edge-on while flattening during a mirror replay
      n = [(n[0] / len) * sign, (n[1] / len) * sign, (n[2] / len) * sign];
      if (n[2] <= 1e-4) continue; // back face
      const depth = t.reduce((s, p) => s + p[2], 0) / 4;
      const shade = 0.42 + 0.58 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const dominant = Math.abs(n[1]) > 0.6 ? 'top' : n[0] > 0 ? 'right' : 'left';
      faces.push({ points: t.map((p) => [p[0], -p[1]]), depth, shade, normalClass: dominant, cell });
    }
  }
  return faces.sort((a, b) => a.depth - b.depth);
}

export function bounds(faces: ProjectedFace[]) {
  const xs = faces.flatMap((f) => f.points.map((p) => p[0]));
  const ys = faces.flatMap((f) => f.points.map((p) => p[1]));
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

const inside = (pt: [number, number], poly: [number, number][]) => {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) r = !r;
  }
  return r;
};

/**
 * Rasterised appearance (which face direction covers each sample point), at a fixed scale.
 * Two options with the same signature would look identical to a child, so the validator rejects them.
 */
export function visualSignature(cells: Cell[], obj: Mat3 = I3, n = 44, extent = 4.2): string {
  const faces = projectShape(cells, obj);
  let s = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const pt: [number, number] = [((c + 0.5) / n - 0.5) * 2 * extent, ((r + 0.5) / n - 0.5) * 2 * extent];
    let v = '.';
    for (const f of faces) if (inside(pt, f.points)) v = f.normalClass[0];
    s += v;
  }
  return s;
}
