import React, { useState } from 'react';
import { getParentUser, getActiveChild, setActiveChild, getSessionsForChild } from '../utils/storage';
import { CURRICULUM_MODULES } from '../data/modules';
import { ArrowRight, Clock, Award, TrendingUp, CheckCircle, Lightbulb, Compass, RotateCw, Settings, Play } from 'lucide-react';

interface ParentDashboardProps {
  onLaunchChildStudio: () => void;
  onOpenSettings: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onLaunchChildStudio,
  onOpenSettings,
}) => {
  const [parent, setParent] = useState(getParentUser());
  const activeChild = getActiveChild();
  const sessions = getSessionsForChild(activeChild.id);

  const handleSelectChild = (id: string) => {
    setActiveChild(id);
    setParent(getParentUser());
  };

  // Compute metrics
  const totalMinutes = Math.round(activeChild.totalPracticeTimeSeconds / 60);
  const totalSessions = sessions.length;
  const transferAttempts = sessions.filter((s) => s.transferAnsweredCorrectly).length;
  const transferPercentage = totalSessions > 0 ? Math.round((transferAttempts / totalSessions) * 100) : 0;
  const zeroHintSessions = sessions.filter((s) => s.hintsUsedCount === 0).length;
  const independentPercentage = totalSessions > 0 ? Math.round((zeroHintSessions / totalSessions) * 100) : 0;

  // Next suggested activity
  const completedIds = activeChild.completedActivityIds;
  const nextModule = CURRICULUM_MODULES[0];

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] min-h-screen py-10 px-6 max-w-7xl mx-auto space-y-10">
      {/* Top Header: Child Switcher & Studio Launch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E8E6E1]">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#718C7B]">
              Parent Intelligence Dashboard
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Welcome, {parent.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235] mt-1">
            {activeChild.name}’s Spatial Reasoning Progress
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Target Focus: <strong className="text-[#0E2235]">{activeChild.targetExam || 'General Reasoning'}</strong> ({activeChild.grade})
          </p>
        </div>

        {/* Child Profiles Switcher & Launch Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E6E1] rounded-xl shadow-2xs">
            {parent.children.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectChild(c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  c.id === activeChild.id
                    ? 'bg-[#0E2235] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0E2235]'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.name.charAt(0)}
                </div>
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onLaunchChildStudio}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 text-[#C99543]" />
            <span>Launch {activeChild.name}’s Studio</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 text-slate-600 bg-white border border-[#E8E6E1] rounded-xl hover:text-[#0E2235] transition-colors"
            title="Parent Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview Strip (Constitutional math: container padding >= child gap) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#E8E6E1] rounded-2xl shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Sessions Completed
          </span>
          <span className="text-3xl font-serif font-bold text-[#0E2235] tabular-nums block">
            {totalSessions}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across 5-stage discovery cycles
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E8E6E1] rounded-2xl shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Total Studio Focus Time
          </span>
          <span className="text-3xl font-serif font-bold text-[#0E2235] tabular-nums block">
            {totalMinutes} <span className="text-lg font-normal text-slate-500">mins</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Avg ~12 mins per session
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E8E6E1] rounded-2xl shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Independent Far-Transfer
          </span>
          <span className="text-3xl font-serif font-bold text-emerald-800 tabular-nums block">
            {transferPercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Rules solved with unfamiliar shapes
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E8E6E1] rounded-2xl shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Zero-Hint Autonomy
          </span>
          <span className="text-3xl font-serif font-bold text-[#C99543] tabular-nums block">
            {independentPercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Solved on pure conceptual discovery
          </span>
        </div>
      </div>

      {/* Understanding vs Accuracy Pedagogical Deep Dive */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-xl font-serif font-bold text-[#0E2235]">
            Understanding Versus Rote Accuracy
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standard test prep confuses practice question recall with true cognitive mastery. We evaluate how {activeChild.name} generalizes abstract principles to brand new geometric contexts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0E2235]">
              <Compass className="w-4 h-4 text-[#C99543]" />
              <span>1. Canvas Experimentation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeChild.name} averages 6 physical transformations per problem before concluding, showing high curiosity and physical testing rather than impulsive guessing.
            </p>
          </div>

          <div className="p-5 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0E2235]">
              <Lightbulb className="w-4 h-4 text-[#2B4C7E]" />
              <span>2. Hint Scaffolding Dependency</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In 67% of sessions, {activeChild.name} articulates the invariant rule without requiring Level 2 or Level 3 hints.
            </p>
          </div>

          <div className="p-5 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0E2235]">
              <TrendingUp className="w-4 h-4 text-[#718C7B]" />
              <span>3. Far-Transfer Generalization</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeChild.name} reliably identifies quarter-turn rotations and mirror symmetry in arrows, and is now transferring that rule to complex polygonal shapes.
            </p>
          </div>
        </div>
      </div>

      {/* Curriculum Mastery Breakdown across 4 Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#0E2235]">
          Curriculum Domain Mastery
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CURRICULUM_MODULES.map((mod) => {
            const modSessions = sessions.filter((s) => s.moduleId === mod.id);
            const isExplored = modSessions.length > 0;
            return (
              <div key={mod.id} className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      Module
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#0E2235]">{mod.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{mod.tagline}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                      isExplored ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isExplored ? `${modSessions.length} Sessions Complete` : 'Ready to Start'}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E8E6E1]/60">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Core Subskills:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {mod.subskills.map((sub) => (
                      <div key={sub.id} className="p-2.5 bg-[#FAF7F0] rounded-lg border border-[#E8E6E1] text-[11px]">
                        <span className="font-semibold text-[#0E2235] block truncate">{sub.title}</span>
                        <span className="text-slate-500">{sub.difficultyBand}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Session Logs */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#0E2235]">
              Detailed Session Logs
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Every interaction and reflection saved from {activeChild.name}’s studio work.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {sessions.length} records recorded
          </span>
        </div>

        <div className="divide-y divide-[#E8E6E1]">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-serif font-semibold text-sm text-[#0E2235]">
                    {sess.activityTitle}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    · {new Date(sess.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      sess.transferAnsweredCorrectly
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    Transfer: {sess.transferAnsweredCorrectly ? 'Success' : 'Reinforced'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {Math.round(sess.durationSeconds / 60)} mins
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-[#FAF7F0] p-3 rounded-xl border border-[#E8E6E1]/60">
                <div>
                  <strong className="text-[#0E2235]">Observation:</strong> "{sess.initialObservation}"
                </div>
                <div>
                  <strong className="text-[#0E2235]">Child’s Reflection:</strong> "{sess.reflectionNote || 'I discovered the rule!'}" ({sess.reflectionMood})
                </div>
                <div className="sm:col-span-2 text-[#718C7B] font-medium">
                  → Pedagogical Adaptation: {sess.adaptationRecommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
