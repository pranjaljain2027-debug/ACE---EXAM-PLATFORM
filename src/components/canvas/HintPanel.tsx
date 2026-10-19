import React, { useState } from 'react';
import { HintItem } from '../../types/reasoning';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface HintPanelProps {
  hints: HintItem[];
  onHintRevealed?: (tier: number) => void;
  className?: string;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  onHintRevealed,
  className = '',
}) => {
  const [revealedTier, setRevealedTier] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleRevealNext = () => {
    const next = revealedTier + 1;
    if (next <= hints.length) {
      setRevealedTier(next);
      setIsExpanded(true);
      onHintRevealed?.(next);
    }
  };

  const currentHint = hints[revealedTier - 1];

  return (
    <div className={`bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl overflow-hidden transition-all ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E6E1]">
        <div className="flex items-center gap-2">
          <Lightbulb className={`w-4 h-4 ${revealedTier > 0 ? 'text-[#C99543]' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold text-[#0E2235]">Guided Thinking Assistance</span>
          <span className="text-xs text-slate-500">
            · {revealedTier} of {hints.length} unlocked
          </span>
        </div>

        <div className="flex items-center gap-2">
          {revealedTier < hints.length && (
            <button
              onClick={handleRevealNext}
              className="px-3 py-1 text-xs font-medium text-white bg-[#0E2235] rounded-md hover:bg-[#1a3852] transition-colors"
            >
              {revealedTier === 0 ? 'Need a hint?' : `Unlock Hint ${revealedTier + 1}`}
            </button>
          )}

          {revealedTier > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-600 hover:text-[#0E2235] transition-colors"
              aria-label={isExpanded ? 'Collapse hints' : 'Expand hints'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Hints List / Card */}
      {isExpanded && revealedTier > 0 && (
        <div className="p-4 space-y-3">
          {hints.slice(0, revealedTier).map((hint) => (
            <div
              key={hint.tier}
              className={`p-3 rounded-lg border text-xs leading-relaxed ${
                hint.tier === 3
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : hint.tier === 2
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-white border-[#E8E6E1] text-[#0E2235]'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#718C7B]" />
                  Level {hint.tier}: {hint.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {hint.tier === 1 ? 'Attention Focus' : hint.tier === 2 ? 'Relationship' : 'Demonstration'}
                </span>
              </div>
              <p className="text-slate-700">{hint.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
