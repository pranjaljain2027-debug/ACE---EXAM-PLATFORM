/**
 * Bank question loop (plan §7): predict first, then explore, then answer, then see why.
 * The first prediction is sent to the server before the shape can be moved, so it measures what the
 * child could picture unaided. Correctness is only revealed after the final answer.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Lightbulb, Lock, Sparkles, Volume2, XCircle, ArrowRight } from 'lucide-react';
import { bankApi, type AnswerResult, type AttemptStart } from '../../services/bank';
import { newEventId } from '../../engine/learning';
import { friendlyError } from '../../lib/supabase';
import { QuestionOptions, QuestionStem } from '../../components/bank/QuestionParts';
import { Button, Card, ErrorState, Notice, Spinner } from '../../ui/kit';

type Phase = 'predict' | 'explore' | 'done';

const keyFor = (child: string, q: string, transfer: string | null) => `how:qa:${child}:${q}:${transfer ?? ''}`;

export const QuestionRunner: React.FC<{
  childId: string; questionId: string; transferOf: string | null; reducedMotion: boolean;
  onExit: () => void; onTransfer: (questionId: string, fromAttempt: string) => void;
}> = ({ childId, questionId, transferOf, reducedMotion, onExit, onTransfer }) => {
  const [start, setStart] = useState<AttemptStart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('predict');
  const [selected, setSelected] = useState<string | null>(null);
  const [firstGuess, setFirstGuess] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const actions = useRef(0);
  const flushTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const k = keyFor(childId, questionId, transferOf);
    const remember = (id: string) => { try { sessionStorage.setItem(k, id); } catch { /* storage blocked */ } };
    let ev: string | null = null;
    try { ev = sessionStorage.getItem(k); } catch { /* storage blocked */ }
    if (!ev) { ev = newEventId(); remember(ev); }
    try {
      let s = await bankApi.start(childId, questionId, ev, transferOf);
      if (s.state.answered) { ev = newEventId(); remember(ev); s = await bankApi.start(childId, questionId, ev, transferOf); }
      setStart(s);
      const predictFirst = (s.question.payload.interaction as { predict_first: boolean }).predict_first;
      if (s.state.predicted && predictFirst) { setPhase('explore'); setFirstGuess(s.state.initial_option); setSelected(s.state.initial_option); }
      else setPhase('predict');
    } catch (e) { setError(friendlyError(e)); }
  }, [childId, questionId, transferOf]);

  useEffect(() => { load(); }, [load]);

  const flushExplore = useCallback(() => {
    if (!start || actions.current === 0) return;
    const n = actions.current;
    actions.current = 0;
    bankApi.explore(start.attempt_id, n).catch(() => { actions.current += n; });
  }, [start]);
  useEffect(() => () => { if (flushTimer.current) window.clearTimeout(flushTimer.current); }, []);
  const onExplore = () => {
    actions.current += 1;
    if (flushTimer.current) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(flushExplore, 1200);
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!start) return <Spinner label="Getting your puzzle" />;

  const q = start.question;
  const p = q.payload;
  const predictFirst = (p.interaction as { predict_first: boolean }).predict_first;
  const readAloud = () => {
    try {
      const u = new SpeechSynthesisUtterance((p as { read_aloud?: string }).read_aloud ?? p.prompt);
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* speech not available */ }
  };

  const lockGuess = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await bankApi.predict(start.attempt_id, selected);
      setFirstGuess(selected);
      setPhase('explore');
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      flushExplore();
      const r = await bankApi.answer(start.attempt_id, selected);
      setResult(r);
      setPhase('done');
      try { sessionStorage.removeItem(keyFor(childId, questionId, transferOf)); } catch { /* ignore */ }
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  };

  const askHint = async () => {
    try { setHint((await bankApi.hint(start.attempt_id)).hint); } catch (e) { setError(friendlyError(e)); }
  };

  const hintAllowed = q.has_hint && phase !== 'done' && (!predictFirst || phase === 'explore');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold text-navy hover:bg-navy/5"><ArrowLeft className="w-4 h-4" aria-hidden /> Back</button>
        {transferOf && <span className="text-xs font-semibold rounded-full bg-mist px-3 py-1 text-navy">New puzzle, same idea</span>}
      </div>

      <Card className="p-5 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-navy leading-snug">{p.prompt}</h1>
          <button type="button" onClick={readAloud} className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-line text-navy hover:border-navy/40" aria-label="Read the question aloud"><Volume2 className="w-5 h-5" aria-hidden /></button>
        </div>

        <QuestionStem payload={p} explore={predictFirst && phase === 'explore'} reducedMotion={reducedMotion} onExplore={onExplore} showReplay={phase === 'done'} />

        {predictFirst && phase === 'predict' && (
          <Notice tone="info"><span className="inline-flex items-center gap-1.5 font-semibold"><Lock className="w-4 h-4" aria-hidden /> Picture it first.</span> Make your best guess without moving the shape. Then you can turn it and check.</Notice>
        )}
        {predictFirst && phase === 'explore' && (
          <Notice tone="info">Your first guess is saved. Now turn the shape and test it. You can keep your guess or change it.</Notice>
        )}

        <QuestionOptions payload={p} selected={selected} onSelect={setSelected} disabled={busy || phase === 'done'}
          reveal={result ? { correct: result.correct_option, chosen: result.chosen } : null} firstGuess={phase === 'explore' ? firstGuess : null} />

        {hint && <Notice tone="warn"><span className="font-semibold">Hint:</span> {hint}</Notice>}

        {phase !== 'done' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {hintAllowed && !hint ? <Button variant="ghost" onClick={askHint}><Lightbulb className="w-4 h-4" aria-hidden /> Hint</Button> : <span />}
            {predictFirst && phase === 'predict'
              ? <Button size="lg" disabled={!selected} busy={busy} onClick={lockGuess}>Lock in my guess</Button>
              : <Button size="lg" disabled={!selected} busy={busy} onClick={submit}>This is my answer</Button>}
          </div>
        )}
      </Card>

      {result && (
        <Card className={`p-5 sm:p-7 space-y-4 border-2 ${result.correct ? 'border-forest' : 'border-ochre'}`} aria-live="polite">
          <p className="flex items-center gap-2 text-xl font-bold text-navy">
            {result.correct ? <CheckCircle2 className="w-6 h-6 text-forest" aria-hidden /> : <XCircle className="w-6 h-6 text-brick" aria-hidden />}
            {result.correct ? (result.initial_correct || !predictFirst ? 'Yes, you saw it.' : 'Yes. Testing it helped.') : 'Not this one. Here is why.'}
          </p>
          {!result.correct && <p className="text-ink">{result.rationale_chosen}</p>}
          <div className="space-y-2">
            <p className="font-semibold text-navy">{result.explanation.summary}</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-ink">{result.explanation.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {result.transfer && start && (
              <Button variant="ochre" onClick={() => onTransfer(result.transfer!.question_id, start.attempt_id)}><Sparkles className="w-4 h-4" aria-hidden /> Try one like it</Button>
            )}
            <Button variant="secondary" onClick={onExit}>Done <ArrowRight className="w-4 h-4" aria-hidden /></Button>
          </div>
        </Card>
      )}
    </div>
  );
};
