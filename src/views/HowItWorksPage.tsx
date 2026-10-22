import React from 'react';
import { Eye, Compass, Lightbulb, Target, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface HowItWorksPageProps {
  onStartSession: () => void;
  onGoToOnboarding: () => void;
  onReadBlog: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onStartSession,
  onGoToOnboarding,
  onReadBlog,
}) => {
  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-12 px-6 max-w-5xl mx-auto space-y-16">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
          Pedagogical Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#0E2235]">
          The Five Stages of Spatial Discovery
        </h1>
        <p className="text-base text-slate-700 leading-relaxed">
          Standard practice apps present a child with a question and four choices. If they miss it, they are marked wrong. Heir of Wisdom guides the child through the scientific method of visual reasoning.
        </p>
      </div>

      {/* Deep Dive into 5 Stages */}
      <div className="space-y-8">
        {/* Stage 1 */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#0E2235] shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 01 · 2 Minutes</span>
              <span className="text-xs text-[#718C7B] font-semibold">· Attention Priming</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">Observe</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Before guessing, the child inspects the pattern strip. We ask: "What do you notice changing?" This trains children to systematically isolate visual attributes—cardinal direction, color shift, count, or size—rather than becoming overwhelmed by the whole graphic.
            </p>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#C99543] shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 02 · 4 Minutes</span>
              <span className="text-xs text-[#C99543] font-semibold">· Tactile Manipulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">Experiment</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Children physically rotate, reflect, scale, and translate shapes on an interactive canvas. By testing their hands-on intuition without penalty, abstract spatial transformations become tangible, physical concepts in their minds.
            </p>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#2B4C7E] shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 03 · 3 Minutes</span>
              <span className="text-xs text-[#2B4C7E] font-semibold">· Rule Articulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">Discover</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The child articulates the invariant rule governing the transition. If they encounter difficulty, a 3-level progressive hint ladder provides structured attention, relationship clues, or an animated demonstration of the rule in action.
            </p>
          </div>
        </div>

        {/* Stage 4 */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#718C7B] shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 04 · 3 Minutes</span>
              <span className="text-xs text-[#718C7B] font-semibold">· Far-Transfer Test</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">Apply (The Transfer Challenge)</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We present a new challenge with completely different geometric objects (e.g. triangles and crescents instead of arrows). Can the child recognize that the exact same 90° clockwise rotation rule is operating? This proves true conceptual mastery.
            </p>
          </div>
        </div>

        {/* Stage 5 */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E6E1] flex items-center justify-center text-[#C99543] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 05 · 3 Minutes</span>
              <span className="text-xs text-[#C99543] font-semibold">· Metacognitive Consolidation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">Reflect</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The child synthesizes the session by capturing their confidence and writing or choosing a key takeaway. The parent dashboard receives granular data on hint dependency, practice accuracy, and transfer strength.
            </p>
          </div>
        </div>
      </div>

      {/* Learn More: Blog Post on Visual Reasoning Timeline */}
      <div className="bg-[#FAF7F0] border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0E2235]">
          Read More: How Long Before I See Improvement?
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Wondering when you'll see real progress in your child's visual reasoning? Our stage-by-stage guide walks
          through what to expect at each level of the Five Stages of Spatial Discovery — from Observe to Reflect —
          and what evidence looks like on the parent dashboard.
        </p>
        <button
          onClick={() => navigate('/blog/how-long-visual-reasoning-improvement')}
          className="px-8 py-3 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors inline-flex items-center gap-2"
        >
          <span>Read the full guide →</span>
        </button>
      </div>

      {/* Comparison Table: Traditional Drill vs Heir of Wisdom */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-2xl font-serif font-bold text-[#0E2235] text-center">
          Why Heir of Wisdom Outperforms Traditional Drill Books
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-5 bg-rose-50/40 border border-rose-200 rounded-xl space-y-3">
            <h3 className="font-serif font-bold text-base text-rose-950">Traditional Drill Apps & Books</h3>
            <ul className="text-xs text-rose-900/80 space-y-2">
              <li>• Rapid-fire multiple choice tests that encourage quick guessing.</li>
              <li>• Static printed figures offer zero way to experiment with rotation or flip.</li>
              <li>• Tests memory of specific problem graphics instead of abstract rules.</li>
              <li>• Frustrating red marks create anxiety before high-stakes assessments.</li>
            </ul>
          </div>

          <div className="p-5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
            <h3 className="font-serif font-bold text-base text-emerald-950">Heir of Wisdom Cognitive Studio</h3>
            <ul className="text-xs text-emerald-900/80 space-y-2">
              <li>• Interactive SVG manipulation engine where kids test rules physically.</li>
              <li>• Guided 3-tier scaffolding ensures children never feel helpless or judged.</li>
              <li>• Far-transfer challenges prove deep conceptual generalization.</li>
              <li>• Calm, beautiful architectural environment fostering quiet focus.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4 space-y-4">
        <button
          onClick={onStartSession}
          className="px-8 py-3.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <span>Try a 5-Stage Session Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
