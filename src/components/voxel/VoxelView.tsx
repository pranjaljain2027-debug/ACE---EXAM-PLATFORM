/**
 * SVG cube-shape viewer (plan §6). Static for answer options; interactive for exploration
 * (drag, quarter-turn buttons, keyboard, reset); animated replay for explanations.
 * Respects reduced motion: turns snap instead of animating.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw, ArrowUpFromLine, ArrowDownFromLine, Undo2, Play } from 'lucide-react';
import type { Axis, Cell } from '../../engine/voxel';
import { I3, axisRotation, axisScale, mul, projectShape, type Mat3 } from '../../engine/voxelRender';

const BASE: Record<string, [number, number, number]> = {
  top: [214, 182, 128],
  left: [61, 98, 140],
  right: [84, 123, 98],
};

const shadeFill = (cls: string, shade: number) => {
  const [r, g, b] = BASE[cls] ?? BASE.left;
  const k = 0.55 + 0.6 * shade;
  return `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(g * k))},${Math.min(255, Math.round(b * k))})`;
};

function radiusFor(cells: Cell[]) {
  const ext = [0, 1, 2].map((a) => Math.max(...cells.map((c) => c[a])) - Math.min(...cells.map((c) => c[a])) + 1);
  return Math.max(2.6, Math.hypot(...ext) / 2 + 0.6);
}

export const VoxelSvg: React.FC<{ cells: Cell[]; obj?: Mat3; radius?: number; label: string; className?: string }> = ({ cells, obj = I3, radius, label, className = '' }) => {
  const faces = useMemo(() => projectShape(cells, obj), [cells, obj]);
  const R = radius ?? radiusFor(cells);
  return (
    <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} className={`w-full aspect-square ${className}`} role="img" aria-label={label}>
      {faces.map((f, i) => (
        <polygon key={i} points={f.points.map((p) => p.join(',')).join(' ')} fill={shadeFill(f.normalClass, f.shade)}
          stroke="#1c2b3b" strokeOpacity={0.55} strokeWidth={0.035} strokeLinejoin="round" />
      ))}
    </svg>
  );
};

export type Replay = { kind: 'rotate'; axis: Axis; turns: number } | { kind: 'mirror'; axis: Axis };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function useAnimator(reduced: boolean) {
  const raf = useRef<number | null>(null);
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  return useCallback((ms: number, step: (t: number) => void, done?: () => void) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (reduced) { step(1); done?.(); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      step(ease(t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else { raf.current = null; done?.(); }
    };
    raf.current = requestAnimationFrame(tick);
  }, [reduced]);
}

/**
 * Interactive viewer. `onAction` fires once per completed user action (turn, drag, reset) so the
 * session can record exploration. `replay` adds a "Watch it" button that animates the stated change.
 */
