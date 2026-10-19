import React, { useState } from 'react';
import { CURRICULUM_MODULES } from '../data/modules';
import { getActivitiesByModule, ACTIVITIES } from '../data/activities';
import { getActiveChild } from '../utils/storage';
import { CheckCircle2, Play, ArrowRight, Lock, RotateCw, FlipHorizontal, TrendingUp, Layers } from 'lucide-react';

interface ChildLearnMapProps {
  onStartActivity: (activityId: string) => void;
}

export const ChildLearnMap: React.FC<ChildLearnMapProps> = ({ onStartActivity }) => {
  const activeChild = getActiveChild();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('rotation');

  const selectedModule = CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) || CURRICULUM_MODULES[0];
  const moduleActivities = getActivitiesByModule(selectedModuleId);

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'rotation':
        return RotateCw;
      case 'reflection':
        return FlipHorizontal;
      case 'progression':
        return TrendingUp;
      case 'attributes':
        return Layers;
      default:
        return RotateCw;
    }
  };

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-8 px-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-[#718C7B]">
          Curriculum Map
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#0E2235]">
          The Reasoning Pathways
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Select a core spatial domain to practice. Each pathway takes you through guided observation, hands-on experimentation, rule discovery, and independent transfer.
        </p>
      </div>

      {/* Module Selector Tabs (functional segmented buttons) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CURRICULUM_MODULES.map((mod) => {
          const Icon = getModuleIcon(mod.id);
          const isSelected = selectedModuleId === mod.id;
          const acts = getActivitiesByModule(mod.id);
          const completedCount = acts.filter((a) => activeChild.completedActivityIds.includes(a.id)).length;

          return (
            <button
              key={mod.id}
              onClick={() => setSelectedModuleId(mod.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-white border-[#0E2235] ring-2 ring-[#0E2235]/10 shadow-xs'
                  : 'bg-white/70 border-[#E8E6E1] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C99543]' : 'text-slate-500'}`} />
                <span className="text-[11px] font-mono text-slate-500">
                  {completedCount}/{acts.length} Done
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-[#0E2235] block truncate">
                {mod.title.split('&')[0]}
              </h3>
              <span className="text-[11px] text-slate-500 line-clamp-1 block mt-0.5">
                {mod.tagline}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Module Details & Lesson List */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E1]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Active Pathway
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#0E2235]">
              {selectedModule.title}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
              {selectedModule.description}
            </p>
          </div>
        </div>

        {/* Activities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleActivities.map((act) => {
            const isCompleted = activeChild.completedActivityIds.includes(act.id);
            return (
              <div
                key={act.id}
                className="p-5 rounded-xl border border-[#E8E6E1] bg-[#FAF7F0]/40 hover:bg-[#FAF7F0] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Level {act.difficulty} · Ages {act.ageBand}</span>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-[#718C7B] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#0E2235]">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {act.promptText}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E8E6E1]/60">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {act.subskillTitle}
                  </span>
                  <button
                    onClick={() => onStartActivity(act.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0E2235] rounded-lg hover:bg-[#1a3852] transition-colors shadow-2xs"
                  >
                    <Play className="w-3 h-3 text-[#C99543]" />
                    <span>{isCompleted ? 'Review' : 'Start'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
