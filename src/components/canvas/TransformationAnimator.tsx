import React, { useState, useEffect } from 'react';
import { VisualObject } from '../../types/reasoning';
import { FrameCanvas } from '../../utils/svgShapes';
import { Play, RotateCw } from 'lucide-react';

interface TransformationAnimatorProps {
  fromObjects: VisualObject[];
  toObjects: VisualObject[];
  ruleName?: string;
  className?: string;
}

export const TransformationAnimator: React.FC<TransformationAnimatorProps> = ({
  fromObjects,
  toObjects,
  ruleName = 'Transformation in Motion',
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentObjects, setCurrentObjects] = useState<VisualObject[]>(fromObjects);
  const [stepLabel, setStepLabel] = useState('Starting Orientation');

  const runAnimation = () => {
    setIsAnimating(true);
    setCurrentObjects(fromObjects);
    setStepLabel('State A (Source)');

    setTimeout(() => {
      setCurrentObjects(toObjects);
      setStepLabel('State B (Rule Applied)');
    }, 700);

    setTimeout(() => {
      setIsAnimating(false);
    }, 1800);
  };

  useEffect(() => {
    setCurrentObjects(fromObjects);
  }, [fromObjects]);

  return (
    <div className={`p-4 bg-white border border-[#E8E6E1] rounded-xl flex flex-col items-center ${className}`}>
      <div className="w-full flex items-center justify-between mb-2 text-xs text-[#0E2235]">
        <span className="font-semibold">{ruleName}</span>
        <button
          onClick={runAnimation}
          disabled={isAnimating}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#0E2235] rounded-md hover:bg-[#1a3852] disabled:opacity-50 transition-colors"
        >
          <Play className="w-3 h-3 text-[#C99543]" />
          <span>{isAnimating ? 'Transforming...' : 'Play Transformation'}</span>
        </button>
      </div>

      <div className="relative w-44 h-44 bg-[#FAF7F0] border border-[#E8E6E1] rounded-lg p-3 flex items-center justify-center overflow-hidden">
        <FrameCanvas objects={currentObjects} showGrid={true} />
      </div>

      <div className="mt-2 text-[11px] text-slate-500 font-mono">
        {stepLabel}
      </div>
    </div>
  );
};
