import React from 'react';
import { PatternFrame } from '../../types/reasoning';
import { FrameCanvas } from '../../utils/svgShapes';
import { HelpCircle } from 'lucide-react';

interface PatternSequenceViewProps {
  frames: PatternFrame[];
  format?: 'sequence' | 'matrix' | 'analogy' | 'transformation';
  activeStep?: number;
  onSelectFrame?: (index: number) => void;
  className?: string;
  replacementTarget?: React.ReactNode;
}

export const PatternSequenceView: React.FC<PatternSequenceViewProps> = ({
  frames,
  format = 'sequence',
  activeStep,
  onSelectFrame,
  className = '',
  replacementTarget,
}) => {
  const isMatrix = format === 'matrix';

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`grid gap-3 sm:gap-4 ${
          isMatrix
            ? 'grid-cols-2 max-w-md mx-auto'
            : frames.length === 2
            ? 'grid-cols-2 max-w-lg mx-auto'
            : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {frames.map((frame, index) => {
          const isMissing = frame.isMissing;
          const isSelected = activeStep === index;

          return (
            <div
              key={index}
              onClick={() => onSelectFrame?.(index)}
              className={`relative flex flex-col bg-white rounded-xl border transition-all ${
                isSelected
                  ? 'border-[#0E2235] ring-2 ring-[#0E2235]/10 shadow-sm'
                  : isMissing
                  ? 'border-dashed border-[#C99543] bg-[#FAF7F0]/60'
                  : 'border-[#E8E6E1] hover:border-[#718C7B]'
              }`}
            >
              {/* Frame Step Header */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E8E6E1]/60 text-[11px] font-medium text-[#0E2235]/70">
                <span>{frame.label || `Position ${index + 1}`}</span>
                {isMissing && <span className="text-[#C99543] font-semibold">Target</span>}
              </div>

              {/* Visual Body */}
              <div className="aspect-square p-3 sm:p-4 flex items-center justify-center">
                {isMissing ? (
                  replacementTarget ? (
                    replacementTarget
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#C99543] gap-1">
                      <HelpCircle className="w-8 h-8 stroke-[1.5]" />
                      <span className="text-xs font-semibold">Missing Frame</span>
                    </div>
                  )
                ) : (
                  <FrameCanvas objects={frame.objects} showGrid={false} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
