import React, { useState } from 'react';
import { getParentUser, getActiveChild, setActiveChild } from '../../utils/storage';
import { Compass, BookOpen, Sparkles, Map, UserCircle, LogOut, ChevronDown } from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface ChildStudioNavProps {
  currentTab: 'home' | 'learn' | 'labs' | 'progress';
  onSelectTab: (tab: 'home' | 'learn' | 'labs' | 'progress') => void;
  onExitToParent: () => void;
  onProfileChanged?: () => void;
}

export const ChildStudioNav: React.FC<ChildStudioNavProps> = ({
  currentTab,
  onSelectTab,
  onExitToParent,
  onProfileChanged,
}) => {
  const parent = getParentUser();
  const activeChild = getActiveChild();
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);

  const handleSelectChild = (id: string) => {
    setActiveChild(id);
    setShowChildSwitcher(false);
    onProfileChanged?.();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F0]/95 backdrop-blur-xs border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-3.5">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="text-lg font-serif font-bold text-[#0E2235] whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            Heir of Wisdom
          </button>
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">
            · Studio
          </span>
        </div>

        {/* Child Studio Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'home'
                ? 'text-[#0E2235] font-semibold bg-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0E2235]'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => onSelectTab('learn')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'learn'
                ? 'text-[#0E2235] font-semibold bg-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0E2235]'
            }`}
          >
            Learn Path
          </button>
          <button
            onClick={() => onSelectTab('labs')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'labs'
                ? 'text-[#0E2235] font-semibold bg-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0E2235]'
            }`}
          >
            Rule Labs
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'progress'
                ? 'text-[#0E2235] font-semibold bg-white shadow-2xs'
                : 'text-slate-600 hover:text-[#0E2235]'
            }`}
          >
            My Journey
          </button>
        </nav>

        {/* Profile Switcher, PWA Install & Exit */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
          <PWAInstallButton />
          <div className="relative">
            <button
              onClick={() => setShowChildSwitcher(!showChildSwitcher)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#E8E6E1] rounded-xl text-xs font-semibold text-[#0E2235] hover:border-[#0E2235] transition-all shadow-2xs"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                style={{ backgroundColor: activeChild.avatarColor || '#C99543' }}
              >
                {activeChild.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{activeChild.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showChildSwitcher && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E6E1] rounded-xl shadow-lg p-2 z-50 animate-fadeIn">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1 block">
                  Switch Profile
                </span>
                {parent.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChild(c.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      c.id === activeChild.id ? 'bg-[#FAF7F0] text-[#0E2235] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <span>{c.name} ({c.grade})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onExitToParent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-[#E8E6E1] rounded-xl hover:text-[#0E2235] hover:border-slate-300 transition-colors whitespace-nowrap"
            title="Return to Parent Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Parent Area</span>
          </button>
        </div>
      </div>
    </header>
  );
};
