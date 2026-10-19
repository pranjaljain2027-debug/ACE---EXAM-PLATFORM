import React from 'react';
import { getActiveChild, getSessionsForChild } from '../utils/storage';
import { ACTIVITIES } from '../data/activities';
import { Play, Compass, Sparkles, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ChildStudioHomeProps {
  onStartActivity: (activityId: string) => void;
  onOpenLearnMap: () => void;
  onOpenRuleLabs: () => void;
  onOpenProgress: () => void;
}

export const ChildStudioHome: React.FC<ChildStudioHomeProps> = ({
  onStartActivity,
  onOpenLearnMap,
  onOpenRuleLabs,
  onOpenProgress,
}) => {
  const activeChild = getActiveChild();
  const sessions = getSessionsForChild(activeChild.id);

  // Find next unfinished activity
  const nextActivity =
    ACTIVITIES.find((a) => !activeChild.completedActivityIds.includes(a.id)) ||
    ACTIVITIES[0];

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-8 px-6 max-w-6xl mx-auto space-y-10">
      {/* Welcoming Greeting Banner */}
      <div className="bg-white border border-[#E8E6E1] rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
              style={{ backgroundColor: activeChild.avatarColor }}
            >
              {activeChild.name.charAt(0)}
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#718C7B]">
              Welcome back, {activeChild.name}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0E2235] tracking-tight">
            Today, let’s explore how shapes change.
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            There are no mistakes here—only experiments. Try turning, flipping, and changing patterns to discover the secret rules behind them.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartActivity(nextActivity.id)}
              className="px-6 py-3 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-xs flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-[#C99543]" />
              <span>Continue Learning: {nextActivity.title}</span>
            </button>

            <button
              onClick={onOpenRuleLabs}
              className="px-5 py-3 text-xs font-semibold text-[#0E2235] bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl hover:bg-white transition-colors"
            >
              Open Rule Lab Sandbox
            </button>
          </div>
        </div>

        {/* Ambient subtle background geometry */}
        <div className="hidden lg:block absolute -right-6 -bottom-10 w-72 h-72 border-[16px] border-[#FAF7F0] rounded-full pointer-events-none opacity-80" />
      </div>

      {/* Primary Focus Card & Quick Paths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Lesson Spotlight */}
        <div className="md:col-span-2 bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Recommended Lesson
            </span>
            <span className="text-xs font-medium text-[#C99543]">
              Level {nextActivity.difficulty} · {nextActivity.moduleTitle}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0E2235]">
              {nextActivity.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {nextActivity.promptText}
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] flex items-center justify-between">
            <div className="text-xs text-slate-700">
              <strong className="text-[#0E2235] block">5-Stage Journey:</strong>
              Observe → Experiment → Discover → Apply → Reflect
            </div>
            <button
              onClick={() => onStartActivity(nextActivity.id)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0E2235] rounded-lg hover:bg-[#1a3852] transition-colors shadow-2xs"
            >
              Begin Session
            </button>
          </div>
        </div>

        {/* Studio Stats Summary */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Your Reasoning Journey
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#0E2235] tabular-nums">
                {activeChild.completedActivityIds.length}
              </span>
              <span className="text-xs text-slate-500">skills mastered</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have explored rotation, reflection, and visual patterns across {sessions.length} complete studio sessions.
            </p>
          </div>

          <button
            onClick={onOpenProgress}
            className="w-full py-2.5 text-xs font-semibold text-[#0E2235] bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Star Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Quick Explore Rule Labs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-[#0E2235]">
            Featured Spatial Laboratories
          </h2>
          <button
            onClick={onOpenLearnMap}
            className="text-xs font-semibold text-slate-600 hover:text-[#0E2235] flex items-center gap-1"
          >
            <span>View full curriculum map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTIVITIES.slice(0, 4).map((act) => {
            const isDone = activeChild.completedActivityIds.includes(act.id);
            return (
              <div
                key={act.id}
                className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{act.moduleTitle.split('&')[0]}</span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#718C7B]" />}
                  </div>
                  <h3 className="font-serif font-bold text-sm text-[#0E2235] leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {act.subskillTitle}
                  </p>
                </div>

                <button
                  onClick={() => onStartActivity(act.id)}
                  className={`w-full py-2 text-xs font-medium rounded-lg transition-colors ${
                    isDone
                      ? 'bg-[#FAF7F0] text-slate-700 hover:bg-white border border-[#E8E6E1]'
                      : 'bg-[#0E2235] text-white hover:bg-[#1a3852]'
                  }`}
                >
                  {isDone ? 'Explore Again' : 'Start Session'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
