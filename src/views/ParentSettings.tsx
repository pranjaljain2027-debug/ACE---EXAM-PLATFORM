import React, { useState } from 'react';
import { getParentUser, saveParentUser, resetToDefaults, getActiveChild } from '../utils/storage';
import { ParentUser, ChildProfile } from '../types/reasoning';
import { ArrowLeft, Save, RotateCcw, Plus, Trash2, Check, CreditCard, Shield } from 'lucide-react';

interface ParentSettingsProps {
  onBack: () => void;
}

export const ParentSettings: React.FC<ParentSettingsProps> = ({ onBack }) => {
  const [parent, setParent] = useState<ParentUser>(getParentUser());
  const [activeChild, setActiveChild] = useState<ChildProfile>(getActiveChild());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveParentUser(parent);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all progress, children profiles, and sessions back to sample defaults?')) {
      resetToDefaults();
      setParent(getParentUser());
      setActiveChild(getActiveChild());
    }
  };

  const handleUpdateChild = (key: keyof ChildProfile, val: any) => {
    const updatedChildren = parent.children.map((c) =>
      c.id === activeChild.id ? { ...c, [key]: val } : c
    );
    const updatedActive = { ...activeChild, [key]: val };
    setActiveChild(updatedActive);
    setParent({ ...parent, children: updatedChildren });
  };

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] min-h-screen py-10 px-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E2235] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-2xs"
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
          Parent & Account Settings
        </h1>
        <p className="text-xs text-slate-600">
          Manage child profiles, assessment goals, and subscription details.
        </p>
      </div>

      {/* Child Profile Settings */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-serif font-bold text-[#0E2235]">
          Active Child Profile: {activeChild.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#0E2235] block mb-1">
              Child's Display Name
            </label>
            <input
              type="text"
              value={activeChild.name}
              onChange={(e) => handleUpdateChild('name', e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0E2235] block mb-1">
              Grade Level
            </label>
            <select
              value={activeChild.grade}
              onChange={(e) => handleUpdateChild('grade', e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
            >
              <option>3rd Grade</option>
              <option>4th Grade</option>
              <option>5th Grade</option>
              <option>6th Grade</option>
              <option>7th Grade</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0E2235] block mb-1">
              Assessment Focus
            </label>
            <select
              value={activeChild.targetExam || 'General Reasoning'}
              onChange={(e) => handleUpdateChild('targetExam', e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
            >
              <option>CogAT</option>
              <option>OLSAT</option>
              <option>NNAT</option>
              <option>General Reasoning</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0E2235] block mb-1">
              Primary Learning Goal
            </label>
            <select
              value={activeChild.learningGoal}
              onChange={(e) => handleUpdateChild('learningGoal', e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
            >
              <option value="gifted">Prepare for gifted assessments</option>
              <option value="reasoning">Improve visual reasoning</option>
              <option value="logic">Build logical thinking</option>
              <option value="exploration">Explore reasoning skills</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#0E2235]">
          Subscription & Billing
        </h2>

        <div className="flex items-center justify-between p-4 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#718C7B]" />
            <div>
              <span className="font-semibold text-xs text-[#0E2235] block">
                Scholar Family Plan (Annual)
              </span>
              <span className="text-[11px] text-slate-500">
                Renews Oct 18, 2027 · $199.00 USD
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
            Active
          </span>
        </div>
      </div>

      {/* Offline Learning & Service Worker Sync */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-serif font-bold text-[#0E2235]">
              Offline Learning & Service Worker Status
            </h2>
            <p className="text-xs text-slate-600">
              Core reasoning activities, the SVG manipulation canvas, and child progress tracking are precached for unstable internet environments.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
            Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] text-xs">
            <span className="text-slate-500 block text-[11px]">Service Worker Cache</span>
            <span className="font-semibold text-[#0E2235]">All 4 Curriculum Modules</span>
          </div>
          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] text-xs">
            <span className="text-slate-500 block text-[11px]">Local Persistence</span>
            <span className="font-semibold text-[#0E2235]">Session Logs & Reflections</span>
          </div>
          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E8E6E1] text-xs">
            <span className="text-slate-500 block text-[11px]">Auto-Sync</span>
            <span className="font-semibold text-[#0E2235]">Instant on Reconnect</span>
          </div>
        </div>
      </div>

      {/* Data Management & Reset */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#0E2235]">
          Data Administration
        </h2>
        <p className="text-xs text-slate-600">
          Reset all profile records, session timelines, and completed activity data to clean demonstration defaults.
        </p>

        <div className="pt-2">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Clean Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
