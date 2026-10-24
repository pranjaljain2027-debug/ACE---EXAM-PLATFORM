import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, FlaskConical, Lightbulb, Target, Sparkles, X, Check, RotateCcw } from 'lucide-react';
import type { PublicLesson } from '../../content/types';
import type { LabHistory } from '../../engine/shapeLab';
import { newEventId } from '../../engine/learning';
import type { AttemptResult, LearningBackend, SessionStart, SessionSummary, ShapeEvent } from '../../services/types';
import { friendlyError } from '../../lib/supabase';
import { ShapeLab } from '../../components/lab/ShapeLab';
import { Figure, OptionGrid } from '../../components/figures';
import { Button, Card, ErrorState, Notice, Spinner } from '../../ui/kit';

type View = 'observe' | 'experiment' | 'discover' | 'apply' | 'reflect' | 'done';

const VIEW_OF: Record<string, View> = {
  OBSERVE: 'observe', EXPERIMENT: 'experiment', DISCOVER: 'discover', APPLY: 'apply', REMEDIATION: 'apply', REFLECT: 'reflect', COMPLETE: 'done',
};

const STEPS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'observe', label: 'Observe', icon: Eye },
  { id: 'experiment', label: 'Experiment', icon: FlaskConical },
  { id: 'discover', label: 'Discover', icon: Lightbulb },
  { id: 'apply', label: 'Apply', icon: Target },
  { id: 'reflect', label: 'Reflect', icon: Sparkles },
];

interface Props {
  backend: LearningBackend;
  childId: string;
  activityId: string;
  reducedMotion?: boolean;
  onExit: () => void;
  onNext: (activityId: string | null) => void;
}

