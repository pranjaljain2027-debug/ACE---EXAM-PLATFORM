import React, { useState } from 'react';
import { ArrowRight, Eye, FlaskConical, Lightbulb, Target, Sparkles, Check, X as XIcon, ShieldCheck, LineChart, Hand } from 'lucide-react';
import heroImage from '../../assets/images/studio_architectural_library_1792345109892.jpg';
import { Link, navigate } from '../../app/router';
import { ShapeLab } from '../../components/lab/ShapeLab';
import type { VisualObject } from '../../types/reasoning';
import { AFFILIATION_NOTE, GOALS } from '../../content/coverage';
import { PRICING, SUPPORT_EMAIL } from '../../config';
import { Button, Card, Eyebrow, Notice } from '../../ui/kit';

const demoStart: VisualObject[] = [{ id: 'hero-flag', shape: 'flag', x: 50, y: 50, rotation: 0, scale: 1.1, color: '#233D5B', reflectedX: false, reflectedY: false, zIndex: 1 }];
const demoGoal: VisualObject[] = [{ id: 'hero-goal', shape: 'flag', x: 50, y: 50, rotation: 90, scale: 1.1, color: '#233D5B', reflectedX: false, reflectedY: false, zIndex: 1 }];

const STAGES = [
  { icon: Eye, name: 'Observe', text: 'Spot what changes from picture to picture before guessing.' },
  { icon: FlaskConical, name: 'Experiment', text: 'Turn, flip, recolour and move real shapes. Undo freely.' },
  { icon: Lightbulb, name: 'Discover', text: 'Name the rule. Hints come in three small steps, only if needed.' },
  { icon: Target, name: 'Apply', text: 'Solve a brand-new puzzle with the same rule. First try is on their own.' },
  { icon: Sparkles, name: 'Reflect', text: 'Say the rule in their own words. Stopping early is never penalised.' },
];

export const Landing: React.FC = () => {
  const [solved, setSolved] = useState(false);
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <Eyebrow>Visual reasoning studio · ages 8–10</Eyebrow>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold leading-[1.1] text-balance">Teach your child to see what others miss.</h1>
          <p className="text-lg text-ink max-w-xl">See the pattern. Discover the rule. Children turn and flip real shapes until the rule clicks, then prove it on a puzzle they have never seen.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/signup')}>Create a free parent account <ArrowRight className="w-5 h-5" aria-hidden /></Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/demo')}>Try a lesson, no sign-up</Button>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            {['Original puzzles only', 'No ads, no leaderboards', 'Progress parents can trust'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-forest" aria-hidden /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5 space-y-2">
          <ShapeLab title={solved ? 'Solved. Try another move?' : 'Try it: make it match the goal'} initial={demoStart} target={demoGoal} allowedActions={['rotate-90-cw', 'rotate-90-ccw', 'reflect-x']} onMatchChange={setSolved} />
          <p className="text-xs text-muted text-center">This demo runs in your browser. Nothing is saved or collected.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative rounded-3xl overflow-hidden border border-line aspect-[16/8] sm:aspect-[16/6]">
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/40 to-transparent flex items-end p-6 sm:p-12">
            <div className="max-w-2xl text-white space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-white">The answer is only the beginning.</h2>
              <p className="text-sm sm:text-base text-white/85">Most practice books drill multiple choice until children guess right. Here children build the rule with their hands, then use it somewhere new.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper border-y border-line py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>Every lesson, five steps</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold">About 15 minutes from noticing to knowing</h2>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.name} className="rounded-2xl bg-ivory border border-line p-5 space-y-2">
                  <Icon className="w-6 h-6 text-ochre" aria-hidden />
                  <p className="text-xs font-semibold text-muted">Step {i + 1}</p>
                  <h3 className="text-lg font-serif font-semibold">{s.name}</h3>
                  <p className="text-sm text-ink">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2"><Hand className="w-6 h-6 text-forest" aria-hidden /><h3 className="text-lg font-serif font-semibold">Hands-on, not drill</h3><p className="text-sm text-ink">A real shape lab with undo, replay and feedback that explains why a move worked.</p></Card>
        <Card className="p-6 space-y-2"><LineChart className="w-6 h-6 text-forest" aria-hidden /><h3 className="text-lg font-serif font-semibold">Evidence, not vanity metrics</h3><p className="text-sm text-ink">Parents see which rules their child applies on brand-new problems without help, and how much evidence each claim rests on.</p></Card>
        <Card className="p-6 space-y-2"><ShieldCheck className="w-6 h-6 text-forest" aria-hidden /><h3 className="text-lg font-serif font-semibold">Built for children</h3><p className="text-sm text-ink">Parent-owned accounts, a PIN-locked Studio, minimal data, and deletion whenever you ask.</p></Card>
      </section>

      <section className="bg-paper border-y border-line py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>What we cover today</Eyebrow>
            <h2 className="text-3xl font-serif font-semibold">Honest about test prep</h2>
            <p className="text-sm text-ink">Our lessons build the visual and nonverbal reasoning behind parts of CogAT, OLSAT and NNAT. They do not cover everything on those tests.</p>
          </div>
          <Link to="/curriculum" className="inline-flex items-center gap-1 font-semibold text-navy underline">See exactly what is and is not covered <ArrowRight className="w-4 h-4" aria-hidden /></Link>
          <p className="text-xs text-muted">{AFFILIATION_NOTE}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-serif font-semibold">Start with a 10-minute Discovery Quest</h2>
        <p className="text-base text-ink max-w-xl mx-auto">Untimed shape puzzles that set a provisional starting point. Free during early access.</p>
        <Button size="lg" onClick={() => navigate('/signup')}>Create a free parent account</Button>
      </section>
    </div>
  );
};

