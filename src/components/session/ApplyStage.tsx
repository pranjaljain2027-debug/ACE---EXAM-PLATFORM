import React, { useState } from 'react';
import { ReasoningActivity, TransferOption } from '../../types/reasoning';
import { PatternSequenceView } from '../canvas/PatternSequenceView';
import { FrameCanvas } from '../../utils/svgShapes';
import { Target, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface ApplyStageProps {
  activity: ReasoningActivity;
  onComplete: (isCorrect: boolean, attemptsCount: number) => void;
}

export const ApplyStage: React.FC<ApplyStageProps> = ({ activity, onComplete }) => {
  const challenge = activity.transferChallenge;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const selectedOption = challenge.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect || false;

  const handleSubmit = () => {
    if (!selectedOption) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setHasSubmitted(true);
  };

  const handleProceed = () => {
    onComplete(isCorrect, attempts);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#718C7B] mb-2 font-mono">
          <Target className="w-4 h-4" />
          <span>Stage 4 of 5 · Independent Transfer Challenge</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235] mb-2">
          {challenge.prompt}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The shapes and colors have changed, but the underlying rule remains identical. Can you recognize and apply it independently?
        </p>
      </div>

      {/* Target Assessment Sequence */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
        <PatternSequenceView
          frames={challenge.frames}
          format="sequence"
          replacementTarget={
            selectedOption ? (
              <div className="w-full h-full p-2 flex items-center justify-center">
                <FrameCanvas objects={selectedOption.objects} />
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Multiple-Choice Options */}
      <div className="bg-[#FAF7F0] border border-[#E8E6E1] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-base text-[#0E2235]">
            Select the option that completes the sequence:
          </h3>
          <span className="text-xs text-slate-500 font-mono">Assessment-Style Question</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {challenge.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedOptionId(option.id);
                  setHasSubmitted(false);
                }}
                className={`relative flex flex-col items-center bg-white rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-[#0E2235] ring-2 ring-[#0E2235]/15 shadow-sm'
                    : 'border-[#E8E6E1] hover:border-slate-400'
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                  <span>Choice {String.fromCharCode(65 + idx)}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#0E2235] bg-[#0E2235]' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="aspect-square w-full max-h-28 flex items-center justify-center p-2">
                  <FrameCanvas objects={option.objects} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] disabled:opacity-40 transition-colors shadow-sm"
            >
              Confirm Choice
            </button>
          ) : (
            <button
              onClick={handleProceed}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm"
            >
              <span>Continue to Reflection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Outcome Feedback */}
      {hasSubmitted && selectedOption && (
        <div
          className={`p-5 rounded-2xl border ${
            isCorrect ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-amber-50/60 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 font-serif font-bold text-base mb-1">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Successful Rule Transfer!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-amber-600" />
                <span>Almost there! Let us reflect on this step:</span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed">{selectedOption.explanation}</p>
        </div>
      )}
    </div>
  );
};
