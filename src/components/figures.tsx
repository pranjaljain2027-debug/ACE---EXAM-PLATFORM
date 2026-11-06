import React from 'react';
import type { VisualObject } from '../types/reasoning';
import type { ItemPayload } from '../content/types';
import { ShapeSvgElement } from '../utils/svgShapes';
import { describeObject } from './lab/ShapeLab';

export const Figure: React.FC<{ objects: VisualObject[] | null; label?: string; className?: string; missing?: boolean; highlight?: boolean }> = ({
  objects,
  label,
  className = '',
  missing,
  highlight,
}) => (
  <div className={`relative aspect-square rounded-xl border ${highlight ? 'border-ochre ring-2 ring-ochre/30' : 'border-line'} ${missing ? 'border-dashed bg-ochre-soft/50' : 'bg-paper'} ${className}`}>
    {missing ? (
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-ochre" aria-label="Missing picture">?</span>
    ) : (
      <svg viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label={label ?? (objects ?? []).map(describeObject).join('; ')}>
        {(objects ?? []).map((o) => <ShapeSvgElement key={o.id} object={o} size={200} />)}
      </svg>
    )}
  </div>
);

/** Renders the question part of a practice/baseline item. */
export const ItemStemView: React.FC<{ item: ItemPayload; preview?: VisualObject[] | null }> = ({ item, preview }) => {
  const s = item.stem;
  if (s.kind === 'matrix') {
    return (
      <div className="grid gap-2 sm:gap-3 mx-auto" style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))`, maxWidth: s.cols === 3 ? 380 : 280 }}>
        {s.cells.map((c, i) => (
          <Figure key={i} objects={c ?? preview ?? null} missing={!c && !preview} highlight={!c} />
        ))}
      </div>
    );
  }
  if (s.kind === 'analogy') {
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <div className="w-20 sm:w-24"><Figure objects={s.a} /></div>
        <span className="text-xl text-muted" aria-label="goes to">→</span>
        <div className="w-20 sm:w-24"><Figure objects={s.b} /></div>
        <span className="mx-2 sm:mx-4 text-2xl text-line" aria-hidden>|</span>
        <div className="w-20 sm:w-24"><Figure objects={s.c} /></div>
        <span className="text-xl text-muted" aria-label="goes to">→</span>
        <div className="w-20 sm:w-24"><Figure objects={preview ?? null} missing={!preview} highlight /></div>
      </div>
    );
  }
  if (s.kind === 'sequence') {
    return (
      <ol className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap" aria-label="Sequence">
        {s.frames.map((f, i) => (
          <li key={i} className="w-20 sm:w-24">
            <Figure objects={f ?? preview ?? null} missing={!f && !preview} highlight={!f} label={f ? `Step ${i + 1}` : 'Next step'} />
          </li>
        ))}
      </ol>
    );
  }
  return null; // classification: options are the stem
};

export const OptionGrid: React.FC<{
  options: { id: string; objects: VisualObject[] }[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  reveal?: { correct: string; chosen: string | null } | null;
  name: string;
}> = ({ options, selected, onSelect, disabled, reveal, name }) => (
  <div role="radiogroup" aria-label={name} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {options.map((o, i) => {
      const isSel = selected === o.id;
      const isCorrect = reveal?.correct === o.id;
      const isWrongChoice = reveal && reveal.chosen === o.id && !isCorrect;
      return (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={isSel}
          disabled={disabled}
          onClick={() => onSelect(o.id)}
          className={`relative rounded-2xl border-2 p-2 bg-paper transition-colors min-h-28 ${
            isCorrect ? 'border-forest bg-forest-soft' : isWrongChoice ? 'border-brick bg-brick-soft' : isSel ? 'border-navy ring-4 ring-navy/10' : 'border-line hover:border-navy/40'
          }`}
        >
          <span className="absolute top-1.5 left-2.5 text-xs font-bold text-muted">{String.fromCharCode(65 + i)}</span>
          {isCorrect && <span className="absolute top-1.5 right-2.5 text-xs font-bold text-forest">Answer</span>}
          {isWrongChoice && <span className="absolute top-1.5 right-2.5 text-xs font-bold text-brick">Your pick</span>}
          <svg viewBox="0 0 200 200" className="w-full aspect-square" role="img" aria-label={`Choice ${String.fromCharCode(65 + i)}: ${o.objects.map(describeObject).join('; ')}`}>
            {o.objects.map((x) => <ShapeSvgElement key={x.id} object={x} size={200} />)}
          </svg>
        </button>
      );
    })}
  </div>
);
