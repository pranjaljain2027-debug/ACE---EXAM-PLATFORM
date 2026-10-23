import React, { useState } from 'react';
import { ArrowRight, Cube, Compass, Eye, Lightbulb, Target, Sparkles, CheckCircle2, Shield, Brain } from 'lucide-react';
import { ReasoningCanvas } from '../components/canvas/ReasoningCanvas';
import { VisualObject } from '../types/reasoning';

interface LandingPageProps {
  onStartLearning: () => void;
  onExploreCurriculum: () => void;
  onViewPricing: () => void;
  onGoToOnboarding: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onExploreCurriculum,
  onViewPricing,
  onGoToOnboarding,
}) => {
  // Sample interactive teaser widget for the hero
  const teaserInitial: VisualObject[] = [
    { id: 't-hero-1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.1, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
  ];
  const teaserTarget: VisualObject[] = [
    { id: 't-hero-target', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.1, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
  ];
  const [teaserSolved, setTeaserSolved] = useState(false);

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left: Editorial Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#718C7B] font-mono">
              <span>Interactive Visual Reasoning Studio</span>
              <span aria-hidden="true">·</span>
              <span>Ages 8–12</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#0E2235] tracking-tight leading-[1.15] text-balance">
              Teach your child to see what others miss.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-medium mt-2 max-w-xl">
              Teach your child to see what others miss.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onGoToOnboarding}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Begin Learning Assessment</span>
                <Cube className="w-4 h-4" />
              </button>
              <button
                onClick={onStartLearning}
                className="px-6 py-3.5 text-sm font-semibold text-[#0E2235] bg-white border border-[#E8E6E1] rounded-xl hover:bg-[#FAF7F0] transition-colors"
              >
                Open Studio Demo
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#718C7B]" />
                <span>Original reasoning tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#718C7B]" />
                <span>Zero gamified distraction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#718C7B]" />
                <span>Independent transfer tracking</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Tactile Studio Teaser Canvas */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#0E2235] font-serif">
                  Try the Studio Interaction
                </span>
                <span className="text-[11px] text-[#718C7B] font-mono">
                  {teaserSolved ? '✓ Rule Applied!' : 'Turn 90° Right'}
                </span>
              </div>

              <ReasoningCanvas
                initialObjects={teaserInitial}
                targetObjects={teaserTarget}
                allowedActions={['rotate-90-cw', 'rotate-90-ccw']}
                onValidate={(match) => setTeaserSolved(match)}
              />

              <p className="mt-3 text-xs text-slate-500 text-center">
                Children test hypotheses directly on the canvas without negative marking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Studio Visual Banner */}
      <section className="px-6 max-w-7xl mx-auto pb-16">
        <div className="relative rounded-3xl overflow-hidden border border-[#E8E6E1] shadow-xs aspect-[16/7]">
          <img
            src="/src/assets/images/studio_architectural_library_1792345109892.jpg"
            alt="Heir of Wisdom Architectural Studio Interior"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E2235]/90 via-[#0E2235]/35 to-transparent flex items-end p-8 sm:p-12">
            <div className="max-w-2xl text-white space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#E6DCCE] font-mono">
                The Learning Sanctuary
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                The answer is only the beginning.
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                Conventional prep tests give children multiple-choice grids and drill them until they guess correctly. Heir of Wisdom asks children to observe, construct, test, and explain the hidden structure of geometry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Stage Pedagogical Engine */}
      <section className="py-20 px-6 bg-white border-y border-[#E8E6E1]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
              The Pedagogical Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0E2235]">
              How True Visual Reasoning is Discovered
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every 15-minute studio session advances through five research-backed cognitive phases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-6 bg-[#FAF7F0] rounded-2xl border border-[#E8E6E1] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#0E2235]">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 block">Stage 01</span>
              <h3 className="font-serif font-bold text-[#0E2235] text-lg">Observe</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Notice changing attributes—direction, color, scale, or position—before attempting to answer.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F0] rounded-2xl border border-[#E8E6E1] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#C99543]">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 block">Stage 02</span>
              <h3 className="font-serif font-bold text-[#0E2235] text-lg">Experiment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manipulate shapes physically on the SVG canvas with rotation, reflection, and scaling tools.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F0] rounded-2xl border border-[#E8E6E1] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#2B4C7E]">
                <Lightbulb className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 block">Stage 03</span>
              <h3 className="font-serif font-bold text-[#0E2235] text-lg">Discover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Articulate the invariant rule with 3-tiered hints and live geometric animation.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F0] rounded-2xl border border-[#E8E6E1] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#718C7B]">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 block">Stage 04</span>
              <h3 className="font-serif font-bold text-[#0E2235] text-lg">Apply (Transfer)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Solve an unfamiliar problem using the same rule with brand new visual shapes independently.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F0] rounded-2xl border border-[#E8E6E1] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#C99543]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 block">Stage 05</span>
              <h3 className="font-serif font-bold text-[#0E2235] text-lg">Reflect</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consolidate learnings, celebrate experimentation, and recommend adaptive skill paths.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Curriculum Domains */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
              Structured Reasoning Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0E2235]">
              Four Core Spatial Skill Families
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Designed to build the cognitive foundations evaluated in CogAT Non-Verbal, OLSAT Figural, and NNAT spatial matrices.
            </p>
          </div>
          <button
            onClick={onExploreCurriculum}
            className="text-xs font-semibold text-[#0E2235] hover:text-[#C99543] transition-colors flex items-center gap-1"
          >
            <span>Explore all modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#0E2235] font-serif font-bold text-sm">
              01
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0E2235]">Rotation Dynamics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clockwise and counterclockwise quarter turns (90°), half turns (180°), and 45° diagonal progressions.
            </p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#718C7B] font-serif font-bold text-sm">
              02
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0E2235]">Reflection & Symmetry</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bilateral horizontal mirrors, water reflections, and discerning reflection from rotation.
            </p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#C99543] font-serif font-bold text-sm">
              03
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0E2235]">Visual Progression</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Additive count progressions (+1/-1), concentric scale ladders, perimeter orbits, and matrix rows.
            </p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#2B4C7E] font-serif font-bold text-sm">
              04
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0E2235]">Attribute Conjunctions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Two-variable simultaneous rules, cyclic color sequences, and cognitive filtering of irrelevant distractors.
            </p>
          </div>
        </div>
      </section>

      {/* Claim to Proof Adjacency: Parent & Educator Testimonials */}
      <section className="py-20 px-6 bg-[#FAF7F0] border-t border-[#E8E6E1]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
              Evidence & Trust
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#0E2235]">
              Built for Understanding, Not Memorization
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-4 shadow-xs">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "Our 9-year-old was getting frustrated by rote CogAT practice workbooks. Heir of Wisdom gave him a way to actually play with the shapes and see why 180° inversion isn\'t just a random trick."
              </p>
              <div className="pt-2 border-t border-[#E8E6E1]">
                <span className="text-xs font-semibold text-[#0E2235] block">Elena Vasquez</span>
                <span className="text-[11px] text-slate-500">Parent of 4th Grader · Austin, TX</span>
              </div>
            </div>

            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-4 shadow-xs">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The distinction between practice accuracy and independent transfer is revolutionary. As a teacher, that is the single indicator of whether a child understands the concept."
              </p>
              <div className="pt-2 border-t border-[#E8E6E1]">
                <span className="text-xs font-semibold text-[#0E2235] block">Marcus Thorne, M.Ed.</span>
                <span className="text-[11px] text-slate-500">Gifted Learning Specialist · Fairfax, VA</span>
              </div>
            </div>

            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 space-y-4 shadow-xs">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The calm, warm aesthetic makes my daughter look forward to her 15-minute studio session. It feels like an architectural drafting table rather than an overstimulating arcade."
              </p>
              <div className="pt-2 border-t border-[#E8E6E1]">
                <span className="text-xs font-semibold text-[#0E2235] block">Dr. Rachel Sterling</span>
                <span className="text-[11px] text-slate-500">Parent of 5th Grader · Seattle, WA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0E2235]">
          Give your child the confidence to discover patterns.
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Start with a short introductory reasoning session to establish your child’s provisional starting level.
        </p>
        <div className="pt-2">
          <button
            onClick={onGoToOnboarding}
            className="px-8 py-4 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Start Free Parent Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