export const VoxelExplorer: React.FC<{
  cells: Cell[];
  label: string;
  reducedMotion?: boolean;
  interactive?: boolean;
  onAction?: () => void;
  replay?: Replay | null;
  replayLabel?: string;
}> = ({ cells, label, reducedMotion = false, interactive = true, onAction, replay, replayLabel = 'Watch it' }) => {
  const [obj, setObj] = useState<Mat3>(I3);
  const [busy, setBusy] = useState(false);
  const animate = useAnimator(reducedMotion);
  const drag = useRef<{ x: number; y: number; start: Mat3; moved: boolean } | null>(null);
  const R = useMemo(() => radiusFor(cells), [cells]);
  const [announce, setAnnounce] = useState('');

  const turn = (axis: Axis, dir: 1 | -1, words: string) => {
    if (busy) return;
    const start = obj;
    setBusy(true);
    animate(450, (t) => setObj(mul(axisRotation(axis, 90 * dir * t), start)), () => {
      // Snap to the exact quarter turn so repeated turns do not drift.
      setObj(mul(axisRotation(axis, 90 * dir), start).map((v) => Math.round(v * 1e6) / 1e6) as Mat3);
      setBusy(false);
      setAnnounce(`Turned ${words}.`);
      onAction?.();
    });
  };

  const reset = () => { setObj(I3); setAnnounce('Back to the start.'); onAction?.(); };

  const play = () => {
    if (!replay || busy) return;
    setBusy(true);
    setObj(I3);
    if (replay.kind === 'rotate') {
      animate(900, (t) => setObj(axisRotation(replay.axis, 90 * replay.turns * t)), () => { setBusy(false); setAnnounce('The turn is done.'); });
    } else {
      animate(900, (t) => setObj(axisScale(replay.axis, 1 - 2 * t)), () => { setBusy(false); setAnnounce('This is the mirror image.'); });
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || busy) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: obj, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setObj(mul(axisRotation('x', dy * 0.6), mul(axisRotation('y', dx * 0.6), d.start)));
  };
  const onPointerUp = () => {
    if (drag.current?.moved) onAction?.();
    drag.current = null;
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    const m: Record<string, [Axis, number]> = { ArrowLeft: ['y', -15], ArrowRight: ['y', 15], ArrowUp: ['x', -15], ArrowDown: ['x', 15] };
    const k = m[e.key];
    if (!k) return;
    e.preventDefault();
    setObj((o) => mul(axisRotation(k[0], k[1]), o));
    onAction?.();
  };

  const btn = 'inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-line bg-paper text-sm font-semibold text-navy hover:border-navy/40 disabled:opacity-40';
  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl border border-line bg-ivory ${interactive ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        tabIndex={interactive ? 0 : undefined} onKeyDown={onKey}
        aria-label={interactive ? `${label}. Drag or use the arrow keys to look around it.` : undefined}
      >
        <VoxelSvg cells={cells} obj={obj} radius={R} label={label} className="max-w-sm mx-auto" />
      </div>
      {(interactive || replay) && (
        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Shape controls">
          {interactive && (
            <>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('y', 1, 'so the front swings right')}><RotateCw className="w-4 h-4" aria-hidden /> Swing right</button>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('y', -1, 'so the front swings left')}><RotateCcw className="w-4 h-4" aria-hidden /> Swing left</button>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('x', 1, 'so the top tips toward you')}><ArrowDownFromLine className="w-4 h-4" aria-hidden /> Tip toward me</button>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('x', -1, 'so the top tips away')}><ArrowUpFromLine className="w-4 h-4" aria-hidden /> Tip away</button>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('z', 1, 'like a steering wheel to the left')}><RotateCcw className="w-4 h-4" aria-hidden /> Wheel left</button>
              <button type="button" className={btn} disabled={busy} onClick={() => turn('z', -1, 'like a steering wheel to the right')}><RotateCw className="w-4 h-4" aria-hidden /> Wheel right</button>
              <button type="button" className={btn} disabled={busy} onClick={reset}><Undo2 className="w-4 h-4" aria-hidden /> Reset</button>
            </>
          )}
          {replay && <button type="button" className={`${btn} border-ochre`} disabled={busy} onClick={play}><Play className="w-4 h-4" aria-hidden /> {replayLabel}</button>}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
};

/** Flat view drawn as a grid of squares (viewpoint answers). */
export const GridSvg: React.FC<{ grid: string[]; label: string }> = ({ grid, label }) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const n = Math.max(rows, cols, 3);
  return (
    <svg viewBox={`-0.3 -0.3 ${n + 0.6} ${n + 0.6}`} className="w-full aspect-square" role="img" aria-label={label}>
      {grid.flatMap((r, y) => [...r].map((ch, x) => (
        <rect key={`${x}-${y}`} x={x + (n - cols) / 2} y={y + (n - rows) / 2} width={0.94} height={0.94} rx={0.08}
          fill={ch === '#' ? '#3D628C' : 'transparent'} stroke={ch === '#' ? '#1c2b3b' : '#d8d1c3'} strokeWidth={0.04} strokeDasharray={ch === '#' ? undefined : '0.12 0.1'} />
      )))}
    </svg>
  );
};

export const describeGrid = (g: string[]) => `${g.length} rows: ${g.map((r) => [...r].map((c) => (c === '#' ? 'filled' : 'empty')).join(' ')).join('; ')}`;
