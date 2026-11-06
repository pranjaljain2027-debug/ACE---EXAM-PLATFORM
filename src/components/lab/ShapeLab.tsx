import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlipHorizontal2,
  FlipVertical2,
  Minus,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
  RefreshCcw,
  Check,
  Keyboard,
} from 'lucide-react';
import type { AllowedAction, VisualObject } from '../../types/reasoning';
import { ShapeSvgElement } from '../../utils/svgShapes';
import {
  PALETTE,
  GRID_STEP,
  actionLabel,
  canRedo,
  canUndo,
  capabilities,
  colorName,
  compareToTarget,
  createHistory,
  dispatch,
  explainSolution,
  nextScale,
  redo,
  replayFrames,
  reset,
  stateAt,
  undo,
  type LabAction,
  type LabHistory,
} from '../../engine/shapeLab';
import { directionWord, orientationOf } from '../../engine/geometry';

const VB = 200;

export function describeObject(o: VisualObject): string {
  const ori = orientationOf(o);
  const dir = ['arrow', 'flag', 'ell', 'triangle'].includes(o.shape) ? `, pointing ${directionWord(ori.r)}` : ori.r ? `, turned ${ori.r}°` : '';
  return `${colorName(o.color)} ${o.shape === 'ell' ? 'L-shape' : o.shape}${dir}${ori.m ? ', mirrored' : ''}${(o.scale || 1) !== 1 ? `, size ${o.scale}` : ''}`;
}

