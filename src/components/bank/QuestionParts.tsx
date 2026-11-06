/** Learner-facing parts of a bank question. Shared by the Studio runner and the staff review screen. */
import React from 'react';
import type { Cell } from '../../engine/voxel';
import type { BankPayload, GridOption, NumberPuzzlePayload, NumberSeriesPayload, SpatialPayload, TextOption, VerbalPayload, VoxelOption } from '../../content/bank/schema';
import type { ItemPayload } from '../../content/types';
import { VoxelExplorer, VoxelSvg, GridSvg, describeGrid, type Replay } from '../voxel/VoxelView';
import { ItemStemView, OptionGrid } from '../figures';

type AnyPayload = Omit<BankPayload, 'hint'> & { hint?: string };
const LETTER = (i: number) => String.fromCharCode(65 + i);
const isSpatial = (p: AnyPayload): p is SpatialPayload => p.family.startsWith('spatial_');

export const replayFor = (p: AnyPayload): Replay | null => {
  if (!isSpatial(p)) return null;
  if (p.task.type === 'rotation') return { kind: 'rotate', axis: p.task.axis, turns: p.task.quarter_turns };
  if (p.task.type === 'reflection') return { kind: 'mirror', axis: p.task.plane_normal };
  return null;
};

const SHAPE_GLYPH: Record<string, string> = { circle: '●', square: '■', triangle: '▲', star: '★', diamond: '◆' };
const glyphs = (side: Record<string, number>) => Object.entries(side).flatMap(([k, n]) => Array.from({ length: n }, () => SHAPE_GLYPH[k] ?? k));

/** The question body above the options. */
export const QuestionStem: React.FC<{ payload: AnyPayload; explore?: boolean; reducedMotion?: boolean; onExplore?: () => void; showReplay?: boolean }> = ({ payload, explore = false, reducedMotion, onExplore, showReplay }) => {
  const p = payload;
  if (isSpatial(p)) {
    const cells = p.source.occupied_cells as Cell[];
    return (
      <VoxelExplorer cells={cells} label={`The starting shape, ${cells.length} cubes`} interactive={explore} reducedMotion={reducedMotion}
        onAction={onExplore} replay={showReplay ? replayFor(p) : null} replayLabel={p.task.type === 'reflection' ? 'Watch the mirror' : 'Watch the turn'} />
    );
  }
  if (p.family === 'number_series') {
    const s = (p as NumberSeriesPayload).sequence;
    return (
      <ol className="flex flex-nowrap justify-center gap-1.5 sm:gap-3 overflow-x-auto" aria-label="Number pattern">
        {s.map((n, i) => (
          <li key={i} className={`shrink-0 min-w-10 h-12 px-2 sm:min-w-14 sm:h-14 sm:px-3 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold ${n === null ? 'border-2 border-dashed border-ochre text-ochre' : 'bg-paper border border-line text-navy'}`}>
            {n === null ? '?' : n}<span className="sr-only">{n === null ? 'missing number' : ''}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (p.family === 'number_puzzle') {
    const q = p as NumberPuzzlePayload;
    return (
      <div className="space-y-3" aria-label="Balance scales">
        {q.scales.map((s, i) => (
          <div key={i} className="flex items-center justify-center gap-4 rounded-2xl border border-line bg-paper p-4 text-3xl text-navy">
            <span aria-hidden className="tracking-wider">{glyphs(s.left).join(' ')}</span>
            <span className="text-base font-bold text-muted" aria-hidden>balances</span>
            <span aria-hidden className="tracking-wider">{glyphs(s.right).join(' ')}</span>
            <span className="sr-only">{Object.entries(s.left).map(([k, n]) => `${n} ${k}`).join(' and ')} balance {Object.entries(s.right).map(([k, n]) => `${n} ${k}`).join(' and ')}</span>
          </div>
        ))}
        <p className="text-center text-sm text-muted">{Object.entries(SHAPE_GLYPH).filter(([k]) => q.scales.some((s) => k in s.left || k in s.right)).map(([k, g]) => `${g} ${k}`).join('   ')}</p>
      </div>
    );
  }
  if (p.family === 'verbal_analogy') {
    const s = (p as VerbalPayload).stem!;
    return (
      <p className="text-center text-2xl sm:text-3xl font-bold text-navy">
        {s.a} <span className="text-muted font-normal">is to</span> {s.b}<br className="sm:hidden" /> <span className="text-muted font-normal">as</span> {s.c} <span className="text-muted font-normal">is to</span> <span className="text-ochre">?</span>
      </p>
    );
  }
  if (p.family === 'verbal_classification') return null;
  return <ItemStemView item={p as unknown as ItemPayload} />;
};

/** Answer options. `reveal` marks the answer and the learner's pick after submitting. */
export const QuestionOptions: React.FC<{
  payload: AnyPayload; selected: string | null; onSelect: (id: string) => void; disabled?: boolean;
  reveal?: { correct: string; chosen: string | null } | null; firstGuess?: string | null;
}> = ({ payload, selected, onSelect, disabled, reveal, firstGuess }) => {
  const p = payload;
  if (['figure_matrix', 'figural_analogy', 'figural_series', 'figure_classification'].includes(p.family)) {
    return <OptionGrid name="Answer choices" options={(p as unknown as ItemPayload).options} selected={selected} onSelect={onSelect} disabled={disabled} reveal={reveal ?? null} />;
  }
  const opts = p.options as (VoxelOption | GridOption | TextOption)[];
  const text = !('kind' in opts[0]);
  return (
    <div role="radiogroup" aria-label="Answer choices" className={`grid gap-3 ${text ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {opts.map((o, i) => {
        const isSel = selected === o.id;
        const isCorrect = reveal?.correct === o.id;
        const isWrong = reveal && reveal.chosen === o.id && !isCorrect;
        const label = 'kind' in o && o.kind === 'voxel' ? `Choice ${LETTER(i)}: a shape of ${o.cells.length} cubes`
          : 'kind' in o && o.kind === 'grid' ? `Choice ${LETTER(i)}: ${describeGrid(o.grid)}` : `Choice ${LETTER(i)}: ${(o as TextOption).text}`;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={isSel} aria-label={label} disabled={disabled} onClick={() => onSelect(o.id)}
            className={`relative rounded-2xl border-2 p-2 bg-paper transition-colors ${text ? 'min-h-16 text-xl font-bold text-navy' : 'min-h-28'} ${
              isCorrect ? 'border-forest bg-forest-soft' : isWrong ? 'border-brick bg-brick-soft' : isSel ? 'border-navy ring-4 ring-navy/10' : 'border-line hover:border-navy/40'}`}>
            <span className="absolute top-1.5 left-2.5 text-xs font-bold text-muted">{LETTER(i)}</span>
            {isCorrect && <span className="absolute top-1.5 right-2.5 text-xs font-bold text-forest">Answer</span>}
            {isWrong && <span className="absolute top-1.5 right-2.5 text-xs font-bold text-brick">Your pick</span>}
            {!reveal && firstGuess === o.id && <span className="absolute top-1.5 right-2.5 text-[11px] font-bold text-ochre">First guess</span>}
            {'kind' in o && o.kind === 'voxel' ? <VoxelSvg cells={o.cells} label="" />
              : 'kind' in o && o.kind === 'grid' ? <GridSvg grid={o.grid} label="" />
              : <span className="block py-3">{(o as TextOption).text}</span>}
          </button>
        );
      })}
    </div>
  );
};
