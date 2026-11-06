import React, { useCallback, useMemo, useState } from 'react';
import { Compass, Home, Map as MapIcon, Swords, BookOpen, Lock, CheckCircle2, Circle, Star, PlayCircle, RotateCcw, LogOut, Route } from 'lucide-react';
import { match, navigate, usePath, Link } from '../../app/router';
import { useApp } from '../../app/AppContext';
import type { LearningBackend, StudioState } from '../../services/types';
import { remoteBackend } from '../../services/remote';
import { demoBackend, DEMO_CHILD_ID, DEMO_PRACTICE } from '../../services/demo';
import { buildLearningMap, pickMission, type MapState } from '../../engine/learningMap';
import { DOMAIN_TITLES } from '../../content/lessonsMeta';
import { Avatar, Button, Card, ErrorState, Notice, Spinner, useAsync } from '../../ui/kit';
import { Modal, PinPad } from '../../components/ParentGate';
import { LessonRunner } from './LessonRunner';
import { ItemSession } from './ItemSession';
import { QuestionRunner } from './QuestionRunner';
import { PathsHome, PathView, TopicView } from './PathViews';
import { friendlyError } from '../../lib/supabase';

/** The child Studio. Mounted at /studio (signed in, child mode) or /demo (no account, nothing saved). */
export const StudioApp: React.FC<{ demo?: boolean }> = ({ demo = false }) => {
  const { path, search } = usePath();
  const app = useApp();
  const base = demo ? '/demo' : '/studio';
  const backend: LearningBackend = demo ? demoBackend : remoteBackend;
  const childId = demo ? DEMO_CHILD_ID : app.activeChild?.id ?? null;
  const [gateOpen, setGateOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const data = useAsync(async () => {
    if (!childId) return null;
    const [state, catalog] = await Promise.all([backend.studioState(childId), backend.catalog()]);
    return { state, catalog };
  }, [childId, backend, nonce, path === base]);

  const reduced = Boolean(data.data?.state.schedule?.reduced_motion);
  const sub = path.slice(base.length) || '/';
  const exitTo = useCallback(() => { setNonce((n) => n + 1); navigate(base); }, [base]);
  const onGrownUps = demo ? () => navigate('/') : () => setGateOpen(true);

  if (!demo && !childId) return <Spinner label="Opening the Studio" />;
  const lessonMatch = match('/lesson/:id', sub);

  if (lessonMatch && childId) {
    return (
      <StudioFrame demo={demo} base={base} onGrownUps={onGrownUps} focus>
        <LessonRunner key={lessonMatch.id} backend={backend} childId={childId} activityId={lessonMatch.id} reducedMotion={reduced}
          onExit={exitTo} onNext={(id) => (id ? openActivity(id) : exitTo())} />
        <GrownUpGate open={gateOpen} onClose={() => setGateOpen(false)} demo={demo} />
      </StudioFrame>
    );
  }

  function openActivity(id: string) {
    const cat = data.data?.catalog;
    if (!cat || cat.lessons.some((l) => l.meta.id === id)) navigate(`${base}/lesson/${id}`);
    else {
      const skill = cat.items.find((i) => i.meta.id === id)?.meta.skill_id;
      backend.practiceItemsForSkill(skill ?? '').then((ids) => navigate(`${base}/practice/run?items=${(ids.length ? ids : [id]).slice(0, 6).join(',')}`));
    }
  }

  const qMatch = match('/q/:id', sub);
  if (qMatch && childId && !demo) {
    const transfer = search.get('transfer');
    return (
      <StudioFrame demo={demo} base={base} onGrownUps={onGrownUps} focus>
        <QuestionRunner key={`${qMatch.id}:${transfer ?? ''}`} childId={childId} questionId={qMatch.id} transferOf={transfer} reducedMotion={reduced}
          onExit={() => window.history.length > 1 ? window.history.back() : navigate(`${base}/paths`)}
          onTransfer={(id, from) => navigate(`${base}/q/${id}?transfer=${from}`)} />
        <GrownUpGate open={gateOpen} onClose={() => setGateOpen(false)} demo={demo} />
      </StudioFrame>
    );
  }
  const pathMatch = match('/paths/:id', sub);
  const topicMatch = match('/topic/:id', sub);

  if (sub === '/quest' && childId) {
    return (
      <StudioFrame demo={demo} base={base} onGrownUps={onGrownUps} focus>
        <ItemSession backend={backend} childId={childId} mode="baseline" onExit={exitTo} />
        <GrownUpGate open={gateOpen} onClose={() => setGateOpen(false)} demo={demo} />
      </StudioFrame>
    );
  }

  if (sub === '/practice/run' && childId) {
    const items = (search.get('items') ?? '').split(',').filter(Boolean);
    return (
      <StudioFrame demo={demo} base={base} onGrownUps={onGrownUps} focus>
        <ItemSession key={search.toString()} backend={backend} childId={childId} mode="practice" itemIds={items} timed={search.get('timed') === '1'} onExit={exitTo} />
        <GrownUpGate open={gateOpen} onClose={() => setGateOpen(false)} demo={demo} />
      </StudioFrame>
    );
  }

  return (
    <StudioFrame demo={demo} base={base} onGrownUps={onGrownUps} child={data.data?.state.child}>
      {data.error ? <ErrorState message={friendlyError(new Error(data.error))} onRetry={data.reload} />
        : !data.data ? <Spinner label="Opening the Studio" />
        : !demo && sub === '/paths' ? <PathsHome base={base} />
        : !demo && pathMatch ? <PathView base={base} pathId={pathMatch.id} />
        : !demo && topicMatch && childId ? <TopicView base={base} topicId={topicMatch.id} childId={childId} />
        : sub === '/map' ? <LearningMapView base={base} state={data.data.state} catalog={data.data.catalog} />
        : sub === '/practice' ? <PracticeSetup base={base} state={data.data.state} catalog={data.data.catalog} demo={demo} />
        : sub === '/discoveries' ? <Discoveries state={data.data.state} catalog={data.data.catalog} />
        : <StudioHome base={base} state={data.data.state} catalog={data.data.catalog} demo={demo} onOpen={openActivity} />}
      <GrownUpGate open={gateOpen} onClose={() => setGateOpen(false)} demo={demo} />
    </StudioFrame>
  );
};

type Catalog = Awaited<ReturnType<LearningBackend['catalog']>>;

const StudioFrame: React.FC<{ demo: boolean; base: string; onGrownUps: () => void; child?: StudioState['child']; focus?: boolean; children: React.ReactNode }> = ({ demo, base, onGrownUps, child, focus, children }) => {
  const { path } = usePath();
  const tabs = [
    { to: base, label: 'Home', icon: Home },
    { to: `${base}/map`, label: 'Map', icon: MapIcon },
    ...(demo ? [] : [{ to: `${base}/paths`, label: 'Paths', icon: Route }]),
    { to: `${base}/practice`, label: 'Practice', icon: Swords },
    { to: `${base}/discoveries`, label: 'Discoveries', icon: BookOpen },
  ];
  return (
    <div className="min-h-screen bg-ivory studio">
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {child && <Avatar avatar={child.avatar} color={child.avatar_color} size={40} label={`${child.nickname}'s avatar`} />}
            <span className="font-serif text-lg font-semibold text-navy truncate">{child ? `${child.nickname}'s Studio` : 'Studio'}</span>
          </div>
          {!focus && (
            <nav aria-label="Studio" className="hidden sm:flex items-center gap-1">
              {tabs.map((t) => {
                const on = path === t.to;
                const Icon = t.icon;
                return (
                  <Link key={t.to} to={t.to} aria-current={on ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold ${on ? 'bg-navy text-white' : 'text-navy hover:bg-navy/5'}`}>
                    <Icon className="w-4 h-4" aria-hidden /> {t.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <button type="button" onClick={onGrownUps} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold text-muted hover:bg-navy/5">
            {demo ? <LogOut className="w-4 h-4" aria-hidden /> : <Lock className="w-4 h-4" aria-hidden />}
            <span>{demo ? 'Exit demo' : 'Grown-ups'}</span>
          </button>
        </div>
      </header>
      <main className="pb-24 sm:pb-8">{children}</main>
      {!focus && (
        <nav aria-label="Studio" className={`sm:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-line grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {tabs.map((t) => {
            const on = path === t.to;
            const Icon = t.icon;
            return (
              <Link key={t.to} to={t.to} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${on ? 'text-navy' : 'text-muted'}`}>
                <Icon className="w-5 h-5" aria-hidden /> {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

const GrownUpGate: React.FC<{ open: boolean; onClose: () => void; demo: boolean }> = ({ open, onClose, demo }) => {
  const app = useApp();
  if (demo) return null;
  return (
    <Modal open={open} onClose={onClose} label="Parent PIN">
      <PinPad onSubmit={async (pin) => {
        const r = await app.unlockParent(pin);
        if (r.ok) { onClose(); navigate('/parent'); }
        return r;
      }} />
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// C01 Home: one clear mission, one tap
// ---------------------------------------------------------------------------
const StudioHome: React.FC<{ base: string; state: StudioState; catalog: Catalog; demo: boolean; onOpen: (id: string) => void }> = ({ base, state, catalog, demo, onOpen }) => {
  const lessons = catalog.lessons.map((l) => ({ id: l.meta.id, skill_id: l.meta.skill_id, domain: l.meta.domain, prerequisites: l.meta.prerequisites }));
  const openLessons = state.open_sessions.filter((s) => s.mode === 'lesson' && s.activity_id).map((s) => s.activity_id!);
  const mission = pickMission({
    lessons, completed: state.completed_lessons, independent: state.independent_lessons, openLessonIds: openLessons,
    recommendedId: state.recommendation?.activity_id ?? null, baselineDone: state.baseline_done,
    openBaseline: state.open_sessions.some((s) => s.mode === 'baseline'),
  });
  const lessonTitle = (id: string | null) => catalog.lessons.find((l) => l.meta.id === id)?.payload.title ?? catalog.items.find((i) => i.meta.id === id)?.meta.title ?? 'Next mission';
  const go = () => {
    if (mission.kind === 'baseline') navigate(`${base}/quest`);
    else if (mission.id) onOpen(mission.id);
  };
  const heading = mission.kind === 'baseline' ? 'Discovery Quest' : mission.kind === 'resume' ? `Keep going: ${lessonTitle(mission.id)}` : lessonTitle(mission.id);
  const blurb = mission.kind === 'baseline'
    ? 'A short set of shape puzzles so your Studio knows where to start. No timer, no score.'
    : mission.kind === 'resume' ? 'Pick up right where you stopped.'
    : state.recommendation?.reason ?? 'Your next puzzle is ready.';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {demo && <Notice tone="mock">This is a demo Studio. Nothing is saved and nothing about your child is collected. <Link to="/signup" className="font-semibold underline">Create a free parent account</Link> to save progress.</Notice>}
      <h1 className="text-3xl font-bold text-navy">Hi {state.child.nickname}!</h1>
      <button type="button" onClick={go} className="group w-full text-left rounded-3xl bg-navy text-white p-7 sm:p-9 shadow-lg hover:bg-navy-deep transition-colors focus-visible:outline-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ochre-soft uppercase tracking-wide"><Compass className="w-4 h-4" aria-hidden /> Your mission</span>
        <span className="block text-2xl sm:text-3xl font-bold mt-2 text-white">{heading}</span>
        <span className="block text-base text-white/80 mt-2 max-w-xl">{blurb}</span>
        <span className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ochre px-6 py-4 text-lg font-bold group-hover:bg-ochre/90">
          <PlayCircle className="w-6 h-6" aria-hidden /> {mission.kind === 'resume' ? 'Continue' : 'Start'}
        </span>
      </button>
      <div className={`grid gap-3 ${demo ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {!demo && <Link to={`${base}/paths`} className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><Route className="w-6 h-6 text-navy" aria-hidden /><span className="block mt-2 font-bold text-navy">Paths</span><span className="text-sm text-muted">3D shapes, numbers, words</span></Link>}
        <Link to={`${base}/map`} className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><MapIcon className="w-6 h-6 text-forest" aria-hidden /><span className="block mt-2 font-bold text-navy">Learning Map</span><span className="text-sm text-muted">See every rule to explore</span></Link>
        <Link to={`${base}/practice`} className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><Swords className="w-6 h-6 text-ochre" aria-hidden /><span className="block mt-2 font-bold text-navy">Practice Arena</span><span className="text-sm text-muted">Test-style puzzles</span></Link>
        <Link to={`${base}/discoveries`} className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><BookOpen className="w-6 h-6 text-navy" aria-hidden /><span className="block mt-2 font-bold text-navy">My Discoveries</span><span className="text-sm text-muted">{state.discoveries.length} rule{state.discoveries.length === 1 ? '' : 's'} so far</span></Link>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// C03 Learning Map
// ---------------------------------------------------------------------------
const STATE_STYLE: Record<MapState, { label: string; cls: string; icon: React.ElementType }> = {
  recommended: { label: 'Up next', cls: 'border-ochre bg-ochre-soft', icon: Star },
  in_progress: { label: 'In progress', cls: 'border-navy bg-mist/50', icon: PlayCircle },
  mastered: { label: 'Solved on my own', cls: 'border-forest bg-forest-soft', icon: CheckCircle2 },
  review: { label: 'Try again later', cls: 'border-line bg-paper', icon: RotateCcw },
  available: { label: 'Ready', cls: 'border-line bg-paper', icon: Circle },
  locked: { label: 'Locked', cls: 'border-dashed border-line bg-ivory opacity-80', icon: Lock },
};

const LearningMapView: React.FC<{ base: string; state: StudioState; catalog: Catalog }> = ({ base, state, catalog }) => {
  const lessons = catalog.lessons.map((l) => ({ id: l.meta.id, skill_id: l.meta.skill_id, domain: l.meta.domain, prerequisites: l.meta.prerequisites }));
  const map = buildLearningMap({
    lessons, completed: state.completed_lessons, independent: state.independent_lessons,
    openLessonIds: state.open_sessions.filter((s) => s.mode === 'lesson' && s.activity_id).map((s) => s.activity_id!),
    recommendedId: state.recommendation?.activity_id ?? null,
  });
  const skillTitle = (id: string) => catalog.skills.find((s) => s.id === id)?.title ?? id;
  const domains = [...new Set(catalog.lessons.map((l) => l.meta.domain))];
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-navy">Learning Map</h1>
      <ul className="flex flex-wrap gap-3 text-xs" aria-label="Legend">
        {(Object.keys(STATE_STYLE) as MapState[]).map((k) => {
          const Icon = STATE_STYLE[k].icon;
          return <li key={k} className="inline-flex items-center gap-1.5 text-muted"><Icon className="w-4 h-4" aria-hidden /> {STATE_STYLE[k].label}</li>;
        })}
      </ul>
      {domains.map((d) => (
        <section key={d} className="space-y-3">
          <h2 className="text-xl font-bold">{DOMAIN_TITLES[d as keyof typeof DOMAIN_TITLES] ?? d}</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {catalog.lessons.filter((l) => l.meta.domain === d).map((l) => {
              const s = map[l.meta.id];
              const st = STATE_STYLE[s.state];
              const Icon = st.icon;
              const locked = s.state === 'locked';
              return (
                <li key={l.meta.id}>
                  <button type="button" disabled={locked} onClick={() => navigate(`${base}/lesson/${l.meta.id}`)}
                    className={`w-full h-full text-left rounded-2xl border-2 p-4 ${st.cls} disabled:cursor-not-allowed`}
                    aria-label={`${l.payload.title}. ${st.label}.${locked ? ` First explore: ${s.missing.map(skillTitle).join(', ')}.` : ''}`}>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon className="w-4 h-4" aria-hidden /> {st.label}</span>
                    <span className="block font-bold text-navy mt-1.5">{l.payload.title}</span>
                    <span className="block text-sm text-muted mt-1">{l.payload.subskillTitle}</span>
                    {locked && <span className="block text-xs text-muted mt-2">First: {s.missing.map(skillTitle).join(', ')}</span>}
                    {l.meta.age_min >= 10 && <span className="inline-block mt-2 text-[11px] font-semibold rounded-full bg-mist px-2 py-0.5 text-navy">Challenge</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// C08 Practice Arena setup
// ---------------------------------------------------------------------------
const PracticeSetup: React.FC<{ base: string; state: StudioState; catalog: Catalog; demo: boolean }> = ({ base, catalog, demo }) => {
  const practice = catalog.items.filter((i) => i.meta.mode === 'practice');
  const domains = [...new Set(practice.map((i) => i.meta.domain))];
  const [domain, setDomain] = useState<string>('mixed');
  const [count, setCount] = useState(6);
  const [timed, setTimed] = useState(false);
  const pool = useMemo(() => {
    if (demo) return DEMO_PRACTICE;
    const list = domain === 'mixed' ? practice : practice.filter((p) => p.meta.domain === domain);
    // Deterministic interleave across skills so a set is varied.
    const bySkill = new Map<string, string[]>();
    for (const p of list) bySkill.set(p.meta.skill_id, [...(bySkill.get(p.meta.skill_id) ?? []), p.meta.id]);
    const queues = [...bySkill.values()];
    const out: string[] = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
    return out;
  }, [practice, domain, demo]);
  const ids = pool.slice(0, Math.min(count, pool.length));
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-navy">Practice Arena</h1>
      <p className="text-base text-ink">Puzzles like the ones on reasoning tests. No hints while you work. Every answer is explained at the end.</p>
      <Card className="p-6 space-y-6">
        {!demo && (
          <fieldset className="space-y-2">
            <legend className="font-semibold text-navy">What to practise</legend>
            <div className="flex flex-wrap gap-2">
              {['mixed', ...domains].map((d) => (
                <button key={d} type="button" aria-pressed={domain === d} onClick={() => setDomain(d)}
                  className={`min-h-11 px-4 rounded-full border-2 text-sm font-semibold ${domain === d ? 'border-navy bg-mist/50 text-navy' : 'border-line bg-paper text-ink'}`}>
                  {d === 'mixed' ? 'A bit of everything' : DOMAIN_TITLES[d as keyof typeof DOMAIN_TITLES] ?? d}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {!demo && (
          <fieldset className="space-y-2">
            <legend className="font-semibold text-navy">How many</legend>
            <div className="flex gap-2">
              {[4, 6, 8].map((n) => (
                <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}
                  className={`min-h-11 w-14 rounded-full border-2 text-sm font-semibold ${count === n ? 'border-navy bg-mist/50 text-navy' : 'border-line bg-paper text-ink'}`}>{n}</button>
              ))}
            </div>
          </fieldset>
        )}
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="w-5 h-5 accent-navy" />
          <span className="text-base text-ink">Use a timer (1 minute per puzzle)</span>
        </label>
        <Button size="lg" disabled={!ids.length} onClick={() => navigate(`${base}/practice/run?items=${ids.join(',')}${timed ? '&timed=1' : ''}`)}>
          Start {ids.length} puzzles
        </Button>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// My Discoveries
// ---------------------------------------------------------------------------
const Discoveries: React.FC<{ state: StudioState; catalog: Catalog }> = ({ state, catalog }) => (
  <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
    <h1 className="text-3xl font-bold text-navy">My Discoveries</h1>
    {state.discoveries.length === 0 ? (
      <Card className="p-8 text-center text-base text-muted">Finish a lesson and the rule you discovered will be saved here.</Card>
    ) : (
      <ul className="space-y-3">
        {state.discoveries.map((d, i) => {
          const l = catalog.lessons.find((x) => x.meta.id === d.activity_id);
          return (
            <li key={i}>
              <Card className="p-5 space-y-1">
                <p className="text-xs font-semibold text-forest">{new Date(d.at).toLocaleDateString()}</p>
                <h2 className="text-lg font-bold">{l?.payload.title ?? d.activity_id}</h2>
                <p className="text-sm text-ink">{l?.payload.pedagogicalTakeaway}</p>
                {d.note && <p className="text-base text-navy italic">“{d.note}”</p>}
              </Card>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
