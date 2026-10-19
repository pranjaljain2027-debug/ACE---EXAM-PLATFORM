import React, { useState } from 'react';
import { ReasoningActivity, RuleOption } from '../../types/reasoning';
import { HintPanel } from '../canvas/HintPanel';
import { TransformationAnimator } from '../canvas/TransformationAnimator';
import { Lightbulb, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface DiscoverStageProps {
  activity: ReasoningActivity;
  onComplete: (attemptsCount: number, hintsUsedCount: number) => void;
}

export const DiscoverStage: React.FC<DiscoverStageProps> = ({ activity, onComplete }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const selectedRule = activity.ruleOptions.find((r) => r.id === selectedRuleId);
  const isCorrect = selectedRule?.isCorrect || false;

  const handleTestRule = () => {
    if (!selectedRule) return;
    setAttempts((prev) => prev + 1);
    setHasEvaluated(true);
  };

  const handleProceed = () => {
    onComplete(attempts, hintsUsed);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2B4C7E] mb-2 font-mono">
          <Lightbulb className="w-4 h-4" />
          <span>Stage 3 of 5 · Discover the Rule</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235] mb-2">
          What rule connects these shapes?
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Now that you have seen and manipulated the pattern, articulate the core principle in your own words.
        </p>
      </div>

      {/* Hints Component */}
      <HintPanel
        hints={activity.hints}
        onHintRevealed={(tier) => setHintsUsed((prev) => Math.max(prev, tier))}
      />

      {/* Hypothesis Selector */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-semibold text-base text-[#0E2235]">
          Select the rule hypothesis you discovered:
        </h3>

        <div className="space-y-3">
          {activity.ruleOptions.map((rule) => {
            const isSelected = selectedRuleId === rule.id;
            return (
              <button
                key={rule.id}
                onClick={() => {
                  setSelectedRuleId(rule.id);
                  setHasEvaluated(false);
                }}
                className={`w-full p-4 text-left rounded-xl border text-sm transition-all ${
                  isSelected
                    ? 'bg-[#FAF7F0] border-[#0E2235] ring-2 ring-[#0E2235]/15 text-[#0E2235]'
                    : 'bg-white border-[#E8E6E1] text-slate-700 hover:border-[#0E2235]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium leading-relaxed">{rule.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
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

        <div className="flex justify-end pt-2">
          {!hasEvaluated ? (
            <button
              onClick={handleTestRule}
              disabled={!selectedRuleId}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] disabled:opacity-40 transition-colors shadow-sm"
            >
              Test This Rule
            </button>
          ) : isCorrect ? (
            <button
              onClick={handleProceed}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm"
            >
              <span>Rule Discovered! Apply to New Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setHasEvaluated(false)}
              className="px-6 py-2.5 text-sm font-medium text-[#0E2235] bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl hover:bg-white transition-colors"
            >
              Try Another Hypothesis
            </button>
          )}
        </div>
      </div>

      {/* Visual Explanation when tested */}
      {hasEvaluated && selectedRule && (
        <div
          className={`p-6 rounded-2xl border ${
            isCorrect ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-rose-50/60 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-serif font-bold text-base mb-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>You Discovered the True Invariant Rule!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Not quite — let us look closer:</span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed mb-4">{selectedRule.explanation}</p>

          {/* Visual animation of the transformation */}
          {isCorrect && (
            <div className="pt-2">
              <TransformationAnimator
                fromObjects={activity.frames[0]?.objects || activity.initialState}
                toObjects={activity.frames[1]?.objects || activity.targetState}
                ruleName="Live Rule Demonstration"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
