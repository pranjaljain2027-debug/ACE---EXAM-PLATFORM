import type { ShapeType, VisualObject } from '../types/reasoning';

/**
 * Orientation model.
 * A shape's orientation is (r, m): first mirror across its own vertical axis if m, then rotate r degrees clockwise.
 * This matches the SVG transform `rotate(r) scale(m ? -1 : 1, 1)`.
 * VisualObject.reflectedY is folded in: scale(1,-1) = rotate(180) * scale(-1,1).
 */
export interface Orientation {
  r: number; // 0..359, clockwise
  m: boolean; // mirrored
}

export const norm360 = (deg: number): number => ((Math.round(deg) % 360) + 360) % 360;

export function orientationOf(o: Pick<VisualObject, 'rotation' | 'reflectedX' | 'reflectedY'>): Orientation {
  const x = Boolean(o.reflectedX);
  const y = Boolean(o.reflectedY);
  if (x && y) return { r: norm360(o.rotation + 180), m: false };
  if (y) return { r: norm360(o.rotation + 180), m: true };
  return { r: norm360(o.rotation), m: x };
}

/**
 * Symmetry of each shape as drawn at r=0.
 * rotationPeriod: smallest rotation that leaves the shape unchanged (360 = none).
 * mirrorAxis: angle (degrees from vertical, clockwise) of a mirror axis, or null if the shape is chiral.
 */
export const SHAPE_SYMMETRY: Record<ShapeType, { rotationPeriod: number; mirrorAxis: number | null }> = {
  circle: { rotationPeriod: 1, mirrorAxis: 0 },
  square: { rotationPeriod: 90, mirrorAxis: 0 },
  hexagon: { rotationPeriod: 60, mirrorAxis: 0 },
  star: { rotationPeriod: 72, mirrorAxis: 0 },
  triangle: { rotationPeriod: 120, mirrorAxis: 0 },
  diamond: { rotationPeriod: 180, mirrorAxis: 0 },
  arrow: { rotationPeriod: 360, mirrorAxis: 0 },
  crescent: { rotationPeriod: 360, mirrorAxis: 90 },
  flag: { rotationPeriod: 360, mirrorAxis: null },
  ell: { rotationPeriod: 360, mirrorAxis: null },
};

/** Canonical orientation: two objects look identical iff their canonical orientations are equal. */
export function canonicalOrientation(shape: ShapeType, o: Orientation): Orientation {
  const sym = SHAPE_SYMMETRY[shape] ?? { rotationPeriod: 360, mirrorAxis: null };
  let { r, m } = o;
  if (m && sym.mirrorAxis !== null) {
    // Mirror across own axis at angle a equals rot(2a) * mirrorX, so mirrorX = rot(-2a) * mirror_a ~ rot(-2a).
    r = norm360(r - 2 * sym.mirrorAxis);
    m = false;
  }
  if (sym.rotationPeriod <= 1) return { r: 0, m };
  r = norm360(r) % sym.rotationPeriod;
  return { r, m };
}

export function sameOrientation(shape: ShapeType, a: Orientation, b: Orientation, toleranceDeg = 3): boolean {
  const ca = canonicalOrientation(shape, a);
  const cb = canonicalOrientation(shape, b);
  if (ca.m !== cb.m) return false;
  const period = Math.min(360, Math.max(1, SHAPE_SYMMETRY[shape]?.rotationPeriod ?? 360));
  if (period <= 1) return true;
  const d = Math.abs(ca.r - cb.r) % period;
  return Math.min(d, period - d) <= toleranceDeg;
}

/** World-space transformations (what a child sees on screen), returned as an updated object with reflectedY folded away. */
export function rotateWorld(o: VisualObject, deltaDeg: number): VisualObject {
  const ori = orientationOf(o);
  return { ...o, rotation: norm360(ori.r + deltaDeg), reflectedX: ori.m, reflectedY: false };
}

/** Mirror across the screen's vertical line (left-right flip) or horizontal line (up-down flip). */
export function reflectWorld(o: VisualObject, axis: 'vertical' | 'horizontal'): VisualObject {
  const ori = orientationOf(o);
  // mirrorX_world * rot(r) * mirrorX^m = rot(-r) * mirrorX^(m+1); mirrorY_world = rot(180) * mirrorX_world
  const r = axis === 'vertical' ? norm360(-ori.r) : norm360(180 - ori.r);
  return { ...o, rotation: r, reflectedX: !ori.m, reflectedY: false };
}

export interface MatchTolerance {
  rotationDeg: number;
  position: number; // percentage units
  scale: number;
}

export const DEFAULT_TOLERANCE: MatchTolerance = { rotationDeg: 3, position: 9, scale: 0.12 };

export function sameObject(a: VisualObject, b: VisualObject, tol: MatchTolerance = DEFAULT_TOLERANCE): boolean {
  if (a.shape !== b.shape) return false;
  if (a.color.toLowerCase() !== b.color.toLowerCase()) return false;
  if (Math.abs((a.scale || 1) - (b.scale || 1)) > tol.scale) return false;
  if (Math.abs(a.x - b.x) > tol.position || Math.abs(a.y - b.y) > tol.position) return false;
  return sameOrientation(a.shape, orientationOf(a), orientationOf(b), tol.rotationDeg);
}

/** Order-independent comparison of two scenes (multiset matching). */
export function sameScene(a: VisualObject[], b: VisualObject[], tol: MatchTolerance = DEFAULT_TOLERANCE): boolean {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  return a.every((x) => {
    const i = b.findIndex((y, idx) => !used[idx] && sameObject(x, y, tol));
    if (i < 0) return false;
    used[i] = true;
    return true;
  });
}

/** A stable signature for a scene, used to guarantee answer options are visually distinct. */
export function sceneSignature(objs: VisualObject[]): string {
  return objs
    .map((o) => {
      const c = canonicalOrientation(o.shape, orientationOf(o));
      return [o.shape, c.r, c.m ? 1 : 0, o.color.toLowerCase(), (o.scale || 1).toFixed(2), Math.round(o.x / 5) * 5, Math.round(o.y / 5) * 5].join(':');
    })
    .sort()
    .join('|');
}

export function directionWord(r: number): string {
  const d = norm360(r);
  const names: Record<number, string> = { 0: 'up', 45: 'up-right', 90: 'right', 135: 'down-right', 180: 'down', 225: 'down-left', 270: 'left', 315: 'up-left' };
  return names[d] ?? `${d}°`;
}
