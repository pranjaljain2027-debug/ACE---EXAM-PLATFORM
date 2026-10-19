import React, { useState } from 'react';
import { ReasoningActivity } from '../../types/reasoning';
import { Sparkles, Trophy, ArrowRight, BookOpen, CheckCircle, RotateCcw } from 'lucide-react';

interface ReflectStageProps {
  activity: ReasoningActivity;
  sessionSummary: {
    observation: string;
    experimentActions: number;
    ruleDiscovered: boolean;
    hintsUsed: number;
    transferCorrect: boolean;
  };
  onFinish: (reflectionMood: string, reflectionNote: string) => void;
}

const MOOD_CHOICES = [
  { id: 'confident', label: 'Confident & Clear', emoji: '🌟' },
  { id: 'curious', label: 'Curious to explore more', emoji: '🔍' },
  { id: 'challenged', label: 'Challenged but learned', emoji: '💡' },
];

export const ReflectStage: React.FC<ReflectStageProps> = ({
  activity,
  sessionSummary,
  onFinish,
}) => {
  const [selectedMood, setSelectedMood] = useState('confident');
  const [reflectionNote, setReflectionNote] = useState('');

  const handleComplete = () => {
    onFinish(selectedMood, reflectionNote);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Celebration Header */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FAF7F0] border border-[#C99543]/40 flex items-center justify-center text-[#C99543]">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235] mb-2">
          Thinking Discovered
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          The answer is only the beginning. You investigated the visual relationship, tested it on the canvas, discovered the underlying rule, and applied it to a brand new situation.
        </p>
      </div>

      {/* Summary Scorecard (Pedagogical focus: celebration of effort and transfer) */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-semibold text-lg text-[#0E2235]">
          Session Synthesis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Core Concept
            </span>
            <span className="font-serif font-bold text-[#0E2235] text-sm block">
              {activity.subskillTitle}
            </span>
          </div>

          <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Independent Transfer
            </span>
            <span className={`font-serif font-bold text-sm block ${sessionSummary.transferCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
              {sessionSummary.transferCorrect ? 'Mastered in New Context' : 'Concept Emerging'}
            </span>
          </div>

          <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Guided Hints Used
            </span>
            <span className="font-serif font-bold text-[#0E2235] text-sm block">
              {sessionSummary.hintsUsed === 0 ? 'None (Pure Discovery)' : `${sessionSummary.hintsUsed} Levels`}
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#FAF7F0]/60 rounded-xl border border-[#E8E6E1] text-xs text-slate-700 leading-relaxed">
          <strong className="text-[#0E2235]">Key Takeaway:</strong> {activity.pedagogicalTakeaway}
        </div>
      </div>

      {/* Structured Reflection Input */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-semibold text-base text-[#0E2235]">
          How did your thinking feel today?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MOOD_CHOICES.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.label)}
              className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
                selectedMood === m.label
                  ? 'border-[#0E2235] bg-[#FAF7F0] text-[#0E2235] ring-2 ring-[#0E2235]/10 shadow-xs'
                  : 'border-[#E8E6E1] bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-lg block mb-1">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-[#0E2235]">
            Optional: In your own words, what is one thing to remember about this rule?
          </label>
          <input
            type="text"
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            placeholder="e.g. Always check the clock direction first..."
            className="w-full px-4 py-2.5 text-xs bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm"
          >
            <span>Save Reflection & Return to Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
