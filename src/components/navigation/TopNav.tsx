import React from 'react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface TopNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenChildStudio: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentPath, onNavigate, onOpenChildStudio }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F0]/95 backdrop-blur-xs border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Brand title, single line text wordmark */}
        <button
          onClick={() => onNavigate('/')}
          className="text-xl font-serif font-bold tracking-tight text-[#0E2235] whitespace-nowrap shrink-0 text-left hover:opacity-90 transition-opacity"
        >
          Heir of Wisdom
        </button>

        {/* Zone 2: 4–5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
          <button
            onClick={() => onNavigate('/how-it-works')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0E2235] ${
              currentPath === '/how-it-works' ? 'text-[#0E2235] font-semibold border-b-2 border-[#0E2235] pb-0.5' : ''
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigate('/curriculum')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0E2235] ${
              currentPath === '/curriculum' ? 'text-[#0E2235] font-semibold border-b-2 border-[#0E2235] pb-0.5' : ''
            }`}
          >
            Curriculum
          </button>
          <button
            onClick={() => onNavigate('/pricing')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0E2235] ${
              currentPath === '/pricing' ? 'text-[#0E2235] font-semibold border-b-2 border-[#0E2235] pb-0.5' : ''
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => onNavigate('/parent/dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0E2235] ${
              currentPath.startsWith('/parent') ? 'text-[#0E2235] font-semibold border-b-2 border-[#0E2235] pb-0.5' : ''
            }`}
          >
            Parent Dashboard
          </button>
        </nav>

        {/* Zone 3: 1 primary action + PWA Install affordance */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            onClick={onOpenChildStudio}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            Enter Child Studio
          </button>
        </div>
      </div>
    </header>
  );
};
