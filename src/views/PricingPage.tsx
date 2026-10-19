import React, { useState } from 'react';
import { Check, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';

interface PricingPageProps {
  onSelectPlan: (plan: string) => void;
  onGoToOnboarding: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, onGoToOnboarding }) => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Studio',
      description: 'Ideal for focused independent reasoning practice.',
      price: billingCycle === 'annual' ? 19 : 24,
      period: 'per month',
      features: [
        '1 Child Profile',
        'Access to all 4 foundational modules',
        'Interactive SVG Reasoning Canvas',
        'Independent transfer tracking',
        'Weekly parent progress reports',
      ],
      isPopular: false,
    },
    {
      id: 'scholar',
      name: 'Scholar Family',
      description: 'Our most comprehensive studio for gifted preparation and spatial growth.',
      price: billingCycle === 'annual' ? 29 : 38,
      period: 'per month',
      features: [
        'Up to 3 Child Profiles',
        'Complete curriculum: Rotation, Reflection, Progression, Attributes',
        'CogAT / OLSAT / NNAT alignment frameworks',
        'Full Rule Labs open-ended experimentation',
        'Granular parent analytics (Transfer vs Practice)',
        '3-tier adaptive hint engine',
      ],
      isPopular: true,
    },
    {
      id: 'academy',
      name: 'Academy Master',
      description: 'For families seeking deep cognitive enrichment and mentorship.',
      price: billingCycle === 'annual' ? 49 : 59,
      period: 'per month',
      features: [
        'Unlimited Child Profiles',
        'All Scholar Family features',
        'Quarterly 1-on-1 cognitive progress consultation',
        'Printable reasoning discovery journals',
        'Early access to new advanced reasoning labs',
      ],
      isPopular: false,
    },
  ];

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-16 px-6 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#718C7B] font-mono">
          Tuition & Studio Access
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#0E2235]">
          Invest in how your child thinks.
        </h1>
        <p className="text-base text-slate-700 leading-relaxed">
          No manipulative streaks or candy gems. Just thoughtful, deep spatial reasoning designed to build lifelong confidence.
        </p>

        {/* Billing Switcher (functional segmented control) */}
        <div className="flex items-center justify-center pt-4">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E8E6E1] rounded-xl shadow-xs">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'annual'
                  ? 'bg-[#0E2235] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0E2235]'
              }`}
            >
              Annual Billing · Save 25%
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#0E2235] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0E2235]'
              }`}
            >
              Monthly Billing
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col bg-white rounded-2xl border p-8 transition-all ${
              plan.isPopular
                ? 'border-[#0E2235] ring-2 ring-[#0E2235]/15 shadow-md'
                : 'border-[#E8E6E1] shadow-xs hover:border-slate-300'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white bg-[#0E2235] rounded-full">
                Recommended by Educators
              </span>
            )}

            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-serif font-bold text-[#0E2235]">{plan.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-[#E8E6E1]">
              <span className="text-4xl font-serif font-bold text-[#0E2235] tabular-nums">
                ${plan.price}
              </span>
              <span className="text-xs text-slate-500 font-medium">/{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-normal">
                  <Check className="w-4 h-4 text-[#718C7B] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                onSelectPlan(plan.id);
                onGoToOnboarding();
              }}
              className={`w-full py-3 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
                plan.isPopular
                  ? 'bg-[#0E2235] text-white hover:bg-[#1a3852]'
                  : 'bg-[#FAF7F0] text-[#0E2235] border border-[#E8E6E1] hover:bg-white'
              }`}
            >
              Select {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Reassurance Guarantee */}
      <div className="p-6 bg-white border border-[#E8E6E1] rounded-2xl max-w-2xl mx-auto flex items-center gap-4 shadow-xs">
        <ShieldCheck className="w-10 h-10 text-[#718C7B] shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-[#0E2235] block text-sm mb-0.5 font-serif">14-Day Full Satisfaction Guarantee</strong>
          If you or your child do not feel a noticeable increase in pattern confidence and spatial joy within two weeks, simply email us for a complete refund.
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <h2 className="text-2xl font-serif font-bold text-[#0E2235] text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="p-5 bg-white border border-[#E8E6E1] rounded-xl space-y-1">
            <h4 className="text-sm font-semibold text-[#0E2235]">
              Is Heir of Wisdom officially affiliated with CogAT, OLSAT, or NNAT?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. Heir of Wisdom is an independent visual reasoning studio. We develop original, assessment-style spatial reasoning tasks inspired by the cognitive frameworks evaluated on these tests, without copying or publishing trademarked exam material.
            </p>
          </div>

          <div className="p-5 bg-white border border-[#E8E6E1] rounded-xl space-y-1">
            <h4 className="text-sm font-semibold text-[#0E2235]">
              Does my child need an email address?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. Parents manage the account and authentication. Children enter their studio securely through an authorized child profile link without requiring an email address or personal credentials.
            </p>
          </div>

          <div className="p-5 bg-white border border-[#E8E6E1] rounded-xl space-y-1">
            <h4 className="text-sm font-semibold text-[#0E2235]">
              How long should my child spend on Heir of Wisdom each day?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We recommend one to two 15-minute studio sessions per day, 3 to 4 days per week. Consistent short sessions with high conceptual focus build deep neural pathways far more effectively than marathon cramming sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
