import React, { useState, useEffect } from 'react';
import { getActivityById } from '../../data/activities';
import { ObserveStage } from './ObserveStage';
import { ExperimentStage } from './ExperimentStage';
import { DiscoverStage } from './DiscoverStage';
import { ApplyStage } from './ApplyStage';
import { ReflectStage } from './ReflectStage';
import { SessionRecord } from '../../types/reasoning';
import { recordSessionCompletion, getActiveChild } from '../../utils/storage';
import { Eye, Compass, Lightbulb, Target, Sparkles, X, ChevronRight } from 'lucide-react';

interface SessionRunnerProps {
  activityId: string;
  onExit: () => void;
  onCompleted?: () => void;
}

type StageType = 'observe' | 'experiment' | 'discover' | 'apply' | 'reflect';

export const SessionRunner: React.FC<SessionRunnerProps> = ({ activityId, onExit, onCompleted }) => {
  const activity = getActivityById(activityId) || getActivityById('rot-101')!;
  const activeChild = getActiveChild();

  const [currentStage, setCurrentStage] = useState<StageType>('observe');
  const [stagesVisited, setStagesVisited] = useState<StageType[]>(['observe']);
  const [startTime] = useState<number>(Date.now());

  // Session metrics collected across stages
  const [observation, setObservation] = useState<string>('');
  const [experimentActions, setExperimentActions] = useState<number>(0);
  const [discoverAttempts, setDiscoverAttempts] = useState<number>(1);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [transferCorrect, setTransferCorrect] = useState<boolean>(false);
  const [transferAttempts, setTransferAttempts] = useState<number>(1);

  const STAGES: { id: StageType; label: string; icon: React.ElementType }[] = [
    { id: 'observe', label: '1. Observe', icon: Eye },
    { id: 'experiment', label: '2. Experiment', icon: Compass },
    { id: 'discover', label: '3. Discover', icon: Lightbulb },
    { id: 'apply', label: '4. Apply Transfer', icon: Target },
    { id: 'reflect', label: '5. Reflect', icon: Sparkles },
  ];

  const handleStageTransition = (nextStage: StageType) => {
    setCurrentStage(nextStage);
    setStagesVisited((prev) => (prev.includes(nextStage) ? prev : [...prev, nextStage]));
  };

  const handleFinishSession = (reflectionMood: string, reflectionNote: string) => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Adaptive outcome recommendation
    let recommendation = 'Continue practicing core variations.';
    if (transferCorrect && hintsUsed === 0) {
      recommendation = 'Strong independent transfer demonstrated. Recommend advancing to complex multi-step rules.';
    } else if (transferCorrect) {
      recommendation = 'Concept transferred successfully with guidance. Continue reinforcing across diverse geometries.';
    } else {
      recommendation = 'Review foundational relationship with focused manipulation sandbox.';
    }

    const session: SessionRecord = {
      id: `sess-${Date.now()}`,
      childId: activeChild.id,
      activityId: activity.id,
      activityTitle: activity.title,
      moduleId: activity.moduleId,
      subskillId: activity.subskillId,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      stagesVisited,
      initialObservation: observation || 'Direction changes',
      experimentTransformationsCount: experimentActions,
      ruleDiscoveredOnAttempt: discoverAttempts,
      hintsUsedCount: hintsUsed,
      transferAnsweredCorrectly: transferCorrect,
      transferAttemptsCount: transferAttempts,
      reflectionMood,
      reflectionNote,
      adaptationRecommendation: recommendation,
    };

    recordSessionCompletion(session);
    if (onCompleted) {
      onCompleted();
    } else {
      onExit();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0E2235] flex flex-col">
      {/* Studio Session Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E8E6E1] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#0E2235] hover:bg-[#FAF7F0] transition-colors"
              title="Exit learning session"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="font-serif font-bold text-sm sm:text-base text-[#0E2235] block truncate max-w-[200px] sm:max-w-md">
                {activity.title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {activity.moduleTitle} · {activity.subskillTitle}
              </span>
            </div>
          </div>

          {/* 5-Stage Stepper */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-xl border border-[#E8E6E1]">
            {STAGES.map((s, idx) => {
              const isCurrent = currentStage === s.id;
              const isVisited = stagesVisited.includes(s.id);
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-white text-[#0E2235] shadow-xs font-semibold'
                        : isVisited
                        ? 'text-slate-700 hover:text-[#0E2235]'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#C99543]' : ''}`} />
                    <span>{s.label}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-300 mx-0.5" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Child Profile Indicator */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: activeChild.avatarColor || '#C99543' }}
            >
              {activeChild.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-700 hidden sm:inline">
              {activeChild.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main Learning Arena */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        {currentStage === 'observe' && (
          <ObserveStage
            activity={activity}
            onComplete={(chosenObservation) => {
              setObservation(chosenObservation);
              handleStageTransition('experiment');
            }}
          />
        )}

        {currentStage === 'experiment' && (
          <ExperimentStage
            activity={activity}
            onComplete={(actionsCount) => {
              setExperimentActions(actionsCount);
              handleStageTransition('discover');
            }}
          />
        )}

        {currentStage === 'discover' && (
          <DiscoverStage
            activity={activity}
            onComplete={(attempts, hints) => {
              setDiscoverAttempts(attempts);
              setHintsUsed(hints);
              handleStageTransition('apply');
            }}
          />
        )}

        {currentStage === 'apply' && (
          <ApplyStage
            activity={activity}
            onComplete={(isCorrect, attempts) => {
              setTransferCorrect(isCorrect);
              setTransferAttempts(attempts);
              handleStageTransition('reflect');
            }}
          />
        )}

        {currentStage === 'reflect' && (
          <ReflectStage
            activity={activity}
            sessionSummary={{
              observation,
              experimentActions,
              ruleDiscovered: true,
              hintsUsed,
              transferCorrect,
            }}
            onFinish={handleFinishSession}
          />
        )}
      </main>
    </div>
  );
};
