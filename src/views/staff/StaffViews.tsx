/**
 * Staff area (plan §18.5): review queue, item review with the exact learner view, approve / request
 * changes / reject, publish / retire / rollback, coverage report, batch import with dry run, export.
 * Every action is enforced server-side; this UI only presents it.
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileUp, ShieldCheck } from 'lucide-react';
import { Link, match, navigate } from '../../app/router';
import { staffApi, type CoverageRow, type ImportResult, type QueueBank, type ReviewHistory } from '../../services/bank';
import { QuestionOptions, QuestionStem } from '../../components/bank/QuestionParts';
import { ItemStemView, OptionGrid } from '../../components/figures';
import type { BankPayload, ValidationReport } from '../../content/bank/schema';
import type { ItemPayload } from '../../content/types';
import { QUESTION_TYPES } from '../../content/bank/taxonomy';
import { friendlyError } from '../../lib/supabase';
import { Button, Card, EmptyState, ErrorState, Notice, Spinner, inputCls, useAsync } from '../../ui/kit';

const STATUS_STYLE: Record<string, string> = {
  review_required: 'bg-ochre-soft text-ink', changes_requested: 'bg-brick-soft text-brick', approved: 'bg-mist text-navy',
  published: 'bg-forest-soft text-forest', retired: 'bg-line text-muted', rejected: 'bg-brick-soft text-brick', validation_failed: 'bg-brick-soft text-brick',
};
const Status: React.FC<{ s: string }> = ({ s }) => <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[s] ?? 'bg-line'}`}>{s.replace('_', ' ')}</span>;
const typeTitle = (id: string) => QUESTION_TYPES.find((t) => t.id === id)?.title ?? id;

export const StaffArea: React.FC<{ path: string }> = ({ path }) => {
  const roles = useAsync(() => staffApi.roles(), []);
  if (roles.error) return <ErrorState message={friendlyError(new Error(roles.error))} onRetry={roles.reload} />;
  if (!roles.data) return <Spinner label="Checking reviewer access" />;
  if (!roles.data.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <EmptyState title="No reviewer access">This account does not have a reviewer or author role. An admin grants it from the database with <code>grant_staff_by_email</code>.</EmptyState>
      </div>
    );
  }
  const isReviewer = roles.data.some((r) => r === 'reviewer' || r === 'admin');
  const item = match('/staff/item/:kind/:id/:version', path);
  const tabs = [{ to: '/staff', label: 'Review queue' }, { to: '/staff/coverage', label: 'Coverage' }, { to: '/staff/import', label: 'Import' }];
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-serif font-semibold flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-forest" aria-hidden /> Content review</h1>
        <nav aria-label="Staff" className="flex gap-1">
          {tabs.map((t) => <Link key={t.to} to={t.to} className={`px-3 py-2 rounded-lg text-sm font-semibold ${path === t.to ? 'bg-navy text-white' : 'text-navy hover:bg-navy/5'}`}>{t.label}</Link>)}
        </nav>
      </div>
      <p className="text-xs text-muted">Signed in with role: {roles.data.join(', ')}.{!isReviewer && ' Authors can import and view. Only reviewers can approve or publish.'}</p>
      {item ? <ItemReview kind={item.kind as 'bank' | 'activity'} id={item.id} version={Number(item.version)} canDecide={isReviewer} />
        : path === '/staff/coverage' ? <Coverage />
        : path === '/staff/import' ? <Import />
        : <Queue />}
    </div>
  );
};

// ---------------------------------------------------------------------------
const Queue: React.FC = () => {
  const q = useAsync(() => staffApi.queue(), []);
  const [filter, setFilter] = useState<string>('owner_published');
  if (q.error) return <ErrorState message={friendlyError(new Error(q.error))} onRetry={q.reload} />;
  if (!q.data) return <Spinner label="Loading queue" />;
  const counts = q.data.bank.reduce<Record<string, number>>((m, b) => ({ ...m, [b.status]: (m[b.status] ?? 0) + 1, ...(b.approval_basis === 'owner_instruction' ? { owner_published: (m.owner_published ?? 0) + 1 } : {}) }), {});
  const rows = q.data.bank.filter((b) => filter === 'all' || b.status === filter || (filter === 'owner_published' && b.approval_basis === 'owner_instruction'));
  const legacyPending = q.data.legacy.filter((l) => !l.human_reviewed);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold mr-2">Question bank</h2>
          {['review_required', 'owner_published', 'changes_requested', 'approved', 'published', 'validation_failed', 'rejected', 'retired', 'all'].map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === s ? 'bg-navy text-white border-navy' : 'border-line text-navy'}`}>
              {s.replace('_', ' ')} {s === 'all' ? q.data!.bank.length : counts[s] ?? 0}
            </button>
          ))}
        </div>
        {!rows.length ? <p className="text-sm text-muted">Nothing here.</p> : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted border-b border-line"><th className="p-3">Question</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Source</th><th className="p-3">Batch</th></tr></thead>
              <tbody>
                {rows.map((b: QueueBank) => (
                  <tr key={`${b.id}@${b.version}`} className="border-b border-line last:border-0 hover:bg-navy/5 cursor-pointer" onClick={() => navigate(`/staff/item/bank/${b.id}/${b.version}`)}>
                    <td className="p-3"><Link to={`/staff/item/bank/${b.id}/${b.version}`} className="font-semibold text-navy">{b.title}</Link><span className="block text-xs text-muted">{b.id} v{b.version}</span></td>
                    <td className="p-3">{typeTitle(b.question_type)}{b.needs_semantic_review && <span className="block text-[11px] font-semibold text-brick">needs semantic review</span>}</td>
                    <td className="p-3"><Status s={b.status} />{b.approval_basis === 'owner_instruction' && <span className="block text-[11px] font-semibold text-ochre">owner published, not reviewed</span>}</td>
                    <td className="p-3 text-xs">{b.authoring_source.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-xs">{b.batch_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Live lessons and items awaiting human review <span className="text-sm font-normal text-muted">({legacyPending.length} of {q.data.legacy.length})</span></h2>
        <Notice tone="warn">These are live now. They passed machine validation but no named person has reviewed them yet. Approving keeps them live under your name. Rejecting takes them off the site.</Notice>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted border-b border-line"><th className="p-3">Activity</th><th className="p-3">Kind</th><th className="p-3">Human review</th></tr></thead>
            <tbody>
              {q.data.legacy.map((l) => (
                <tr key={`${l.id}@${l.version}`} className="border-b border-line last:border-0 hover:bg-navy/5 cursor-pointer" onClick={() => navigate(`/staff/item/activity/${l.id}/${l.version}`)}>
                  <td className="p-3"><Link to={`/staff/item/activity/${l.id}/${l.version}`} className="font-semibold text-navy">{l.title}</Link><span className="block text-xs text-muted">{l.id} v{l.version}</span></td>
                  <td className="p-3 text-xs">{l.mode} · {l.activity_type}</td>
                  <td className="p-3">{l.human_reviewed ? <Status s="approved" /> : <Status s="review_required" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
const CHECKS: { key: string; label: string }[] = [
  { key: 'learner_view_checked', label: 'I checked the learner view above, including every option.' },
  { key: 'single_answer_confirmed', label: 'Exactly one option is defensibly correct under the stated rule.' },
  { key: 'age_appropriate', label: 'Wording, vocabulary and difficulty suit the age band.' },
];

const ItemReview: React.FC<{ kind: 'bank' | 'activity'; id: string; version: number; canDecide: boolean }> = ({ kind, id, version, canDecide }) => {
  const d = useAsync(() => staffApi.item(kind, id, version), [kind, id, version]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  if (d.error) return <ErrorState message={friendlyError(new Error(d.error))} onRetry={d.reload} />;
  if (!d.data) return <Spinner label="Loading item" />;
  const it = d.data;

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label); setMsg(null);
    try { await fn(); setMsg({ tone: 'info', text: `${label}: done.` }); setNotes(''); d.reload(); }
    catch (e) { setMsg({ tone: 'error', text: (e as Error).message }); }
    finally { setBusy(null); }
  };

  const allChecks = { ...checks };
  const needsSemantic = kind === 'bank' && it.needs_semantic_review;
  const checklistDone = CHECKS.every((c) => checks[c.key]) && (!needsSemantic || checks.semantic_review_done);
  const history = (it.history ?? []) as ReviewHistory[];

  return (
    <div className="space-y-6">
      <Link to="/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="w-4 h-4" aria-hidden /> Queue</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">{it.title}</h2>
        <Status s={kind === 'bank' ? it.review_status : it.human_reviewed ? 'approved' : 'review_required'} />
        <span className="text-xs text-muted">{id} v{version}</span>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <Card className="p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Learner view (answer marked)</p>
          {kind === 'bank' ? <BankLearnerView it={it} /> : <LegacyLearnerView it={it} />}
        </Card>

        <div className="space-y-4">
          {kind === 'bank' ? <BankKey it={it} /> : <Card className="p-5 space-y-2 text-sm"><p className="font-semibold">Machine validation</p><p className="text-muted">{it.reviewed_by}</p></Card>}

          {canDecide && (
            <Card className="p-5 space-y-3">
              <p className="font-semibold">Decision</p>
              {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
              {(kind === 'activity' ? it.review_status === 'published' && !it.human_reviewed : ['review_required', 'changes_requested'].includes(it.review_status)) && (
                <>
                  {[...CHECKS, ...(needsSemantic ? [{ key: 'semantic_review_done', label: 'I checked the meaning: the word relation is clear and no second answer works.' }] : [])].map((c) => (
                    <label key={c.key} className="flex gap-2 text-sm items-start">
                      <input type="checkbox" className="mt-1" checked={Boolean(checks[c.key])} onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })} /> {c.label}
                    </label>
                  ))}
                  <textarea className={inputCls} rows={2} placeholder="Notes (required to reject or request changes)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!checklistDone} busy={busy === 'Approve'} onClick={() => act('Approve', () => kind === 'bank' ? staffApi.decide(id, version, 'approve', notes, allChecks) : staffApi.decideActivity(id, version, 'approve', notes, allChecks))}>Approve</Button>
                    <Button size="sm" variant="secondary" disabled={!notes.trim()} busy={busy === 'Request changes'} onClick={() => act('Request changes', () => kind === 'bank' ? staffApi.decide(id, version, 'request_changes', notes, {}) : staffApi.decideActivity(id, version, 'request_changes', notes, {}))}>Request changes</Button>
                    <Button size="sm" variant="danger" disabled={!notes.trim()} busy={busy === 'Reject'} onClick={() => act('Reject', () => kind === 'bank' ? staffApi.decide(id, version, 'reject', notes, {}) : staffApi.decideActivity(id, version, 'reject', notes, {}))}>{kind === 'activity' ? 'Reject and take offline' : 'Reject'}</Button>
                  </div>
                </>
              )}
              {kind === 'bank' && it.review_status === 'approved' && <Button busy={busy === 'Publish'} onClick={() => act('Publish', () => staffApi.publish(id, version))}>Publish</Button>}
              {kind === 'bank' && it.approval_basis === 'owner_instruction' && (
                <>
                  <Notice tone="warn">Published on owner instruction ({it.approved_by_label}). Not individually reviewed. Check it and confirm, or retire it.</Notice>
                  {[...CHECKS, ...(needsSemantic ? [{ key: 'semantic_review_done', label: 'I checked the meaning: the word relation is clear and no second answer works.' }] : [])].map((c) => (
                    <label key={c.key} className="flex gap-2 text-sm items-start">
                      <input type="checkbox" className="mt-1" checked={Boolean(checks[c.key])} onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })} /> {c.label}
                    </label>
                  ))}
                  <Button size="sm" disabled={!checklistDone} busy={busy === 'Confirm review'} onClick={() => act('Confirm review', () => staffApi.confirmOwnerPublished(id, version, notes, allChecks))}>Confirm review</Button>
                </>
              )}
              {kind === 'bank' && it.review_status === 'published' && (
                <>
                  <textarea className={inputCls} rows={2} placeholder="Why retire it? (required)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <Button variant="danger" size="sm" disabled={!notes.trim()} busy={busy === 'Retire'} onClick={() => act('Retire', () => staffApi.retire(id, version, notes))}>Retire</Button>
                </>
              )}
              {kind === 'bank' && it.review_status === 'retired' && it.approved_by && (
                <>
                  <textarea className={inputCls} rows={2} placeholder="Why roll back to this version? (required)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <Button size="sm" disabled={!notes.trim()} busy={busy === 'Roll back'} onClick={() => act('Roll back', () => staffApi.rollback(id, version, notes))}>Make this version live again</Button>
                </>
              )}
              {kind === 'bank' && ['rejected', 'validation_failed'].includes(it.review_status) && <p className="text-sm text-muted">This version is closed. Import a fixed copy as version {version + 1}.</p>}
              {kind === 'activity' && it.human_reviewed && <p className="text-sm text-muted">Reviewed by a person. Nothing left to do.</p>}
            </Card>
          )}

          <Card className="p-5 space-y-2 text-sm">
            <p className="font-semibold">History</p>
            {!history.length ? <p className="text-muted">No decisions yet.</p> : (
              <ol className="space-y-2">
                {history.map((h, i) => <li key={i}><span className="font-semibold">{h.decision}</span> · {h.reviewer ?? 'system import'} · {new Date(h.at).toLocaleString()}{h.notes && <span className="block text-muted">{h.notes}</span>}</li>)}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BankLearnerView: React.FC<{ it: any }> = ({ it }) => {
  const p = it.payload as BankPayload;
  return (
    <div className="space-y-4">
      <p className="text-lg font-bold text-navy">{p.prompt}</p>
      <QuestionStem payload={p} explore showReplay />
      <QuestionOptions payload={p} selected={null} onSelect={() => undefined} disabled reveal={{ correct: it.answer_key.correct, chosen: null }} />
      <Notice tone="warn"><span className="font-semibold">Hint shown after the first guess:</span> {p.hint}</Notice>
      <p className="text-xs text-muted">Alt text: {it.accessibility?.alt}{it.accessibility?.relies_on_color ? ' · relies on colour' : ''}</p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BankKey: React.FC<{ it: any }> = ({ it }) => {
  const k = it.answer_key;
  const r = it.validation_report as ValidationReport & { sql_errors?: string[] };
  const ids = (it.payload.options as { id: string }[]).map((o) => o.id);
  return (
    <>
      <Card className="p-5 space-y-3 text-sm">
        <p className="font-semibold">Answer key: {String.fromCharCode(65 + ids.indexOf(k.correct))} ({k.correct})</p>
        <p>{k.explanation.summary}</p>
        <ol className="list-decimal pl-5 text-muted">{k.explanation.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
        <dl className="space-y-1.5">
          {ids.map((o, i) => (
            <div key={o}><dt className="inline font-semibold">{String.fromCharCode(65 + i)}{o === k.correct ? ' ✓' : ''}</dt>{k.distractor_kinds?.[o] && <span className="text-xs text-brick"> [{k.distractor_kinds[o]}]</span>} <dd className="inline">{k.rationales[o]}</dd></div>
          ))}
        </dl>
        {k.semantic_relation && <p><span className="font-semibold">Relation:</span> {k.semantic_relation}</p>}
      </Card>
      <Card className="p-5 space-y-2 text-sm">
        <p className="font-semibold">Validation {r.passed ? <span className="text-forest">passed</span> : <span className="text-brick">failed</span>} <span className="text-xs text-muted font-normal">{r.validator_version}</span></p>
        <p className="text-xs text-muted">Checks: {r.checks?.join(', ')}</p>
        {[...(r.issues ?? []).map((i) => `${i.severity}: ${i.path} ${i.rule}`), ...(r.sql_errors ?? []).map((e) => `sql: ${e}`)].map((x, i) => <p key={i} className="text-xs text-brick">{x}</p>)}
        <p className="text-xs"><span className="font-semibold">Topics:</span> {it.primary_topic}{it.secondary_topics?.length ? `, ${it.secondary_topics.join(', ')}` : ''}</p>
        <p className="text-xs"><span className="font-semibold">Age</span> {it.age_band} · <span className="font-semibold">Difficulty</span> {it.difficulty} · <span className="font-semibold">Reading</span> {it.reading_load}</p>
        <p className="text-xs"><span className="font-semibold">Authoring:</span> {it.authoring?.source?.replace(/_/g, ' ')} by {it.authoring?.author}. {it.authoring?.notes}</p>
        {it.transfer_target && <p className="text-xs"><span className="font-semibold">Transfer:</span> {it.transfer_target}</p>}
      </Card>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LegacyLearnerView: React.FC<{ it: any }> = ({ it }) => {
  if (it.mode === 'lesson') {
    return (
      <div className="space-y-2 text-sm">
        <p>This is a guided lesson. Open it in the Studio to step through it as a child would: <code>/studio/lesson/{it.id}</code>.</p>
        <details><summary className="cursor-pointer font-semibold">Lesson content</summary><pre className="text-xs whitespace-pre-wrap bg-ivory p-3 rounded-xl max-h-96 overflow-auto">{JSON.stringify(it.payload, null, 2)}</pre></details>
        <details><summary className="cursor-pointer font-semibold">Answer key</summary><pre className="text-xs whitespace-pre-wrap bg-ivory p-3 rounded-xl max-h-96 overflow-auto">{JSON.stringify(it.answer_key, null, 2)}</pre></details>
      </div>
    );
  }
  const p = it.payload as ItemPayload;
  const key = it.answer_key.item as { correct: string; explanation: string; feedback: Record<string, string> };
  return (
    <div className="space-y-4">
      <p className="text-lg font-bold text-navy">{p.prompt}</p>
      <ItemStemView item={p} />
      <OptionGrid name="Choices" options={p.options} selected={null} onSelect={() => undefined} disabled reveal={{ correct: key.correct, chosen: null }} />
      <p className="text-sm"><span className="font-semibold">Explanation:</span> {key.explanation}</p>
      <dl className="text-sm space-y-1">{p.options.map((o, i) => <div key={o.id}><dt className="inline font-semibold">{String.fromCharCode(65 + i)}</dt> <dd className="inline">{key.feedback[o.id]}</dd></div>)}</dl>
    </div>
  );
};

// ---------------------------------------------------------------------------
const Coverage: React.FC = () => {
  const d = useAsync(() => staffApi.coverage(), []);
  const [busy, setBusy] = useState(false);
  if (d.error) return <ErrorState message={friendlyError(new Error(d.error))} onRetry={d.reload} />;
  if (!d.data) return <Spinner label="Loading coverage" />;
  const rows = d.data as CoverageRow[];
  const sum = (k: keyof CoverageRow) => rows.reduce((s, r) => s + Number(r[k]), 0);
  const download = async () => {
    setBusy(true);
    try {
      const qs = await staffApi.exportJson(null);
      const blob = new Blob([JSON.stringify({ batch_id: `export-${new Date().toISOString().slice(0, 10)}`, questions: qs }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `heir-question-bank-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted max-w-2xl">Each question counts once, toward its question type. Target is 200 published per type. "Legacy live" are the older 2D items, counted separately until a person reviews them.</p>
        <Button variant="secondary" size="sm" busy={busy} onClick={download}><Download className="w-4 h-4" aria-hidden /> Export all (JSON)</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-line"><th className="p-3">Question type</th><th className="p-3">Engine</th><th className="p-3 text-right">Planned</th><th className="p-3 text-right">Draft</th><th className="p-3 text-right">In review</th><th className="p-3 text-right">Published</th><th className="p-3 text-right">Legacy live (reviewed)</th><th className="p-3 w-40">Progress</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold text-navy">{r.title}<span className="block text-xs font-normal text-muted">{r.domain}</span></td>
                <td className="p-3 text-xs">{r.engine === 'available' ? 'ready' : <span className="text-muted">not built</span>}</td>
                <td className="p-3 text-right">{r.target}</td>
                <td className="p-3 text-right">{r.draft}</td>
                <td className="p-3 text-right">{r.in_review}</td>
                <td className="p-3 text-right font-semibold">{r.published}</td>
                <td className="p-3 text-right">{r.legacy_live ? `${r.legacy_live} (${r.legacy_human_reviewed})` : '–'}</td>
                <td className="p-3"><div className="h-2 rounded-full bg-line overflow-hidden" role="img" aria-label={`${r.published} of ${r.target} published`}><div className="h-full bg-forest" style={{ width: `${Math.min(100, (r.published / r.target) * 100)}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="font-semibold"><td className="p-3">Total</td><td /><td className="p-3 text-right">{sum('target')}</td><td className="p-3 text-right">{sum('draft')}</td><td className="p-3 text-right">{sum('in_review')}</td><td className="p-3 text-right">{sum('published')}</td><td className="p-3 text-right">{sum('legacy_live')} ({sum('legacy_human_reviewed')})</td><td /></tr></tfoot>
        </table>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
const Import: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dryOk, setDryOk] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const j = JSON.parse(text);
      return Array.isArray(j) ? { batch_id: '', questions: j } : j as { batch_id: string; questions: unknown[] };
    } catch (e) { return { error: (e as Error).message }; }
  }, [text]);
  const run = async (dry: boolean) => {
    if (!parsed || 'error' in parsed) return;
    setBusy(dry ? 'dry' : 'commit'); setErr(null);
    try {
      const r = await staffApi.importBatch(parsed, dry);
      setResult(r);
      setDryOk(dry && r.failed === 0 ? text : null);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted max-w-3xl">Paste or load a batch file: <code>{'{ "batch_id": "...", "questions": [...] }'}</code>. Format: docs/question-bank.md. Always run a dry run first. Imported questions wait for review; nothing is published by importing.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line bg-paper text-sm font-semibold text-navy cursor-pointer">
          <FileUp className="w-4 h-4" aria-hidden /> Load file
          <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setResult(null); setDryOk(null); } }} />
        </label>
        {parsed && !('error' in parsed) && <span className="text-sm text-muted">{parsed.questions?.length ?? 0} questions · batch {parsed.batch_id || <span className="text-brick">missing batch_id</span>}</span>}
      </div>
      <textarea className={`${inputCls} font-mono text-xs`} rows={10} value={text} onChange={(e) => { setText(e.target.value); setResult(null); setDryOk(null); }} placeholder="Paste batch JSON" />
      {parsed && 'error' in parsed && <Notice tone="error">Not valid JSON: {parsed.error}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
      <div className="flex gap-2">
        <Button variant="secondary" disabled={!parsed || 'error' in parsed} busy={busy === 'dry'} onClick={() => run(true)}>Dry run</Button>
        <Button disabled={dryOk !== text} busy={busy === 'commit'} onClick={() => run(false)}>Import for review</Button>
      </div>
      {result && (
        <Card className="p-5 space-y-3 text-sm">
          <p className="font-semibold">{result.dry_run ? 'Dry run' : 'Imported'}: {result.total} questions · {result.failed} failed · {result.already_imported} already imported{!result.dry_run && ` · ${result.inserted} stored`} <span className="text-xs text-muted font-normal">{result.validator_version}</span></p>
          {result.failed > 0 && <Notice tone="warn">Failed questions are stored as "validation failed" on import so authors can see them. Fix and re-import as a new version.</Notice>}
          <ul className="space-y-1">
            {result.results.map((r) => (
              <li key={r.question}>
                <span className={`font-semibold ${r.result === 'failed' ? 'text-brick' : 'text-forest'}`}>{r.result}</span> {r.question}{r.needs_semantic_review ? ' · needs semantic review' : ''}
                {r.errors?.length ? <ul className="pl-5 text-xs text-brick list-disc">{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
