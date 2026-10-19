import React, { useState } from 'react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { Download, Share, X, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'card' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div className={`p-4 bg-white border border-[#E8E6E1] rounded-2xl shadow-xs flex items-center justify-between gap-4 ${className}`}>
          <div className="space-y-0.5">
            <span className="font-serif font-bold text-sm text-[#0E2235] block">
              Enable Offline App Mode
            </span>
            <p className="text-xs text-slate-600">
              Install Heir of Wisdom to your home screen for distraction-free offline study.
            </p>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-2xs whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#C99543]" />
            <span>Install App</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E2235] bg-white border border-[#E8E6E1] rounded-xl hover:border-[#0E2235] transition-all shadow-2xs whitespace-nowrap ${className}`}
        title="Install Heir of Wisdom for offline access"
      >
        <Download className="w-3.5 h-3.5 text-[#C99543]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-[#E8E6E1] rounded-xl hover:text-[#0E2235] hover:border-slate-300 transition-colors whitespace-nowrap ${className}`}
        >
          <Share className="w-3.5 h-3.5 text-[#718C7B]" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E2235]/60 backdrop-blur-2xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E8E6E1] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E6E1]">
                <h3 className="font-serif font-bold text-base text-[#0E2235]">
                  Install on iPad / iPhone
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-[#0E2235]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center font-bold text-[#0E2235] shrink-0">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-[#0E2235]">Share</strong> button in the Safari navigation bar.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center font-bold text-[#0E2235] shrink-0">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong className="text-[#0E2235]">Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center font-bold text-[#0E2235] shrink-0">
                    3
                  </div>
                  <div>
                    Launch Heir of Wisdom from your home screen for full offline learning.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
