import React, { useState } from 'react';
import { ReasoningActivity, ObservationChoice } from '../../types/reasoning';
import { PatternSequenceView } from '../canvas/PatternSequenceView';
import { Eye, ArrowRight, Sparkles } from 'lucide-react';

interface ObserveStageProps {
  activity: ReasoningActivity;
  onComplete: (selectedObservation: string) => void;
}

export const ObserveStage: React.FC<ObserveStageProps> = ({ activity, onComplete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  const selectedChoice = activity.observationChoices.find((c) => c.id === selectedId);

  const handleSubmit = () => {
    if (selectedChoice) {
      setHasRecorded(true);
      setTimeout(() => {
        onComplete(selectedChoice.label);
      }, 700);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Editorial Prompt Banner */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#718C7B] mb-2 font-mono">
          <Eye className="w-4 h-4" />
          <span>Stage 1 of 5 · Observe</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235] mb-2">
          {activity.promptText}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Before trying to guess the final answer, let your eyes explore the sequence. What is shifting or moving?
        </p>
      </div>

      {/* Pattern Sequence / Matrix Display */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
        <PatternSequenceView frames={activity.frames} format={activity.activityFormat} />
      </div>

      {/* Observation Question */}
      <div className="bg-[#FAF7F0] border border-[#E8E6E1] rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0E2235] text-white flex items-center justify-center shrink-0 font-serif font-bold text-sm">
            ?
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0E2235]">
              {activity.observationPrompt}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the feature that draws your attention first:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {activity.observationChoices.map((choice) => {
            const isSelected = selectedId === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => setSelectedId(choice.id)}
                className={`p-4 text-left rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-white border-[#0E2235] ring-2 ring-[#0E2235]/10 text-[#0E2235] shadow-xs'
                    : 'bg-white/80 border-[#E8E6E1] text-slate-700 hover:border-[#0E2235]/40 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{choice.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#0E2235] bg-[#0E2235]' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedId || hasRecorded}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] disabled:opacity-40 transition-colors shadow-sm"
          >
            <span>{hasRecorded ? 'Observation Recorded...' : 'Ready to Experiment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
