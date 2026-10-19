import React, { useState } from 'react';
import { ReasoningActivity, VisualObject } from '../../types/reasoning';
import { ReasoningCanvas } from '../canvas/ReasoningCanvas';
import { PatternSequenceView } from '../canvas/PatternSequenceView';
import { Compass, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface ExperimentStageProps {
  activity: ReasoningActivity;
  onComplete: (actionCount: number) => void;
}

export const ExperimentStage: React.FC<ExperimentStageProps> = ({ activity, onComplete }) => {
  const [currentObjects, setCurrentObjects] = useState<VisualObject[]>(activity.initialState);
  const [isMatch, setIsMatch] = useState(false);
  const [transformationCount, setTransformationCount] = useState(0);

  const handleStateChange = (newObjects: VisualObject[]) => {
    setCurrentObjects(newObjects);
    setTransformationCount((prev) => prev + 1);
  };

  const handleValidate = (match: boolean) => {
    setIsMatch(match);
  };

  const handleProceed = () => {
    onComplete(transformationCount);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Editorial Prompt Banner */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C99543] mb-1 font-mono">
            <Compass className="w-4 h-4" />
            <span>Stage 2 of 5 · Experiment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">
            Physically test the transformation
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Use the manipulation controls below to turn, flip, or adjust the starting shape until it matches what you believe should come next.
            You cannot make a mistake here—exploration is how thinking is discovered.
          </p>
        </div>

        <button
          onClick={handleProceed}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm shrink-0"
        >
          <span>{isMatch ? 'Match Found! Continue' : 'Continue to Discover'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Context Sequence vs Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sequence Context */}
        <div className="lg:col-span-5 bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-semibold text-[#0E2235] text-base">The Pattern Stream</h3>
            <span className="text-xs text-slate-500">Compare with canvas</span>
          </div>
          <PatternSequenceView
            frames={activity.frames}
            format={activity.activityFormat}
            replacementTarget={
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-amber-50/60 border border-dashed border-[#C99543] rounded-lg">
                <span className="text-xs font-semibold text-[#C99543]">Your Canvas</span>
                <span className="text-[11px] text-slate-500">Live preview</span>
              </div>
            }
          />
          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] text-xs text-slate-600 leading-relaxed">
            <strong className="text-[#0E2235]">Investigation Tip:</strong> What action turns Step 1 into Step 2? Does that same action turn Step 2 into Step 3?
          </div>
        </div>

        {/* Right Column: Reasoning Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <ReasoningCanvas
            initialObjects={activity.initialState}
            targetObjects={activity.targetState}
            allowedActions={activity.allowedActions}
            onStateChange={handleStateChange}
            onValidate={handleValidate}
          />

          {isMatch && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-fadeIn">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Excellent! Your transformed figure matches the target geometry.</span>
              </div>
              <button
                onClick={handleProceed}
                className="px-3 py-1.5 font-semibold text-white bg-[#0E2235] rounded-lg hover:bg-[#1a3852] transition-colors"
              >
                Discover the Rule →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
