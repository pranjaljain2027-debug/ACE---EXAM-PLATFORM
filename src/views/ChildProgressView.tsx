import React from 'react';
import { getActiveChild, getSessionsForChild } from '../utils/storage';
import { Sparkles, Award, Compass, RotateCw, CheckCircle2, ArrowRight } from 'lucide-react';

interface ChildProgressViewProps {
  onBackToStudio: () => void;
}

export const ChildProgressView: React.FC<ChildProgressViewProps> = ({ onBackToStudio }) => {
  const activeChild = getActiveChild();
  const sessions = getSessionsForChild(activeChild.id);

  const BADGES = [
    { id: 'b1', title: 'Compass Explorer', desc: 'Discovered the 90° clockwise rotation rule', earned: activeChild.completedActivityIds.includes('rot-101') },
    { id: 'b2', title: 'Chiral Master', desc: 'Discovered the horizontal mirror reflection line', earned: activeChild.completedActivityIds.includes('ref-101') },
    { id: 'b3', title: 'Sequence Tracker', desc: 'Solved arithmetic progression patterns', earned: activeChild.completedActivityIds.includes('prog-101') },
    { id: 'b4', title: 'Distractor Shield', desc: 'Filtered noisy color changes from orientation rules', earned: activeChild.completedActivityIds.includes('attr-103') },
    { id: 'b5', title: 'Deep Thinker', desc: 'Completed a session with zero hints', earned: sessions.some((s) => s.hintsUsedCount === 0) },
  ];

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-8 px-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6E1]">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#718C7B]">
            Spatial Constellation
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#0E2235]">
            {activeChild.name}’s Discovery Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Every step celebrates curiosity, experiments, and thinking discovered.
          </p>
        </div>

        <button
          onClick={onBackToStudio}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-2xs self-start sm:self-auto"
        >
          Return to Studio
        </button>
      </div>

      {/* Discovery Milestones Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#0E2235]">
          Discovery Milestones
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition-all ${
                b.earned
                  ? 'bg-white border-[#E8E6E1] shadow-xs'
                  : 'bg-white/40 border-dashed border-[#E8E6E1] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    b.earned ? 'bg-[#FAF7F0] text-[#C99543] border border-[#E8E6E1]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                {b.earned && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Unlocked
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0E2235]">{b.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Thought Log / Reflections */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#0E2235]">
          Your Thinking Journal
        </h2>
        <p className="text-xs text-slate-600">
          Thoughts you captured after solving your studio sessions.
        </p>

        <div className="space-y-3 pt-2">
          {sessions.map((s) => (
            <div key={s.id} className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif font-bold text-[#0E2235]">{s.activityTitle}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(s.completedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 italic">
                "{s.reflectionNote || 'I discovered how the shape moves across each step.'}"
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                <span>Mood: {s.reflectionMood || 'Confident'}</span>
                <span>·</span>
                <span>Hints: {s.hintsUsedCount === 0 ? 'None' : `${s.hintsUsedCount} used`}</span>
                <span>·</span>
                <span className="text-[#718C7B] font-medium">Transfer: {s.transferAnsweredCorrectly ? 'Mastered' : 'Practiced'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
