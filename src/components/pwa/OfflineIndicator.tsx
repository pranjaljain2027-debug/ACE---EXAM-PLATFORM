import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../utils/useOnlineStatus';
import { WifiOff, Wifi, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissed(false);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isDismissed && !showRestored) return null;

  if (!isOnline) {
    return (
      <aside
        aria-label="Offline status"
        className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 bg-[#0E2235] text-[#FAF7F0] border border-[#C99543]/40 rounded-xl p-3 shadow-lg flex items-start gap-3 animate-fadeIn"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-[#C99543] flex items-center justify-center shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs space-y-0.5">
          <span className="font-serif font-bold text-sm text-[#FAF7F0] block">
            Offline Learning Active
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            You have no active internet connection, but all core reasoning activities, canvas tools, and progress saves work seamlessly offline.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss offline alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  if (showRestored) {
    return (
      <aside
        aria-label="Online status"
        className="fixed bottom-4 left-4 z-50 bg-[#718C7B] text-white rounded-xl p-3 shadow-lg flex items-center gap-2.5 text-xs font-medium animate-fadeIn"
      >
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Connection Restored — Studio synced</span>
      </aside>
    );
  }

  return null;
};