export const HowItWorks: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
    <div className="space-y-3 max-w-2xl">
      <Eyebrow>How it works</Eyebrow>
      <h1 className="text-4xl font-serif font-semibold">From noticing to doing it alone</h1>
      <p className="text-base text-ink">Each lesson follows the same five steps. The goal is not getting one answer right. It is using a rule on a problem the child has never seen.</p>
    </div>
    <ol className="space-y-4">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        return (
          <li key={s.name}>
            <Card className="p-6 flex gap-4">
              <span className="w-12 h-12 rounded-xl bg-ivory border border-line flex items-center justify-center shrink-0"><Icon className="w-6 h-6 text-ochre" aria-hidden /></span>
              <div>
                <h2 className="text-xl font-serif font-semibold">{i + 1}. {s.name}</h2>
                <p className="text-sm text-ink mt-1">{s.text}</p>
              </div>
            </Card>
          </li>
        );
      })}
    </ol>
    <Card className="p-6 space-y-3">
      <h2 className="text-xl font-serif font-semibold">What counts as progress</h2>
      <ul className="text-sm text-ink space-y-2 list-disc pl-5">
        <li><strong>Independent transfer:</strong> a new problem solved on the first try with no hints. This is the main signal.</li>
        <li><strong>Assisted:</strong> solved after a hint or a retry. Valuable, but tracked separately.</li>
        <li><strong>Practice:</strong> test-style puzzles, timed or untimed, reviewed after submission.</li>
        <li>We need several pieces of evidence before describing a skill. We never estimate IQ or test scores.</li>
      </ul>
    </Card>
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => navigate('/demo')}>Try a lesson</Button>
      <Button variant="secondary" onClick={() => navigate('/signup')}>Create a parent account</Button>
    </div>
  </div>
);

