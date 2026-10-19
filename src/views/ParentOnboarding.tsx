import React, { useState } from 'react';
import { addChildProfile, saveParentUser, getParentUser } from '../utils/storage';
import { FrameCanvas } from '../utils/svgShapes';
import { VisualObject } from '../types/reasoning';
import { Check, ArrowRight, User, Sparkles, BookOpen, Target, ShieldAlert } from 'lucide-react';

interface ParentOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AVATARS = [
  { name: 'Lion', color: '#C99543' },
  { name: 'Falcon', color: '#2B4C7E' },
  { name: 'Fox', color: '#B84A39' },
  { name: 'Owl', color: '#718C7B' },
  { name: 'Otter', color: '#5C6B73' },
];

export const ParentOnboarding: React.FC<ParentOnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Parent Info
  const [parentName, setParentName] = useState('Sarah Jenkins');
  const [parentEmail, setParentEmail] = useState('sarah.jenkins@example.com');
  const [parentPassword, setParentPassword] = useState('••••••••••••');

  // Step 2: Child Info
  const [childName, setChildName] = useState('Lucas');
  const [childAge, setChildAge] = useState<number>(9);
  const [childGrade, setChildGrade] = useState('4th Grade');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // Step 3: Learning Goal
  const [learningGoal, setLearningGoal] = useState<'gifted' | 'reasoning' | 'logic' | 'exploration'>('gifted');
  const [targetExam, setTargetExam] = useState<'CogAT' | 'OLSAT' | 'NNAT' | 'General Reasoning'>('CogAT');

  // Step 4: Provisional Diagnostic Mini-Activity
  const [diagnosticAnswer, setDiagnosticAnswer] = useState<number | null>(null);

  // Diagnostic question: Arrow 0° -> 90° -> 180° -> ?
  const diagnosticFrames: VisualObject[][] = [
    [{ id: 'd1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    [{ id: 'd2', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    [{ id: 'd3', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
  ];
  const diagnosticOptions: VisualObject[][] = [
    [{ id: 'opt0', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    [{ id: 'opt1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    [{ id: 'opt2', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
  ];

  const handleFinishOnboarding = () => {
    // Determine starting level
    const startingLevel = diagnosticAnswer === 0 ? 2 : 1;

    // Create child profile
    addChildProfile({
      name: childName || 'Learner',
      age: Number(childAge),
      grade: childGrade,
      avatar: selectedAvatar.name,
      avatarColor: selectedAvatar.color,
      learningGoal,
      targetExam,
      startingLevel,
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0E2235] py-12 px-6 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Onboarding Header with Progress Indicator */}
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#718C7B]">
            Parent Onboarding · Step {step} of 5
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            {step === 1 && 'Welcome to Heir of Wisdom'}
            {step === 2 && 'Set Up Your Child’s Learning Profile'}
            {step === 3 && 'Select Primary Learning Focus'}
            {step === 4 && 'Provisional Starting Level Exploration'}
            {step === 5 && 'Studio Profile Ready'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {step === 1 && 'Create your parent administrative credentials.'}
            {step === 2 && 'Children access their own calm studio without needing an email.'}
            {step === 3 && 'Tailor the curriculum to your family’s goals.'}
            {step === 4 && 'A 60-second interactive check to establish an initial entry point.'}
            {step === 5 && 'Your child is ready to begin their first visual reasoning journey.'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-2 w-full max-w-md mx-auto">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#0E2235]' : 'bg-[#E8E6E1]'
              }`}
            />
          ))}
        </div>

        {/* Step Cards */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* STEP 1: Parent Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                  Parent Full Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-[#0E2235]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors flex items-center gap-1.5"
                >
                  <span>Continue to Child Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Child Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                  Child’s Nickname or First Name
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  placeholder="e.g. Leo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                    Age
                  </label>
                  <select
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  >
                    {[7, 8, 9, 10, 11, 12, 13].map((a) => (
                      <option key={a} value={a}>
                        {a} years old
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0E2235] block mb-1">
                    Grade Level
                  </label>
                  <select
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0E2235]"
                  >
                    <option>3rd Grade</option>
                    <option>4th Grade</option>
                    <option>5th Grade</option>
                    <option>6th Grade</option>
                    <option>7th Grade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0E2235] block mb-2">
                  Choose a Studio Avatar
                </label>
                <div className="flex gap-3">
                  {AVATARS.map((av) => (
                    <button
                      key={av.name}
                      onClick={() => setSelectedAvatar(av)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        selectedAvatar.name === av.name
                          ? 'border-[#0E2235] ring-2 ring-[#0E2235]/15 bg-[#FAF7F0]'
                          : 'border-[#E8E6E1] hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xs"
                        style={{ backgroundColor: av.color }}
                      >
                        {av.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-[#0E2235]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors flex items-center gap-1.5"
                >
                  <span>Choose Learning Goals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Learning Goal */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-[#0E2235] block">
                What is your primary goal for {childName}?
              </label>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'gifted', label: '1. Prepare for gifted & talented assessments', desc: 'CogAT, OLSAT, NNAT spatial reasoning focus' },
                  { id: 'reasoning', label: '2. Improve visual & spatial reasoning', desc: 'Strengthen mental rotation, reflection, and symmetry' },
                  { id: 'logic', label: '3. Build logical thinking and problem-solving', desc: 'Systematic deduction and hypothesis testing' },
                  { id: 'exploration', label: '4. Explore reasoning skills without an examination goal', desc: 'Joyful spatial curiosity and tactile learning' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setLearningGoal(g.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      learningGoal === g.id
                        ? 'border-[#0E2235] bg-[#FAF7F0] ring-2 ring-[#0E2235]/15'
                        : 'border-[#E8E6E1] hover:border-slate-300'
                    }`}
                  >
                    <span className="font-semibold text-xs text-[#0E2235] block">{g.label}</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">{g.desc}</span>
                  </button>
                ))}
              </div>

              {learningGoal === 'gifted' && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 mt-4">
                  <span className="text-xs font-semibold text-amber-950 block">
                    Which assessment are you interested in?
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['CogAT', 'OLSAT', 'NNAT', 'General Reasoning'].map((exam) => (
                      <button
                        key={exam}
                        onClick={() => setTargetExam(exam as any)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                          targetExam === exam
                            ? 'bg-[#0E2235] text-white border-[#0E2235]'
                            : 'bg-white text-slate-700 border-[#E8E6E1]'
                        }`}
                      >
                        {exam}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Heir of Wisdom uses original, assessment-style spatial activities. Not officially affiliated with test publishers.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-500 hover:text-[#0E2235]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors flex items-center gap-1.5"
                >
                  <span>Provisional Diagnostic Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Starting Level Diagnostic */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl text-xs text-slate-600">
                <strong className="text-[#0E2235]">Provisional Placement:</strong> This 1-minute activity helps calibrate the initial starting difficulty. It is not an IQ test or formal score.
              </div>

              <div>
                <span className="text-xs font-semibold text-[#0E2235] block mb-2">
                  Sample Sequence: Which figure comes next?
                </span>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {diagnosticFrames.map((f, i) => (
                    <div key={i} className="aspect-square bg-[#FAF7F0] border border-[#E8E6E1] rounded-lg p-2 flex items-center justify-center">
                      <FrameCanvas objects={f} />
                    </div>
                  ))}
                  <div className="aspect-square bg-amber-50/50 border border-dashed border-[#C99543] rounded-lg flex items-center justify-center text-[#C99543] font-bold text-lg">
                    ?
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {diagnosticOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDiagnosticAnswer(idx)}
                      className={`p-3 bg-white border rounded-xl flex flex-col items-center justify-center transition-all ${
                        diagnosticAnswer === idx
                          ? 'border-[#0E2235] ring-2 ring-[#0E2235]/15'
                          : 'border-[#E8E6E1] hover:border-slate-300'
                      }`}
                    >
                      <div className="w-16 h-16">
                        <FrameCanvas objects={opt} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 mt-1">
                        Option {String.fromCharCode(65 + idx)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-slate-500 hover:text-[#0E2235]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={diagnosticAnswer === null}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <span>Confirm & Finalize Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Studio Profile Ready */}
          {step === 5 && (
            <div className="space-y-6 text-center py-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ backgroundColor: selectedAvatar.color }}
              >
                {childName.charAt(0)}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-[#0E2235]">
                  {childName}’s Studio Profile is Ready!
                </h3>
                <p className="text-xs text-slate-600">
                  Assigned starting level: Level {diagnosticAnswer === 0 ? 2 : 1} ({learningGoal === 'gifted' ? targetExam : 'Visual Reasoning'} Pathway)
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F0] border border-[#E8E6E1] rounded-xl text-xs text-slate-700 text-left max-w-md mx-auto space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Child:</span>
                  <span className="font-semibold text-[#0E2235]">{childName} ({childGrade})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Focus:</span>
                  <span className="font-semibold text-[#0E2235]">{targetExam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">First Module:</span>
                  <span className="font-semibold text-[#0E2235]">Rotation & Angular Dynamics</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinishOnboarding}
                  className="px-8 py-3.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span>Launch Child Studio Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
