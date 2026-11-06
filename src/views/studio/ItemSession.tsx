import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Flag, X, CheckCircle2, XCircle, MinusCircle, Sparkles } from 'lucide-react';
import type { ItemPayload } from '../../content/types';
import { newEventId } from '../../engine/learning';
import type { LearningBackend, SessionStart, SessionSummary } from '../../services/types';
import { friendlyError } from '../../lib/supabase';
import { ItemStemView, OptionGrid } from '../../components/figures';
import { Button, Card, ErrorState, Notice, Spinner } from '../../ui/kit';

interface Props {
  backend: LearningBackend;
  childId: string;
  mode: 'baseline' | 'practice';
  itemIds?: string[];
  timed?: boolean;
  onExit: () => void;
  onDone?: (s: SessionSummary) => void;
}

/**
 * C02 Discovery Quest (untimed, no hints, no correctness feedback, skip allowed)
 * C08 Practice Arena (optional timer, no hints, full review after submitting)
 */
export const ItemSession: React.FC<Props> = ({ backend, childId, mode, itemIds, timed, onExit, onDone }) => {
  const [start, setStart] = useState<SessionStart | null>(null);
  const [items, setItems] = useState<{ id: string; payload: ItemPayload }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [now, setNow] = useState(Date.now());
  const shownAt = useRef(Date.now());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cat, s] = await Promise.all([backend.catalog(), backend.start(childId, mode, { itemIds, timed })]);
      const byId = new Map(cat.items.map((i) => [i.meta.id, i.payload]));
      const list = s.session.item_refs.map((r) => ({ id: r.id, payload: byId.get(r.id)! })).filter((x) => x.payload);
      setItems(list);
      setStart(s);
      const restored: Record<string, string | null> = {};
      for (const a of s.attempts) restored[a.item_id] = (a.answer as string) ?? null;
      setAnswers(restored);
      const cp = s.session.checkpoint as { idx?: number };
      setIdx(Math.min(cp?.idx ?? 0, Math.max(0, list.length - 1)));
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [backend, childId, mode, itemIds, timed]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { shownAt.current = Date.now(); }, [idx]);

  const deadline = useMemo(() => {
    if (!start?.session.timed || !start.session.time_limit_seconds) return null;
    return new Date(start.session.started_at).getTime() + start.session.time_limit_seconds * 1000;
  }, [start]);

  useEffect(() => {
    if (!deadline || summary) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [deadline, summary]);

  const finish = useCallback(async () => {
    if (!start) return;
    setBusy(true);
    try {
      const s = await backend.finish(start.session.id);
      setSummary(s);
      onDone?.(s);
    } catch (e) {
      setFlash(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, [backend, start, onDone]);

  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;
  useEffect(() => { if (remaining === 0 && !summary && !busy) finish(); }, [remaining, summary, busy, finish]);

  const choose = async (itemId: string, answer: string | null) => {
    if (!start) return;
    setAnswers((a) => ({ ...a, [itemId]: answer }));
    try {
      await backend.submit(start.session.id, mode, itemId, answer, newEventId(), Date.now() - shownAt.current);
    } catch (e) {
      setFlash(friendlyError(e));
    }
  };

  const move = (to: number) => {
    setIdx(to);
    if (start) backend.checkpoint(start.session.id, { idx: to }).catch(() => undefined);
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!start) return <Spinner label={mode === 'baseline' ? 'Opening your Discovery Quest' : 'Setting up practice'} />;
  if (!items.length) return <ErrorState message="No questions are available right now." onRetry={load} />;

  // ------------------------------------------------------------------ results
  if (summary) {
    if (mode === 'baseline') {
      return (
        <div className="studio max-w-2xl mx-auto px-4 py-10">
          <Card className="p-8 text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-ochre" aria-hidden />
            <h1 className="text-2xl font-bold">Discovery Quest complete!</h1>
            <p className="text-base text-ink">Thank you for exploring. Your Studio now has missions picked just for you.</p>
            <Button size="lg" onClick={onExit}>Go to my Studio</Button>
          </Card>
        </div>
      );
    }
    const byId = new Map(items.map((i) => [i.id, i.payload]));
    return (
      <div className="studio max-w-4xl mx-auto px-4 py-6 space-y-5">
        <Card className="p-6 space-y-2">
          <h1 className="text-2xl font-bold">Practice review</h1>
          <p className="text-base text-ink">
            {summary.correct} of {summary.total} correct · {summary.timed ? 'Timed' : 'Untimed'} practice
            {summary.total && summary.answered! < summary.total ? ` · ${summary.total - summary.answered!} skipped` : ''}
          </p>
          <p className="text-sm text-muted">Every answer is explained below. Missed ones show which rule to revisit.</p>
        </Card>
        {summary.items?.map((r, i) => {
          const p = byId.get(r.item_id);
          if (!p) return null;
          const Icon = r.skipped ? MinusCircle : r.is_correct ? CheckCircle2 : XCircle;
          return (
            <Card key={r.item_id} className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${r.skipped ? 'text-muted' : r.is_correct ? 'text-forest' : 'text-brick'}`} aria-hidden />
                <h2 className="text-base font-bold">Question {i + 1}: {r.skipped ? 'skipped' : r.is_correct ? 'correct' : 'not this time'}</h2>
              </div>
              <p className="text-sm text-ink">{p.prompt}</p>
              <ItemStemView item={p} />
              <OptionGrid name={`Question ${i + 1} choices`} options={p.options} selected={(r.answer as string) ?? null} onSelect={() => undefined} disabled
                reveal={{ correct: r.correct_option, chosen: (r.answer as string) ?? null }} />
              <p className="text-sm text-ink"><strong>Why:</strong> {r.explanation}</p>
            </Card>
          );
        })}
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onExit}>Back to my Studio</Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ question
  const item = items[idx];
  const chosen = answers[item.id] ?? null;
  const answered = items.filter((i) => answers[i.id]).length;

  return (
    <div className="studio max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-navy hover:bg-navy/5 font-semibold text-sm" aria-label="Stop for now. Your answers are saved.">
          <X className="w-5 h-5" aria-hidden /> <span className="hidden sm:inline">Stop for now</span>
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-navy">{mode === 'baseline' ? 'Discovery Quest' : 'Practice Arena'}</h1>
        {remaining !== null ? (
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${remaining < 30 ? 'text-brick' : 'text-navy'}`} role="timer" aria-live="off">
            <Clock className="w-4 h-4" aria-hidden /> {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        ) : <span className="w-11" aria-hidden />}
      </header>

      <div className="flex flex-wrap gap-1.5 justify-center" aria-label="Questions">
        {items.map((it, i) => (
          <button key={it.id} type="button" onClick={() => move(i)} aria-label={`Question ${i + 1}${answers[it.id] ? ', answered' : ''}`} aria-current={i === idx ? 'true' : undefined}
            className={`w-9 h-9 rounded-full text-xs font-bold border-2 ${i === idx ? 'border-navy bg-navy text-white' : answers[it.id] ? 'border-forest bg-forest-soft text-forest' : 'border-line bg-paper text-muted'}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {mode === 'baseline' && idx === 0 && !answered && (
        <Notice>There is no timer and no score. Take your time, and skip anything that feels too tricky.</Notice>
      )}
      {mode === 'practice' && idx === 0 && !answered && (
        <Notice>No hints during practice. You will see every answer explained when you finish.</Notice>
      )}
      {flash && <Notice tone="error">{flash}</Notice>}
      {backend.kind === 'demo' && <Notice tone="mock">Demo mode: nothing is saved.</Notice>}

      <Card className="p-5 sm:p-7 space-y-6">
        <h2 className="text-xl font-bold">{item.payload.prompt}</h2>
        <ItemStemView item={item.payload} preview={chosen ? item.payload.options.find((o) => o.id === chosen)?.objects : null} />
        <OptionGrid name="Answer choices" options={item.payload.options} selected={chosen} onSelect={(id) => choose(item.id, id)} />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" disabled={idx === 0} onClick={() => move(idx - 1)}><ArrowLeft className="w-4 h-4" aria-hidden /> Back</Button>
        <div className="flex gap-3">
          {!chosen && idx < items.length - 1 && (
            <Button variant="ghost" onClick={() => { choose(item.id, null); move(idx + 1); }}>Skip</Button>
          )}
          {idx < items.length - 1 ? (
            <Button onClick={() => move(idx + 1)}>Next <ArrowRight className="w-4 h-4" aria-hidden /></Button>
          ) : (
            <Button variant="ochre" busy={busy} onClick={finish}><Flag className="w-4 h-4" aria-hidden /> {mode === 'baseline' ? 'Finish quest' : `Submit (${answered}/${items.length} answered)`}</Button>
          )}
        </div>
      </div>
    </div>
  );
};