export const LessonRunner: React.FC<Props> = ({ backend, childId, activityId, reducedMotion, onExit, onNext }) => {
  const [lesson, setLesson] = useState<PublicLesson | null>(null);
  const [start, setStart] = useState<SessionStart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string>('OBSERVE');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Stage data
  const [obsChoice, setObsChoice] = useState<string[]>([]);
  const [obsResult, setObsResult] = useState<{ correct: boolean; key: string[] } | null>(null);
  const [labMatched, setLabMatched] = useState(false);
  const [ruleChoice, setRuleChoice] = useState<string | null>(null);
  const [ruleResult, setRuleResult] = useState<AttemptResult | null>(null);
  const [ruleSolved, setRuleSolved] = useState(false);
  const [hints, setHints] = useState<{ discover: number; apply: number }>({ discover: 0, apply: 0 });
  const [optChoice, setOptChoice] = useState<string | null>(null);
  const [applyResults, setApplyResults] = useState<{ id: string; r: AttemptResult }[]>([]);
  const [strategy, setStrategy] = useState<string>('');
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [labHistory, setLabHistory] = useState<LabHistory | undefined>(undefined);

  const sessionId = start?.session.id;
  const eventQueue = useRef<ShapeEvent[]>([]);
  const checkpointTimer = useRef<number | null>(null);
  const stageStarted = useRef(Date.now());

  const load = useCallback(async () => {
    setError(null);
    try {
      const cat = await backend.catalog();
      const l = cat.lessons.find((x) => x.meta.id === activityId);
      if (!l) throw new Error('not_found');
      const s = await backend.start(childId, 'lesson', { activityId });
      setLesson(l.payload);
      setStart(s);
      setState(s.session.state);
      // Resume: rebuild the view from server-recorded attempts and checkpoint.
      const obs = s.attempts.find((a) => a.stage === 'observe');
      if (obs) {
        setObsChoice(obs.answer as string[]);
        setObsResult({ correct: Boolean(obs.is_correct), key: [] });
      }
      const disc = s.attempts.filter((a) => a.stage === 'discover');
      if (disc.some((a) => a.is_correct)) {
        setRuleSolved(true);
        const c = disc.find((a) => a.is_correct)!;
        setRuleChoice(c.answer as string);
        setRuleResult({ is_correct: true, is_first_attempt: c.is_first_attempt, assisted: !c.is_first_attempt });
      }
      setApplyResults(
        s.attempts.filter((a) => a.stage === 'apply').map((a) => ({ id: a.answer as string, r: { is_correct: a.is_correct, is_first_attempt: a.is_first_attempt, assisted: !a.is_first_attempt } })),
      );
      setHints({ discover: s.hint_levels.discover ?? 0, apply: s.hint_levels.apply ?? 0 });
      const cp = s.session.checkpoint as { lab?: LabHistory };
      if (cp?.lab?.actions) setLabHistory(cp.lab);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [backend, childId, activityId]);

  useEffect(() => { load(); }, [load]);

  // Flush shape action log periodically (action types only).
  useEffect(() => {
    if (!sessionId) return;
    const t = window.setInterval(() => {
      const batch = eventQueue.current.splice(0, 200);
      if (batch.length) backend.events(sessionId, batch).catch(() => { eventQueue.current.unshift(...batch); });
    }, 4000);
    return () => window.clearInterval(t);
  }, [backend, sessionId]);

  const view = VIEW_OF[state] ?? 'observe';
  useEffect(() => { stageStarted.current = Date.now(); }, [view]);

  const go = async (to: string) => {
    if (!sessionId) return;
    setBusy(true);
    setFlash(null);
    try {
      await backend.advance(sessionId, to);
      setState(to);
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch (e) {
      setFlash(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (stage: 'observe' | 'discover' | 'apply', answer: unknown) => {
    if (!sessionId) return null;
    setBusy(true);
    setFlash(null);
    try {
      return await backend.submit(sessionId, stage, null, answer, newEventId(), Date.now() - stageStarted.current);
    } catch (e) {
      setFlash(friendlyError(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const revealHint = async (stage: 'discover' | 'apply') => {
    if (!sessionId) return;
    const level = hints[stage] + 1;
    if (level > 3) return;
    try {
      await backend.hint(sessionId, stage, level, newEventId());
      setHints((h) => ({ ...h, [stage]: level }));
    } catch (e) {
      setFlash(friendlyError(e));
    }
  };

  const onLabHistory = useCallback((h: LabHistory) => {
    if (!sessionId) return;
    if (checkpointTimer.current) window.clearTimeout(checkpointTimer.current);
    checkpointTimer.current = window.setTimeout(() => {
      if (h.actions.length) backend.checkpoint(sessionId, { lab: h }).catch(() => undefined);
    }, 1200);
  }, [backend, sessionId]);

  const onLabAction = useCallback((label: string) => {
    eventQueue.current.push({ client_event_id: newEventId(), type: 'shape_action', stage: 'experiment', detail: { action: label } });
  }, []);

  const onLabMatch = useCallback((m: boolean) => setLabMatched(m), []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!lesson || !start) return <Spinner label="Opening your lesson" />;

  const firstApply = applyResults[0];
  const applySolved = applyResults.some((a) => a.r.is_correct);
  const stepIndex = STEPS.findIndex((s) => s.id === view);

  return (
    <div className={`studio max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 ${reducedMotion ? 'reduce-motion' : ''}`}>
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-navy hover:bg-navy/5 font-semibold text-sm" aria-label="Leave lesson. Your progress is saved.">
          <X className="w-5 h-5" aria-hidden /> <span className="hidden sm:inline">Stop for now</span>
        </button>
        <div className="text-center min-w-0">
          <p className="text-xs text-muted font-semibold">{lesson.subskillTitle}</p>
          <h1 className="text-lg sm:text-xl font-bold text-navy truncate">{lesson.title}</h1>
        </div>
        <span className="w-11" aria-hidden />
      </header>

      <nav aria-label="Lesson steps">
        <ol className="grid grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < stepIndex || view === 'done';
            const cur = i === stepIndex;
            return (
              <li key={s.id} aria-current={cur ? 'step' : undefined}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-semibold ${cur ? 'bg-navy text-white' : done ? 'bg-forest-soft text-forest' : 'bg-paper border border-line text-muted'}`}>
                {done ? <Check className="w-4 h-4" aria-hidden /> : <Icon className="w-4 h-4" aria-hidden />}
                <span>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {backend.kind === 'demo' && <Notice tone="mock">Demo mode: nothing is saved and no information about your child is collected.</Notice>}
      {flash && <Notice tone="error">{flash}</Notice>}

      {/* ------------------------------------------------------------ OBSERVE */}
      {view === 'observe' && (
        <Card className="p-5 sm:p-7 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Look closely</h2>
            <p className="text-base text-ink mt-1">{lesson.promptText}</p>
          </div>
          <Sequence frames={lesson.frames.map((f) => (f.isMissing ? null : f.objects))} />
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-navy">{lesson.observationPrompt} <span className="text-sm font-normal text-muted">(pick all that change)</span></legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {lesson.observationChoices.map((c) => {
                const on = obsChoice.includes(c.id);
                const isKey = obsResult?.key.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} disabled={Boolean(obsResult)}
                    onClick={() => setObsChoice((x) => (on ? x.filter((y) => y !== c.id) : [...x, c.id]))}
                    className={`text-left min-h-14 px-4 py-3 rounded-xl border-2 text-base font-medium ${isKey ? 'border-forest bg-forest-soft' : on ? 'border-navy bg-mist/40' : 'border-line bg-paper hover:border-navy/40'}`}>
                    {on ? '☑ ' : '☐ '}{c.label}{isKey && <span className="sr-only"> (this one changes)</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {obsResult ? (
            <div className="space-y-4">
              <Notice tone={obsResult.correct ? 'info' : 'warn'}>
                {obsResult.correct ? 'Great noticing. That is exactly what changes.' : obsResult.key.length ? 'Good thinking. The green box shows what really changes. Let’s test it in the lab.' : 'Let’s test your idea in the lab.'}
              </Notice>
              <Button size="lg" onClick={() => go('EXPERIMENT')} busy={busy}>Try it in the Shape Lab <ArrowRight className="w-5 h-5" aria-hidden /></Button>
            </div>
          ) : (
            <Button size="lg" disabled={!obsChoice.length} busy={busy} onClick={async () => {
              const r = await submit('observe', obsChoice);
              if (r) setObsResult({ correct: Boolean(r.is_correct), key: r.observe_key ?? [] });
            }}>I noticed these</Button>
          )}
        </Card>
      )}

      {/* --------------------------------------------------------- EXPERIMENT */}
      {view === 'experiment' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="text-2xl font-bold">Experiment</h2>
            <p className="text-base text-ink">Make the shape look like the missing picture. You cannot break anything here. Try ideas, undo, and replay.</p>
            <Sequence frames={lesson.frames.map((f) => (f.isMissing ? null : f.objects))} small />
          </Card>
          <ShapeLab
            initial={lesson.initialState}
            target={lesson.targetState}
            allowedActions={lesson.allowedActions}
            initialHistory={labHistory}
            onHistoryChange={onLabHistory}
            onAction={onLabAction}
            onMatchChange={onLabMatch}
            reducedMotion={reducedMotion}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="lg" onClick={() => go('DISCOVER')} busy={busy}>
              {labMatched ? 'I found it! What is the rule?' : 'Next: name the rule'} <ArrowRight className="w-5 h-5" aria-hidden />
            </Button>
            {!labMatched && <span className="text-sm text-muted">You can move on even if it does not match yet.</span>}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- DISCOVER */}
      {view === 'discover' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="text-2xl font-bold">What is the rule?</h2>
              <p className="text-base text-ink mt-1">Pick the sentence that explains every step.</p>
            </div>
            <Sequence frames={lesson.frames.map((f) => (f.isMissing ? null : f.objects))} small />
            <div role="radiogroup" aria-label="Rule choices" className="space-y-2">
              {lesson.ruleOptions.map((r) => {
                const on = ruleChoice === r.id;
                return (
                  <button key={r.id} type="button" role="radio" aria-checked={on} disabled={ruleSolved}
                    onClick={() => { setRuleChoice(r.id); setRuleResult(null); }}
                    className={`w-full text-left min-h-14 px-4 py-3 rounded-xl border-2 text-base ${on ? (ruleResult?.is_correct ? 'border-forest bg-forest-soft' : ruleResult ? 'border-brick bg-brick-soft' : 'border-navy bg-mist/40') : 'border-line bg-paper hover:border-navy/40'}`}>
                    {r.label}
                  </button>
                );
              })}
            </div>
            {ruleResult && (
              <Notice tone={ruleResult.is_correct ? 'info' : 'warn'}>
                <p className="font-semibold">{ruleResult.is_correct ? 'Yes! You found the rule.' : 'Not quite.'}</p>
                {ruleResult.feedback && <p>{ruleResult.feedback}</p>}
              </Notice>
            )}
            {ruleSolved ? (
              <div className="space-y-3">
                <ol className="list-decimal pl-5 space-y-1 text-sm text-ink">
                  {lesson.explanationSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <Button size="lg" onClick={() => go('APPLY')} busy={busy}>Try a brand-new puzzle <ArrowRight className="w-5 h-5" aria-hidden /></Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" disabled={!ruleChoice || Boolean(ruleResult)} busy={busy} onClick={async () => {
                  const r = await submit('discover', ruleChoice);
                  if (r) { setRuleResult(r); if (r.is_correct) setRuleSolved(true); }
                }}>Check my rule</Button>
                <Button variant="secondary" size="lg" onClick={() => go('EXPERIMENT')} busy={busy}><ArrowLeft className="w-5 h-5" aria-hidden /> Back to the lab</Button>
              </div>
            )}
          </Card>
          {!ruleSolved && <HintPanel hints={lesson.hints} level={hints.discover} onReveal={() => revealHint('discover')} />}
        </div>
      )}

      {/* -------------------------------------------------------------- APPLY */}
      {view === 'apply' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="text-2xl font-bold">New puzzle, same rule</h2>
              <p className="text-base text-ink mt-1">{lesson.transferChallenge.prompt}</p>
              {!firstApply && <p className="text-sm text-muted mt-2">First try on your own. Hints open after your first try.</p>}
            </div>
            <Sequence frames={lesson.transferChallenge.frames.map((f) => (f.isMissing ? null : f.objects))}
              preview={optChoice ? lesson.transferChallenge.options.find((o) => o.id === optChoice)?.objects : undefined} />
            <OptionGrid name="Answer choices" options={lesson.transferChallenge.options} selected={optChoice} disabled={applySolved || state === 'REMEDIATION'}
              onSelect={(id) => setOptChoice(id)} />
            {applyResults.length > 0 && (
              <Notice tone={applyResults[applyResults.length - 1].r.is_correct ? 'info' : 'warn'}>
                {applyResults[applyResults.length - 1].r.is_correct
                  ? (firstApply?.r.is_correct && hints.apply === 0 ? 'You solved a brand-new puzzle on your own. That is real understanding.' : 'You got it! Using help to get there is how learning works.')
                  : 'Not this one.'}{' '}
                {applyResults[applyResults.length - 1].r.feedback}
              </Notice>
            )}
            {applySolved ? (
              <Button size="lg" onClick={() => go('REFLECT')} busy={busy}>Finish and reflect <ArrowRight className="w-5 h-5" aria-hidden /></Button>
            ) : state === 'REMEDIATION' ? (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={async () => { setOptChoice(null); await go('APPLY'); }} busy={busy}><RotateCcw className="w-5 h-5" aria-hidden /> Try again</Button>
                <Button variant="secondary" size="lg" onClick={() => go('REFLECT')} busy={busy}>Stop and reflect</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" disabled={!optChoice || applyResults.some((a) => a.id === optChoice)} busy={busy} onClick={async () => {
                  const r = await submit('apply', optChoice);
                  if (!r) return;
                  setApplyResults((x) => [...x, { id: optChoice!, r }]);
                  if (!r.is_correct && applyResults.length === 0) await go('REMEDIATION');
                }}>Check my answer</Button>
                {applyResults.length > 0 && <Button variant="secondary" size="lg" onClick={() => go('REFLECT')} busy={busy}>Stop and reflect</Button>}
              </div>
            )}
          </Card>
          {state === 'REMEDIATION' && (
            <HintPanel hints={lesson.hints} level={hints.apply} onReveal={() => revealHint('apply')} explanationSteps={lesson.explanationSteps} />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ REFLECT */}
      {view === 'reflect' && !summary && (
        <Card className="p-5 sm:p-7 space-y-5">
          <h2 className="text-2xl font-bold">Reflect</h2>
          <p className="text-base text-ink">
            {firstApply?.r.is_correct && hints.apply === 0
              ? 'You used the rule on a puzzle you had never seen. That is the goal of every lesson.'
              : applySolved
                ? 'You worked it out with some help. Next time, try the new puzzle on your own first.'
                : 'This rule is still settling in. That is normal, and you will meet it again soon in an easier way.'}
          </p>
          <fieldset className="space-y-2">
            <legend className="font-semibold text-navy">What helped you most?</legend>
            <div className="flex flex-wrap gap-2">
              {['I pictured it in my head', 'I tried it in the lab', 'I followed one part of the shape', 'A hint helped me', 'I am not sure yet'].map((s) => (
                <button key={s} type="button" aria-pressed={strategy === s} onClick={() => setStrategy(s)}
                  className={`min-h-11 px-4 rounded-full border-2 text-sm font-semibold ${strategy === s ? 'border-navy bg-mist/50 text-navy' : 'border-line bg-paper text-ink'}`}>{s}</button>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor="rule-words" className="font-semibold text-navy">Say the rule in your own words (optional)</label>
            <textarea id="rule-words" maxLength={200} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-base" placeholder="The shape…" />
            <p className="text-xs text-muted">Only your grown-up can see this. Please do not write your full name or where you live.</p>
          </div>
          <Button size="lg" busy={busy} onClick={async () => {
            if (!sessionId) return;
            setBusy(true);
            try {
              setSummary(await backend.finish(sessionId, { note, strategy }));
              setState('COMPLETE');
            } catch (e) { setFlash(friendlyError(e)); } finally { setBusy(false); }
          }}>Save my discovery</Button>
        </Card>
      )}

      {(view === 'done' || summary) && (
        <Card className="p-6 sm:p-8 text-center space-y-4">
          <Sparkles className="w-10 h-10 mx-auto text-ochre" aria-hidden />
          <h2 className="text-2xl font-bold">Discovery saved</h2>
          {summary?.transfer_outcome && (
            <p className="text-base text-ink">
              {summary.transfer_outcome === 'independent' ? 'You solved the new puzzle on your own.' : summary.transfer_outcome === 'assisted' ? 'You solved the new puzzle with help.' : 'You gave the new puzzle a real try.'}
            </p>
          )}
          {summary?.recommendation?.reason && <p className="text-sm text-muted max-w-md mx-auto">{summary.recommendation.reason}</p>}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {summary?.recommendation?.activity_id && (
              <Button size="lg" onClick={() => onNext(summary.recommendation!.activity_id)}>Next mission <ArrowRight className="w-5 h-5" aria-hidden /></Button>
            )}
            <Button size="lg" variant="secondary" onClick={onExit}>Back to my Studio</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

const Sequence: React.FC<{ frames: (import('../../types/reasoning').VisualObject[] | null)[]; small?: boolean; preview?: import('../../types/reasoning').VisualObject[] }> = ({ frames, small, preview }) => (
  <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Picture steps">
    {frames.map((f, i) => (
      <li key={i} className={small ? 'w-16 sm:w-20' : 'w-20 sm:w-28'}>
        <Figure objects={f ?? preview ?? null} missing={!f && !preview} highlight={!f} label={f ? `Step ${i + 1}` : 'Missing step'} />
      </li>
    ))}
  </ol>
);

const HintPanel: React.FC<{ hints: PublicLesson['hints']; level: number; onReveal: () => void; explanationSteps?: string[] }> = ({ hints, level, onReveal, explanationSteps }) => {
  const names = ['Look here', 'How they connect', 'Step by step'];
  return (
    <Card className="p-5 space-y-3 bg-ivory" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-ochre" aria-hidden /> Hints</h3>
        <span className="text-xs text-muted">{level} of 3 used</span>
      </div>
      {hints.slice(0, level).map((h, i) => (
        <div key={i} className="rounded-xl bg-paper border border-line px-4 py-3">
          <p className="text-xs font-semibold text-forest uppercase tracking-wide">{names[i]}</p>
          <p className="text-base text-ink">{h.content}</p>
          {i === 2 && explanationSteps && (
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-ink">{explanationSteps.map((s, j) => <li key={j}>{s}</li>)}</ol>
          )}
          {i === 2 && <p className="text-xs text-muted mt-2">Now use the idea on the puzzle again yourself.</p>}
        </div>
      ))}
      {level < 3 && (
        <Button variant="secondary" onClick={onReveal}>{level === 0 ? 'Show a hint' : 'Show another hint'}</Button>
      )}
    </Card>
  );
};