export const Curriculum: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <div className="space-y-3 max-w-2xl">
      <Eyebrow>Curriculum and coverage</Eyebrow>
      <h1 className="text-4xl font-serif font-semibold">What we teach, and what we do not</h1>
      <p className="text-base text-ink">Four skill families today: turning, mirrors, patterns that grow, and colour and multi-rule changes. 13 guided lessons, a 10-puzzle Discovery Quest and 31 original practice puzzles.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {GOALS.map((g) => (
        <Card key={g.id} className="p-6 space-y-3">
          <h2 className="text-xl font-serif font-semibold">{g.title}</h2>
          <ul className="text-sm space-y-1.5">
            {g.covers.map((c) => <li key={c} className="flex gap-2"><Check className="w-4 h-4 text-forest mt-0.5 shrink-0" aria-hidden /> {c}</li>)}
            {g.notCovered.map((c) => <li key={c} className="flex gap-2 text-muted"><XIcon className="w-4 h-4 text-brick mt-0.5 shrink-0" aria-hidden /> Not covered: {c}</li>)}
          </ul>
        </Card>
      ))}
    </div>
    <Notice>{AFFILIATION_NOTE}</Notice>
  </div>
);

export const Pricing: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <div className="space-y-3 text-center">
      <Eyebrow>Pricing</Eyebrow>
      <h1 className="text-4xl font-serif font-semibold">Free during early access</h1>
      <p className="text-base text-ink max-w-xl mx-auto">Every current lesson and practice set is free while we test with families. A monthly family plan will open later. You will never be charged without choosing it.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-7 space-y-4">
        <h2 className="text-2xl font-serif font-semibold">Free</h2>
        <p className="text-4xl font-serif font-semibold text-navy">$0</p>
        <ul className="text-sm space-y-2">{['Discovery Quest', 'All current lessons and practice', 'Parent dashboard and skill report', 'Up to 6 children'].map((x) => <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-forest mt-0.5" aria-hidden /> {x}</li>)}</ul>
        <Button className="w-full" onClick={() => navigate('/signup')}>Start free</Button>
      </Card>
      <Card className="p-7 space-y-4">
        <h2 className="text-2xl font-serif font-semibold">Family <span className="text-xs align-middle font-sans font-semibold rounded-full bg-mist px-2 py-0.5 text-navy">Coming soon</span></h2>
        <p className="text-4xl font-serif font-semibold text-navy">${PRICING.familyMonthly}<span className="text-base text-muted"> / month</span></p>
        <ul className="text-sm space-y-2">{['New lessons as they are published', 'Billed monthly, cancel any time', 'Access to the end of the paid month after cancelling'].map((x) => <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-forest mt-0.5" aria-hidden /> {x}</li>)}</ul>
        <Button className="w-full" variant="secondary" disabled>Not open yet</Button>
      </Card>
    </div>
    <p className="text-xs text-muted text-center">Prices in USD. Purchases happen only in the parent area, never in the child Studio.</p>
  </div>
);

const FAQS: [string, string][] = [
  ['Is this test prep?', 'Partly. Lessons build the nonverbal reasoning that parts of CogAT, OLSAT and NNAT measure, and the Practice Arena uses original test-style puzzles. We do not cover verbal or quantitative sections, and we cannot promise scores or admission.'],
  ['Will my child get an IQ score or percentile?', 'No. We show what your child can do on new problems, with or without help, and how much evidence that rests on. We never estimate IQ, percentiles or test results.'],
  ['What is the Discovery Quest?', 'About 10 untimed shape puzzles with no hints and no feedback. It gives a provisional starting point for choosing lessons. It is not a test score.'],
  ['How long are sessions?', 'Lessons take about 15 minutes. You can choose 10, 15 or 20 minute routines. Stopping early is never penalised.'],
  ['What data do you collect about my child?', 'A nickname, age, grade, avatar and learning activity. No full name, birthday, photo, voice or location. No ads and no selling of data. You can delete everything at any time.'],
  ['Can my child use it alone?', 'Yes, inside the Studio. It is locked with your parent PIN, so reports, settings and billing stay with you.'],
  ['Does it work on tablets?', 'Yes. Every shape tool works with touch, mouse and keyboard.'],
];

export const Faq: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <Eyebrow>Questions</Eyebrow>
    <h1 className="text-4xl font-serif font-semibold">Frequently asked</h1>
    <div className="space-y-3">
      {FAQS.map(([q, a]) => (
        <details key={q} className="group rounded-2xl border border-line bg-paper p-5">
          <summary className="font-serif text-lg font-semibold text-navy list-none flex justify-between gap-4">{q}<span className="text-ochre group-open:rotate-45 transition-transform" aria-hidden>+</span></summary>
          <p className="text-sm text-ink mt-3">{a}</p>
        </details>
      ))}
    </div>
  </div>
);

const DraftBanner = () => <Notice tone="mock">Draft for legal review. This document has not yet been reviewed by counsel and may change before public launch.</Notice>;

export const Privacy: React.FC = () => (
  <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-ink leading-relaxed">
    <h1 className="text-4xl font-serif font-semibold">Privacy policy</h1>
    <DraftBanner />
    <p>Version 2026-10-24. Heir of Wisdom is built for children aged 8–10, used under a parent’s account. This page explains what we collect and the choices you have.</p>
    <h2 className="text-xl font-serif font-semibold">From parents</h2>
    <p>Email address, password (stored only as a secure hash by our authentication provider), first name if you give it, consent records, parent PIN (stored only as a hash), and billing status. Card details are handled by a hosted payment provider and never reach our servers.</p>
    <h2 id="children" className="text-xl font-serif font-semibold scroll-mt-24">Children’s privacy notice</h2>
    <p>With a parent’s consent we collect a child’s nickname, age, grade, avatar choice and learning activity: answers, hints used, shape-tool actions (action type only), timing, session progress and optional short reflections the child types. We do not ask for a child’s full name, birthday, photo, voice, contact details or location, and children never create accounts or enter email addresses.</p>
    <p>We use this information only to run the Studio, choose the next activity and show progress to the parent. We do not use it for advertising, we do not sell or rent it, and we do not share it with third parties except service providers that host our app and database under contract and only on our instructions. There is no chat between children and no public profile.</p>
    <p>Parents can review their child’s information in the parent dashboard, edit the profile, and delete a child’s data or the whole account at any time in Settings. Deletion removes the records immediately; we keep a minimal audit entry that a deletion happened, without the child’s details. To request a copy of your data, email {SUPPORT_EMAIL}.</p>
    <h2 className="text-xl font-serif font-semibold">Security</h2>
    <p>Data is encrypted in transit and at rest by our hosting providers. Each parent can only reach their own children’s records, enforced on the server. Sensitive actions require the parent PIN or a fresh sign-in, and key actions are logged.</p>
    <h2 className="text-xl font-serif font-semibold">Cookies and analytics</h2>
    <p>We use only the storage needed to keep you signed in and remember Studio preferences. We do not run third-party advertising. On public marketing pages only (home, how it works, curriculum, pricing, FAQ), and only for visitors who are not signed in, we use Microsoft Clarity to understand how the site is used. It is never loaded in the child Studio, the demo, sign-up or the parent area, and it is skipped if your browser sends Do Not Track.</p>
    <h2 className="text-xl font-serif font-semibold">Contact</h2>
    <p>{SUPPORT_EMAIL}</p>
  </article>
);

export const Terms: React.FC = () => (
  <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5 text-sm text-ink leading-relaxed">
    <h1 className="text-4xl font-serif font-semibold">Terms of use</h1>
    <DraftBanner />
    <p>Version 2026-10-24. Accounts are for parents and legal guardians aged 18 or over. You are responsible for your account, your parent PIN and how your child uses the Studio.</p>
    <p>Heir of Wisdom is an educational practice tool. It does not provide psychological assessment and does not predict test scores, percentiles, IQ or admission decisions. It is independent and not affiliated with any test publisher.</p>
    <p>Paid plans, when available, renew monthly until cancelled. Cancelling stops future charges and access continues until the end of the paid period.</p>
    <p>All lessons, puzzles and images are original to Heir of Wisdom or properly licensed. Please do not copy or resell them.</p>
    <p>We may update these terms. We will tell you about material changes before they apply. Questions: {SUPPORT_EMAIL}.</p>
  </article>
);

export const NotFound: React.FC = () => (
  <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
    <h1 className="text-3xl font-serif font-semibold">Page not found</h1>
    <Button onClick={() => navigate('/')}>Go home</Button>
  </div>
);
