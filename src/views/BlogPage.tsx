import React from 'react';

export const BlogPage: React.FC = () => {
  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-12 px-6 max-w-4xl mx-auto">
      <article className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-12 shadow-xs space-y-12">
        <header className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
            Pedagogical Architecture
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#0E2235] tracking-tight leading-[1.15]">
            How Long Before I See Improvement in My Child's Visual Reasoning?
          </h1>
          <p className="text-base text-slate-700 leading-relaxed">
            Parents ask: "Will this help my child for real?" — then immediately ask, "How long?" This guide
            walks through what to expect at each stage of spatial reasoning development, what evidence looks
            like on the parent dashboard, and why improvement is stage-gated, not instant.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            Why Timeline Questions Matter
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            Most "brain training" apps promise instant results — rapid-fire multiple choice, four choices,
            marked wrong if missed. Heir of Wisdom guides the child through the scientific method of visual
            reasoning instead. Improvement isn't a single number: it's recognition → explanation → application
            → transfer. Each stage has visible evidence on the parent dashboard.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            The Five Stages and What Parents See
          </h2>
          <div className="space-y-4">
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 01 · Observe</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0E2235]">Inspect before guessing</h3>
              <p className="text-sm text-slate-600">
                Child notices changing attributes — cardinal direction, color shift, count, or size — before
                attempting to answer. Parent sees sessions started and first transformations attempted.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 02 · Experiment</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0E2235]">Manipulate shapes physically</h3>
              <p className="text-sm text-slate-600">
                Children rotate, reflect, scale, and translate shapes on an interactive canvas. Parent sees
                transformations attempted and hint dependency beginning to drop.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 03 · Discover</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0E2235]">Articulate the rule</h3>
              <p className="text-sm text-slate-600">
                Child articulates the invariant rule governing the transition, with 3-level progressive hint
                support. Parent sees rule articulation and hint levels used.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 04 · Apply</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0E2235]">Transfer to new shapes</h3>
              <p className="text-sm text-slate-600">
                Child recognizes the same rule operating on completely different geometric objects. Parent sees
                transfer success rate — conceptual mastery proven, not pattern memorization.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Stage 05 · Reflect</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0E2235]">Consolidate learning</h3>
              <p className="text-sm text-slate-600">
                Child captures confidence and writes or chooses a key takeaway. Parent sees confidence ratings
                and suggested next steps.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            What Evidence Looks Like on the Dashboard
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            Standard test prep confuses practice question recall with true cognitive mastery. Heir of Wisdom
            evaluates how a child generalizes abstract principles to brand new geometric contexts. The parent
            dashboard shows:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2">
            <li><strong>Hint dependency:</strong> fewer hints over time means the child is internalizing rules, not memorizing answers.</li>
            <li><strong>Practice accuracy:</strong> not about speed, but about correct rule application on unfamiliar shapes.</li>
            <li><strong>Transfer strength:</strong> solving new object types with the same rule proves conceptual mastery.</li>
            <li><strong>Confidence:</strong> child's self-reported confidence per session.</li>
          </ul>
          <p className="text-sm text-slate-600 italic">
            Example metrics are illustrative, not guarantees. Every child progresses differently.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <h4 className="text-lg font-serif font-bold text-[#0E2235]">Is Heir of Wisdom test preparation?</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                CogAT, OLSAT, and NNAT preparation are entry points and milestones, not the entire product.
                Heir of Wisdom is a child's personal reasoning environment.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <h4 className="text-lg font-serif font-bold text-[#0E2235]">Will my child get an IQ score?</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                No. Heir of Wisdom does not issue IQ-like scores, percentiles, or comparisons to other children.
                Progress is shown through evidence-based capability stages only.
              </p>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-6 border border-[#E8E6E1]">
              <h4 className="text-lg font-serif font-bold text-[#0E2235]">Can I try before paying?</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Start with a free parent onboarding session to explore the studio and see how your child reasons.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center pt-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0E2235]">
            Start Your Child's Free Session
          </h2>
          <p className="text-base text-slate-700 leading-relaxed max-w-xl mx-auto">
            Improvements are visible, evidence-based, and stage-gated — not instant. See how your child reasons.
          </p>
          <button
            className="px-8 py-3.5 text-sm font-semibold text-white bg-[#0E2235] rounded-xl hover:bg-[#1a3852] transition-colors shadow-sm inline-flex items-center gap-2"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/parent/onboarding';
              }
            }}
          >
            <span>Start Free Parent Onboarding</span>
            <span>→</span>
          </button>
        </section>
      </article>
    </div>
  );
};
