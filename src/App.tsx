import React, { useState, useEffect } from 'react';
import { TopNav } from './components/navigation/TopNav';
import { ChildStudioNav } from './components/navigation/ChildStudioNav';
import { LandingPage } from './views/LandingPage';
import { HowItWorksPage } from './views/HowItWorksPage';
import { PricingPage } from './views/PricingPage';
import { ParentOnboarding } from './views/ParentOnboarding';
import { ParentDashboard } from './views/ParentDashboard';
import { ParentSettings } from './views/ParentSettings';
import { ChildStudioHome } from './views/ChildStudioHome';
import { ChildLearnMap } from './views/ChildLearnMap';
import { ChildRuleLab } from './views/ChildRuleLab';
import { ChildProgressView } from './views/ChildProgressView';
import { SessionRunner } from './components/session/SessionRunner';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [childTab, setChildTab] = useState<'home' | 'learn' | 'labs' | 'progress'>('home');

  // Sync with browser URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isChildStudio = currentPath.startsWith('/studio');
  const isParentArea = currentPath.startsWith('/parent');

  // Handle Launching a session
  const handleStartActivity = (activityId: string) => {
    setActiveSessionId(activityId);
    navigate(`/studio/session/${activityId}`);
  };

  const handleFinishSession = () => {
    setActiveSessionId(null);
    navigate('/studio');
  };

  // If inside active session runner
  if (activeSessionId) {
    return (
      <>
        <OfflineIndicator />
        <SessionRunner
          activityId={activeSessionId}
          onExit={() => {
            setActiveSessionId(null);
            navigate('/studio');
          }}
          onCompleted={handleFinishSession}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0E2235] flex flex-col font-sans">
      <OfflineIndicator />
      {/* Dynamic Navigation Bar */}
      {isChildStudio ? (
        <ChildStudioNav
          currentTab={childTab}
          onSelectTab={(tab) => {
            setChildTab(tab);
            if (tab === 'home') navigate('/studio');
            else if (tab === 'learn') navigate('/studio/learn');
            else if (tab === 'labs') navigate('/studio/labs');
            else if (tab === 'progress') navigate('/studio/progress');
          }}
          onGoToHome={() => navigate('/')}
          onExitToParent={() => navigate('/parent/dashboard')}
        />
      ) : (
        <TopNav
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenChildStudio={() => {
            setChildTab('home');
            navigate('/studio');
          }}
        />
      )}

      {/* Main Body Routing */}
      <main className="flex-1">
        {/* Child Studio Views */}
        {isChildStudio && (
          <>
            {currentPath === '/studio' && (
              <ChildStudioHome
                onStartActivity={handleStartActivity}
                onOpenLearnMap={() => {
                  setChildTab('learn');
                  navigate('/studio/learn');
                }}
                onOpenRuleLabs={() => {
                  setChildTab('labs');
                  navigate('/studio/labs');
                }}
                onOpenProgress={() => {
                  setChildTab('progress');
                  navigate('/studio/progress');
                }}
              />
            )}

            {currentPath === '/studio/learn' && (
              <ChildLearnMap onStartActivity={handleStartActivity} />
            )}

            {currentPath === '/studio/labs' && <ChildRuleLab />}

            {currentPath === '/studio/progress' && (
              <ChildProgressView
                onBackToStudio={() => {
                  setChildTab('home');
                  navigate('/studio');
                }}
              />
            )}
          </>
        )}

        {/* Parent & Public Views */}
        {!isChildStudio && (
          <>
            {currentPath === '/' && (
              <LandingPage
                onStartLearning={() => handleStartActivity('rot-101')}
                onExploreCurriculum={() => navigate('/curriculum')}
                onViewPricing={() => navigate('/pricing')}
                onGoToOnboarding={() => navigate('/parent/onboarding')}
              />
            )}

            {currentPath === '/how-it-works' && (
              <HowItWorksPage
                onStartSession={() => handleStartActivity('rot-101')}
                onGoToOnboarding={() => navigate('/parent/onboarding')}
              />
            )}

            {currentPath === '/curriculum' && (
              <div className="py-8">
                <ChildLearnMap onStartActivity={handleStartActivity} />
              </div>
            )}

            {currentPath === '/pricing' && (
              <PricingPage
                onSelectPlan={(plan) => console.log('Selected', plan)}
                onGoToOnboarding={() => navigate('/parent/onboarding')}
              />
            )}

            {currentPath === '/parent/onboarding' && (
              <ParentOnboarding
                onComplete={() => {
                  setChildTab('home');
                  navigate('/studio');
                }}
                onCancel={() => navigate('/')}
              />
            )}

            {currentPath === '/parent/dashboard' && (
              <ParentDashboard
                onLaunchChildStudio={() => {
                  setChildTab('home');
                  navigate('/studio');
                }}
                onOpenSettings={() => navigate('/parent/settings')}
              />
            )}

            {currentPath === '/parent/settings' && (
              <ParentSettings onBack={() => navigate('/parent/dashboard')} />
            )}
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-[#E8E6E1] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-serif font-bold text-sm text-[#0E2235]">
              Heir of Wisdom
            </span>
            <p className="text-[11px] text-slate-500">
              Wisdom is inherited. Thinking is discovered. Independent visual reasoning studio for ages 8–12.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => navigate('/how-it-works')} className="hover:text-[#0E2235] transition-colors">
              Pedagogical Engine
            </button>
            <button onClick={() => navigate('/curriculum')} className="hover:text-[#0E2235] transition-colors">
              Curriculum Modules
            </button>
            <button onClick={() => navigate('/pricing')} className="hover:text-[#0E2235] transition-colors">
              Tuition & Pricing
            </button>
            <button onClick={() => navigate('/parent/dashboard')} className="hover:text-[#0E2235] transition-colors">
              Parent Dashboard
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            © 2026 Heir of Wisdom Cognitive Studio. Original assessment-style tasks.
          </div>
        </div>
      </footer>
    </div>
  );
}