const ToolBtn: React.FC<{ onClick: () => void; label: string; icon: React.ElementType; kbd?: string; disabled?: boolean }> = ({ onClick, label, icon: Icon, kbd, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={kbd ? `${label} (key ${kbd})` : label}
    className="flex flex-col items-center justify-center gap-1 min-w-[4.5rem] min-h-14 px-2 py-2 rounded-xl bg-paper border border-line text-navy text-xs font-semibold hover:border-navy/50 disabled:opacity-40"
  >
    <Icon className="w-5 h-5" aria-hidden />
    <span>{label}</span>
  </button>
);

interface ShapeLabProps {
  initial: VisualObject[];
  target?: VisualObject[];
  allowedActions: AllowedAction[];
  /** Restore from a checkpoint (resume after refresh). */
  initialHistory?: LabHistory;
  onHistoryChange?: (h: LabHistory) => void;
  onAction?: (label: string) => void;
  onMatchChange?: (matched: boolean, explanation: string) => void;
  reducedMotion?: boolean;
  title?: string;
  compact?: boolean;
}

export const ShapeLab: React.FC<ShapeLabProps> = ({
  initial,
  target,
  allowedActions,
  initialHistory,
  onHistoryChange,
  onAction,
  onMatchChange,
  reducedMotion = false,
  title = 'Shape Lab',
  compact = false,
}) => {
  const [history, setHistory] = useState<LabHistory>(() => initialHistory ?? createHistory(initial));
  const objects = useMemo(() => stateAt(history), [history]);
  const [selectedId, setSelectedId] = useState<string | null>(objects[0]?.id ?? null);
  const [replaying, setReplaying] = useState<VisualObject[] | null>(null);
  const [speed, setSpeed] = useState(1);
  const [checkMsg, setCheckMsg] = useState<string[] | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const replayTimer = useRef<number | null>(null);
  const caps = capabilities(allowedActions);
  const selected = objects.find((o) => o.id === selectedId) ?? objects[0];

  const feedback = useMemo(() => (target ? compareToTarget(objects, target) : null), [objects, target]);
  const matched = Boolean(feedback?.matched);
  const explanation = useMemo(() => (matched ? explainSolution(history) : ''), [matched, history]);

  useEffect(() => { onMatchChange?.(matched, explanation); }, [matched, explanation, onMatchChange]);
  useEffect(() => { onHistoryChange?.(history); }, [history, onHistoryChange]);
  useEffect(() => { setCheckMsg(null); }, [history]);
  useEffect(() => () => { if (replayTimer.current) window.clearTimeout(replayTimer.current); }, []);

  const act = useCallback((a: LabAction) => {
    setHistory((h) => {
      const next = dispatch(h, a);
      if (next !== h) onAction?.(actionLabel(a));
      return next;
    });
  }, [onAction]);

  const doUndo = () => { setHistory(undo); onAction?.('undo'); };
  const doRedo = () => { setHistory(redo); onAction?.('redo'); };
  const doReset = () => { setHistory(reset); setSelectedId(initial[0]?.id ?? null); onAction?.('reset'); };

  const stopReplay = () => {
    if (replayTimer.current) window.clearTimeout(replayTimer.current);
    replayTimer.current = null;
    setReplaying(null);
  };

  const startReplay = () => {
    const frames = replayFrames(history);
    if (frames.length < 2) return;
    onAction?.('replay');
    let i = 0;
    const step = () => {
      setReplaying(frames[i]);
      i += 1;
      if (i < frames.length) replayTimer.current = window.setTimeout(step, 700 / speed);
      else replayTimer.current = window.setTimeout(() => setReplaying(null), 900 / speed);
    };
    step();
  };

  // -------------------------------------------------------------------------
  // Pointer (mouse + touch) drag, committed once on release
  // -------------------------------------------------------------------------
  const toPct = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : { x: VB / 2, y: VB / 2 };
    return { x: Math.min(100, Math.max(0, (p.x / VB) * 100)), y: Math.min(100, Math.max(0, (p.y / VB) * 100)) };
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (replaying) return;
    setSelectedId(id);
    if (!caps.move) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const p = toPct(e.clientX, e.clientY);
    setDrag({ id, ...p });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toPct(e.clientX, e.clientY);
    setDrag({ ...drag, ...p });
  };
  const onPointerUp = () => {
    if (!drag) return;
    const o = objects.find((x) => x.id === drag.id);
    if (o && (Math.abs(o.x - drag.x) > 2 || Math.abs(o.y - drag.y) > 2)) act({ type: 'move', id: drag.id, x: drag.x, y: drag.y });
    setDrag(null);
  };

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected || replaying) return;
    const k = e.key;
    const mod = e.ctrlKey || e.metaKey;
    let handled = true;
    if (mod && k.toLowerCase() === 'z' && !e.shiftKey) doUndo();
    else if (mod && (k.toLowerCase() === 'y' || (k.toLowerCase() === 'z' && e.shiftKey))) doRedo();
    else if (caps.move && k.startsWith('Arrow')) {
      const dx = k === 'ArrowLeft' ? -GRID_STEP : k === 'ArrowRight' ? GRID_STEP : 0;
      const dy = k === 'ArrowUp' ? -GRID_STEP : k === 'ArrowDown' ? GRID_STEP : 0;
      act({ type: 'move', id: selected.id, x: selected.x + dx, y: selected.y + dy });
    } else if ((caps.rotate90 || caps.rotate45) && k.toLowerCase() === 'r') {
      const d = caps.rotate90 ? 90 : 45;
      act({ type: 'rotate', id: selected.id, deg: e.shiftKey ? -d : d });
    } else if (caps.reflectVertical && k.toLowerCase() === 'h') act({ type: 'reflect', id: selected.id, axis: 'vertical' });
    else if (caps.reflectHorizontal && k.toLowerCase() === 'v') act({ type: 'reflect', id: selected.id, axis: 'horizontal' });
    else if (caps.resize && (k === '+' || k === '=')) act({ type: 'resize', id: selected.id, scale: nextScale(selected.scale || 1, 1) });
    else if (caps.resize && k === '-') act({ type: 'resize', id: selected.id, scale: nextScale(selected.scale || 1, -1) });
    else if (caps.remove && (k === 'Delete' || k === 'Backspace')) act({ type: 'remove', id: selected.id });
    else if (k === 'Tab' && objects.length > 1 && document.activeElement === svgRef.current) {
      const i = objects.findIndex((o) => o.id === selected.id);
      setSelectedId(objects[(i + (e.shiftKey ? -1 : 1) + objects.length) % objects.length].id);
    } else handled = false;
    if (handled) e.preventDefault();
  };

  const shown = replaying ?? objects;
  const display = drag ? shown.map((o) => (o.id === drag.id ? { ...o, x: drag.x, y: drag.y } : o)) : shown;
  const disabled = Boolean(replaying);

  return (
    <div className={`bg-paper border border-line rounded-2xl overflow-hidden ${reducedMotion ? 'reduce-motion' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-line bg-ivory">
        <span className="font-semibold text-navy text-sm">{title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={doUndo} disabled={!canUndo(history) || disabled} className="p-2.5 rounded-lg border border-line bg-paper text-navy disabled:opacity-40" aria-label="Undo (Ctrl Z)">
            <Undo2 className="w-4 h-4" aria-hidden />
          </button>
          <button type="button" onClick={doRedo} disabled={!canRedo(history) || disabled} className="p-2.5 rounded-lg border border-line bg-paper text-navy disabled:opacity-40" aria-label="Redo (Ctrl Y)">
            <Redo2 className="w-4 h-4" aria-hidden />
          </button>
          <button type="button" onClick={doReset} disabled={disabled || history.actions.length === 0} className="p-2.5 rounded-lg border border-line bg-paper text-navy disabled:opacity-40" aria-label="Reset to the start">
            <RefreshCcw className="w-4 h-4" aria-hidden />
          </button>
          <span className="w-px h-6 bg-line mx-1" aria-hidden />
          {replaying ? (
            <button type="button" onClick={stopReplay} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-line bg-paper text-navy text-xs font-semibold" aria-label="Stop replay">
              <Pause className="w-4 h-4" aria-hidden /> Stop
            </button>
          ) : (
            <button type="button" onClick={startReplay} disabled={history.cursor === 0} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-line bg-paper text-navy text-xs font-semibold disabled:opacity-40" aria-label="Replay my moves">
              <Play className="w-4 h-4" aria-hidden /> Replay
            </button>
          )}
          <label className="sr-only" htmlFor="replay-speed">Replay speed</label>
          <select id="replay-speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="text-xs rounded-lg border border-line bg-paper px-1.5 py-2 text-navy">
            <option value={0.5}>Slow</option>
            <option value={1}>Normal</option>
            <option value={2}>Fast</option>
          </select>
          <button type="button" onClick={() => setShowKeys((s) => !s)} className="p-2.5 rounded-lg border border-line bg-paper text-navy" aria-label="Keyboard shortcuts" aria-expanded={showKeys}>
            <Keyboard className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {showKeys && (
        <div className="px-4 py-2 text-xs text-muted border-b border-line bg-ivory/60">
          Click the board, then: {caps.rotate90 || caps.rotate45 ? 'R turns right, Shift+R turns left · ' : ''}
          {caps.reflectVertical ? 'H flips left-right · ' : ''}{caps.reflectHorizontal ? 'V flips up-down · ' : ''}
          {caps.move ? 'arrow keys move · ' : ''}{caps.resize ? '+ / − resize · ' : ''}Ctrl+Z undo · Ctrl+Y redo{objects.length > 1 ? ' · Tab picks a piece' : ''}
        </div>
      )}

      <div className={`grid ${target && !compact ? 'sm:grid-cols-[1fr_9rem]' : ''} gap-0`}>
        <div className="relative bg-ivory/50 geo-motif">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="w-full aspect-square max-h-[420px] touch-none select-none outline-none"
            tabIndex={0}
            role="application"
            aria-label={`Shape board. ${display.map(describeObject).join('; ')}. ${selected ? `Selected: ${describeObject(selected)}.` : ''}`}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          >
            {/* snapping grid */}
            <g opacity="0.25" aria-hidden>
              {Array.from({ length: 7 }, (_, i) => (i + 1) * (VB / 8)).map((v) => (
                <g key={v}>
                  <line x1={v} y1={8} x2={v} y2={VB - 8} stroke="#233D5B" strokeDasharray="2 5" strokeWidth={0.6} />
                  <line x1={8} y1={v} x2={VB - 8} y2={v} stroke="#233D5B" strokeDasharray="2 5" strokeWidth={0.6} />
                </g>
              ))}
            </g>
            {[...display].sort((a, b) => a.zIndex - b.zIndex).map((o) => (
              <g key={o.id} onPointerDown={(e) => onPointerDown(e, o.id)} style={{ cursor: caps.move ? 'grab' : 'pointer' }}>
                <ShapeSvgElement object={o} size={VB} isSelected={!replaying && o.id === selected?.id && objects.length > 1} isInteractive onClick={() => setSelectedId(o.id)} />
              </g>
            ))}
          </svg>
          {replaying && <div className="absolute top-2 left-2 rounded-full bg-navy text-white text-xs font-semibold px-3 py-1">Replaying…</div>}
        </div>
        {target && !compact && (
          <div className="border-t sm:border-t-0 sm:border-l border-line p-3 flex flex-col items-center gap-2 bg-paper">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Goal</span>
            <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full max-w-[8rem] aspect-square rounded-lg bg-ivory border border-line" role="img" aria-label={`Goal: ${target.map(describeObject).join('; ')}`}>
              {target.map((o) => <ShapeSvgElement key={o.id} object={o} size={VB} />)}
            </svg>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-line bg-ivory space-y-3">
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Shape tools">
          {caps.rotate90 && <ToolBtn disabled={disabled} icon={RotateCcw} label="Turn left" kbd="Shift R" onClick={() => selected && act({ type: 'rotate', id: selected.id, deg: -90 })} />}
          {caps.rotate90 && <ToolBtn disabled={disabled} icon={RotateCw} label="Turn right" kbd="R" onClick={() => selected && act({ type: 'rotate', id: selected.id, deg: 90 })} />}
          {caps.rotate45 && <ToolBtn disabled={disabled} icon={RotateCw} label="Turn 45°" onClick={() => selected && act({ type: 'rotate', id: selected.id, deg: 45 })} />}
          {caps.reflectVertical && <ToolBtn disabled={disabled} icon={FlipHorizontal2} label="Flip ↔" kbd="H" onClick={() => selected && act({ type: 'reflect', id: selected.id, axis: 'vertical' })} />}
          {caps.reflectHorizontal && <ToolBtn disabled={disabled} icon={FlipVertical2} label="Flip ↕" kbd="V" onClick={() => selected && act({ type: 'reflect', id: selected.id, axis: 'horizontal' })} />}
          {caps.resize && <ToolBtn disabled={disabled} icon={Minus} label="Smaller" kbd="−" onClick={() => selected && act({ type: 'resize', id: selected.id, scale: nextScale(selected.scale || 1, -1) })} />}
          {caps.resize && <ToolBtn disabled={disabled} icon={Plus} label="Bigger" kbd="+" onClick={() => selected && act({ type: 'resize', id: selected.id, scale: nextScale(selected.scale || 1, 1) })} />}
          {caps.add && <ToolBtn icon={Plus} label="Add one" disabled={disabled || objects.length >= 8} onClick={() => selected && act({ type: 'add', id: `added-${history.actions.length}-${objects.length}`, template: selected, x: Math.min(87.5, selected.x + GRID_STEP), y: selected.y })} />}
          {caps.remove && <ToolBtn icon={Trash2} label="Remove" disabled={disabled || objects.length <= 1} onClick={() => selected && act({ type: 'remove', id: selected.id })} />}
        </div>

        {caps.recolor && (
          <fieldset className="flex flex-wrap items-center gap-2" disabled={disabled}>
            <legend className="sr-only">Colour</legend>
            {PALETTE.map((p) => {
              const on = selected?.color.toLowerCase() === p.hex.toLowerCase();
              return (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => selected && act({ type: 'recolor', id: selected.id, color: p.hex })}
                  aria-pressed={on}
                  className={`flex items-center gap-2 min-h-11 pl-1.5 pr-3 rounded-full border text-xs font-semibold ${on ? 'border-navy ring-2 ring-navy/20 bg-paper' : 'border-line bg-paper'}`}
                >
                  <span className="w-7 h-7 rounded-full border border-navy/20" style={{ backgroundColor: p.hex }} aria-hidden />
                  {p.name}
                </button>
              );
            })}
          </fieldset>
        )}
        {caps.move && <p className="text-xs text-muted">Drag a shape to move it. It snaps to the grid.</p>}

        {target && (
          <div aria-live="polite" className="min-h-6">
            {matched ? (
              <div className="flex items-start gap-2 rounded-xl bg-forest-soft border border-forest/30 px-3 py-2.5 text-sm text-ink animate-fade-in">
                <Check className="w-4 h-4 mt-0.5 text-forest shrink-0" aria-hidden />
                <span><strong>It matches!</strong> {explanation}</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setCheckMsg(feedback?.hints ?? [])} className="text-sm font-semibold text-navy underline underline-offset-4 decoration-ochre min-h-11">
                  Check my shape
                </button>
                {checkMsg && <span className="text-sm text-ink">{checkMsg.length ? checkMsg.join(' ') : 'Not quite yet. Keep experimenting.'}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
