import React, { useState } from 'react';
import { ArrowRight, BarChart3, CreditCard, Settings, UserPlus, PlayCircle, Lightbulb, Target, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Link, navigate } from '../../app/router';
import { parentApi, remoteBackend, type ParentReport } from '../../services/remote';
import { friendlyError } from '../../lib/supabase';
import { PRICING, SUPPORT_EMAIL } from '../../config';
import { STATUS_LABEL, type SkillStatus } from '../../engine/learning';
import { AFFILIATION_NOTE } from '../../content/coverage';
import { Avatar, Button, Card, EmptyState, ErrorState, Eyebrow, Notice, Spinner, useAsync } from '../../ui/kit';
import { Modal } from '../../components/ParentGate';
import { GoalFields, ProfileFields, RoutineFields, draftErrors, emptyDraft, toUpsert, type ChildDraft } from './ChildForm';
import type { GoalId } from '../../content/coverage';

const MISCONCEPTION_LABEL: Record<string, string> = {
  wrong_direction: 'Turns or counts the opposite way',
  flipped_instead_of_turned: 'Flips when the rule turns',
  turned_instead_of_flipped: 'Turns when the rule flips',
  confuses_reflection_and_rotation: 'Mixes up turning and flipping',
  wrong_mirror_axis: 'Flips across the wrong mirror line',
  no_change_applied: 'Picks an answer where nothing changed',
  wrong_step_size: 'Applies the rule too much or too little',
  copied_neighbor: 'Copies a nearby picture instead of applying the rule',
  tracks_wrong_attribute: 'Follows a feature that does not matter',
  partial_rule: 'Applies only one of two rules',
  treats_rotation_as_different: 'Treats a turned shape as a different shape',
  odd_count_missed: 'Distracted by colour when counting',
  sees_no_rule: 'Does not see a rule yet',
};

const ChildSwitcher: React.FC = () => {
  const app = useApp();
  if (app.children.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose child">
      {app.children.map((c) => (
        <button key={c.id} role="tab" aria-selected={app.activeChild?.id === c.id} onClick={() => app.setActiveChild(c.id)}
          className={`inline-flex items-center gap-2 min-h-11 pl-1.5 pr-4 rounded-full border-2 text-sm font-semibold ${app.activeChild?.id === c.id ? 'border-navy bg-paper text-navy' : 'border-line bg-paper text-muted'}`}>
          <Avatar avatar={c.avatar} color={c.avatar_color} size={32} /> {c.nickname}
        </button>
      ))}
    </div>
  );
};

const useReport = (childId: string | undefined) =>
  useAsync(async () => {
    if (!childId) return null;
    const [report, catalog] = await Promise.all([parentApi.report(childId), remoteBackend.catalog()]);
    return { report, catalog };
  }, [childId]);

const titleOf = (catalog: Awaited<ReturnType<typeof remoteBackend.catalog>>, id: string | null) =>
  !id ? '' : catalog.lessons.find((l) => l.meta.id === id)?.payload.title ?? catalog.items.find((i) => i.meta.id === id)?.meta.title ?? id;

// ---------------------------------------------------------------------------
// P06 Parent dashboard
// ---------------------------------------------------------------------------
export const ParentDashboard: React.FC = () => {
  const app = useApp();
  const child = app.activeChild;
  const data = useReport(child?.id);
  const [busy, setBusy] = useState(false);

  if (!app.children.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState title={`Welcome${app.displayName ? `, ${app.displayName}` : ''}`} action={<Button onClick={() => navigate('/parent/onboarding')}><UserPlus className="w-4 h-4" aria-hidden /> Add your child</Button>}>
          Set up a child profile to open their Studio. It takes about two minutes.
        </EmptyState>
      </div>
    );
  }

  const r = data.data?.report;
  const cat = data.data?.catalog;
  const lessonsDone = r?.recent_sessions.filter((s) => s.mode === 'lesson').length ?? 0;
  const hintTotal = (r?.hint_reliance.discover_with_hints ?? 0) + (r?.hint_reliance.discover_independent ?? 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Eyebrow>Parent dashboard</Eyebrow>
          <h1 className="text-3xl font-serif font-semibold">{child?.nickname}’s progress</h1>
          <ChildSwitcher />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button busy={busy} onClick={async () => { if (!child) return; setBusy(true); try { await app.enterChildMode(child.id); } catch (e) { alert(friendlyError(e)); setBusy(false); } }}>
            <PlayCircle className="w-4 h-4" aria-hidden /> Open {child?.nickname}’s Studio
          </Button>
          <Button variant="secondary" onClick={() => navigate('/parent/onboarding')}><UserPlus className="w-4 h-4" aria-hidden /> Add child</Button>
        </div>
      </div>

      {data.error ? <ErrorState message={friendlyError(new Error(data.error))} onRetry={data.reload} /> : !r || !cat ? <Spinner label="Loading progress" /> : (
        <>
          {!r.baseline && lessonsDone === 0 && (
            <Notice>{child?.nickname} has not started yet. The first mission is the Discovery Quest. Open the Studio and hand the device over.</Notice>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Independent transfers this week</p>
              <p className="text-4xl font-serif font-semibold text-navy">{r.independent_transfers_this_week}</p>
              <p className="text-xs text-muted">New problems solved on the first try, with no hints.</p>
            </Card>
            <Card className="p-5 space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Sessions (last 8 weeks)</p>
              <p className="text-4xl font-serif font-semibold text-navy">{r.weekly.reduce((s, w) => s + w.sessions, 0)}</p>
              <p className="text-xs text-muted">{r.weekly.reduce((s, w) => s + w.minutes, 0)} minutes in total</p>
            </Card>
            <Card className="p-5 space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Rules found without hints</p>
              <p className="text-4xl font-serif font-semibold text-navy">{hintTotal ? `${r.hint_reliance.discover_independent}/${hintTotal}` : '–'}</p>
              <p className="text-xs text-muted">{hintTotal < 3 ? 'Not enough lessons yet to read a pattern.' : 'Lessons where the rule was found before any hint.'}</p>
            </Card>
            <Card className="p-5 space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Next step</p>
              <p className="text-base font-semibold text-navy">{r.recommendation ? titleOf(cat, r.recommendation.activity_id) || 'Keep exploring' : 'Discovery Quest'}</p>
              <p className="text-xs text-muted">{r.recommendation?.reason ?? 'Short, untimed puzzles that set a provisional starting point.'}</p>
            </Card>
          </div>

          {r.baseline && (
            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-serif font-semibold">Discovery Quest (provisional)</h2>
              <p className="text-sm text-ink">
                {child?.nickname} answered {r.baseline.answered} of {r.baseline.total} puzzles; {r.baseline.correct} matched the rule.
                This is a starting point for choosing lessons. It is not a psychometric score and does not predict test results.
              </p>
              <div className="grid sm:grid-cols-4 gap-3">
                {Object.entries((r.baseline.items ?? []).reduce<Record<string, { c: number; t: number }>>((acc, i) => {
                  const k = (i as { domain?: string }).domain ?? 'other';
                  acc[k] = acc[k] ?? { c: 0, t: 0 };
                  acc[k].t += 1;
                  if (i.is_correct) acc[k].c += 1;
                  return acc;
                }, {})).map(([dom, v]) => (
                  <div key={dom} className="rounded-xl border border-line p-3">
                    <p className="text-xs text-muted capitalize">{dom}</p>
                    <p className="text-lg font-semibold text-navy">{v.c} of {v.t}</p>
                    <p className="text-[11px] text-muted">{v.t < 3 ? 'Very little evidence' : 'Some evidence'}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-serif font-semibold">Skills</h2>
              <Link to={`/parent/report/${child?.id}`} className="text-sm font-semibold text-navy underline inline-flex items-center gap-1">Full skill report <ArrowRight className="w-4 h-4" aria-hidden /></Link>
            </div>
            {r.skills.length === 0 ? (
              <p className="text-sm text-muted">No skill evidence yet. Skills appear after the first lesson or practice set.</p>
            ) : (
              <ul className="divide-y divide-line">
                {r.skills.map((s) => (
                  <li key={s.skill_id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-navy">{s.title}</span>
                    <span className="text-sm text-muted">{STATUS_LABEL[s.status as SkillStatus] ?? s.status} · based on {s.evidence_count} piece{s.evidence_count === 1 ? '' : 's'} of evidence</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link to={`/parent/report/${child?.id}`} className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><BarChart3 className="w-5 h-5 text-forest" aria-hidden /><span className="block mt-2 font-semibold text-navy">Skill report</span></Link>
            <Link to="/parent/billing" className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><CreditCard className="w-5 h-5 text-ochre" aria-hidden /><span className="block mt-2 font-semibold text-navy">Plan and billing</span></Link>
            <Link to="/parent/settings" className="rounded-2xl border border-line bg-paper p-5 hover:border-navy/40"><Settings className="w-5 h-5 text-navy" aria-hidden /><span className="block mt-2 font-semibold text-navy">Children, privacy and settings</span></Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// P07 Skill report
// ---------------------------------------------------------------------------
export const SkillReport: React.FC<{ childId: string }> = ({ childId }) => {
  const app = useApp();
  const child = app.children.find((c) => c.id === childId);
  const data = useReport(childId);
  if (!child) return <ErrorState message="That child profile was not found." />;
  if (data.error) return <ErrorState message={friendlyError(new Error(data.error))} onRetry={data.reload} />;
  if (!data.data) return <Spinner label="Loading report" />;
  const { report: r, catalog } = data.data as { report: ParentReport; catalog: Awaited<ReturnType<typeof remoteBackend.catalog>> };
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '–');
  const maxSessions = Math.max(1, ...r.weekly.map((w) => w.sessions));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Eyebrow>Skill report</Eyebrow>
        <h1 className="text-3xl font-serif font-semibold">{child.nickname}</h1>
        <p className="text-sm text-muted">Generated {new Date(r.generated_at).toLocaleString()}. Every status shows how much evidence it rests on.</p>
      </div>

      <Notice>
        How to read this: an <strong>independent transfer</strong> is a brand-new problem solved on the first try with no hints. <strong>Assisted</strong> means solved after a hint or a retry.
        A skill needs at least 3 pieces of evidence before we describe it. This report never shows IQ, percentiles, admission chances or official test scores.
      </Notice>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <caption className="sr-only">Skill evidence</caption>
          <thead className="bg-ivory text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Skill</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Independent</th>
              <th className="px-4 py-3">Assisted</th>
              <th className="px-4 py-3">Not yet</th>
              <th className="px-4 py-3">Practice</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Window</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {r.skills.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted">No evidence yet.</td></tr>
            )}
            {r.skills.map((s) => (
              <tr key={s.skill_id}>
                <td className="px-4 py-3 font-semibold text-navy">{s.title}</td>
                <td className="px-4 py-3">{STATUS_LABEL[s.status as SkillStatus] ?? s.status}</td>
                <td className="px-4 py-3">{s.independent_transfers}</td>
                <td className="px-4 py-3">{s.assisted_transfers}</td>
                <td className="px-4 py-3">{s.failed_transfers}</td>
                <td className="px-4 py-3">{s.practice_total ? `${s.practice_correct}/${s.practice_total}` : '–'}</td>
                <td className="px-4 py-3">{s.evidence_count}{s.evidence_count < 3 && <span className="block text-[11px] text-muted">insufficient</span>}</td>
                <td className="px-4 py-3 text-muted">{fmt(s.first_evidence_at)} – {fmt(s.last_evidence_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-serif font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-forest" aria-hidden /> Weekly activity</h2>
          {r.weekly.length === 0 ? <p className="text-sm text-muted">No completed sessions yet.</p> : (
            <ul className="space-y-2" aria-label="Sessions per week">
              {r.weekly.map((w) => (
                <li key={w.week_start} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-muted">wk of {new Date(w.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="h-3 rounded-full bg-mist overflow-hidden" aria-hidden><span className="block h-full bg-navy rounded-full" style={{ width: `${(w.sessions / maxSessions) * 100}%` }} /></span>
                  <span>{w.sessions} sessions · {w.independent_transfers} independent</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-serif font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-ochre" aria-hidden /> Patterns in wrong answers</h2>
          {r.misconceptions.length === 0 ? <p className="text-sm text-muted">None recorded yet.</p> : (
            <ul className="space-y-2 text-sm">
              {r.misconceptions.map((m) => (
                <li key={m.tag} className="flex justify-between gap-3"><span>{MISCONCEPTION_LABEL[m.tag] ?? m.tag.replace(/_/g, ' ')}</span><span className="text-muted">{m.count}×{m.count < 2 ? ' (once)' : ''}</span></li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">One wrong answer is not a pattern. Repeated ones guide the next lesson automatically.</p>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-serif font-semibold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-ochre" aria-hidden /> Hint use</h2>
        <p className="text-sm text-ink">
          Rule found without a hint in {r.hint_reliance.discover_independent} lesson{r.hint_reliance.discover_independent === 1 ? '' : 's'}; with a hint in {r.hint_reliance.discover_with_hints}.
          Hints are part of learning. We track them so that help is never counted as independent success.
        </p>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-serif font-semibold">Recent sessions</h2>
        {r.recent_sessions.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ul className="divide-y divide-line text-sm">
            {r.recent_sessions.map((s) => (
              <li key={s.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-navy">{s.mode === 'lesson' ? titleOf(catalog, s.activity_id) : s.mode === 'baseline' ? 'Discovery Quest' : `Practice (${s.timed ? 'timed' : 'untimed'})`}</span>
                <span className="text-muted">
                  {s.mode === 'lesson' ? ({ independent: 'Independent transfer', assisted: 'Assisted transfer', not_yet: 'Transfer not yet' } as Record<string, string>)[s.outcome ?? ''] ?? '' : `${s.correct}/${s.total}`}
                  {' · '}{new Date(s.completed_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-muted">{AFFILIATION_NOTE}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// P08 Billing
// ---------------------------------------------------------------------------
export const Billing: React.FC = () => {
  const data = useAsync(() => parentApi.billing(), []);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const status = new URLSearchParams(window.location.search).get('checkout');
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Eyebrow>Plan and billing</Eyebrow>
        <h1 className="text-3xl font-serif font-semibold">Your plan</h1>
      </div>
      {status === 'success' && <Notice>Thank you. Your plan updates as soon as the payment provider confirms the payment.</Notice>}
      {data.error ? <ErrorState message={friendlyError(new Error(data.error))} onRetry={data.reload} /> : !data.data ? <Spinner /> : (
        <Card className="p-6 space-y-1">
          <p className="text-sm text-muted">Current plan</p>
          <p className="text-2xl font-serif font-semibold text-navy">{data.data.plan === 'free' ? 'Free' : 'Family (monthly)'}</p>
          <p className="text-sm text-muted">Status: {data.data.status}{data.data.current_period_end ? ` · renews ${new Date(data.data.current_period_end).toLocaleDateString()}` : ''}{data.data.cancel_at_period_end ? ' · cancels at period end' : ''}</p>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-3">
          <h2 className="text-xl font-serif font-semibold">Free</h2>
          <p className="text-3xl font-serif font-semibold text-navy">$0</p>
          <ul className="text-sm text-ink space-y-1.5 list-disc pl-5">
            <li>Discovery Quest</li><li>All current lessons and practice during early access</li><li>Parent dashboard and skill report</li>
          </ul>
        </Card>
        <Card className="p-6 space-y-3 border-navy">
          <h2 className="text-xl font-serif font-semibold">Family</h2>
          <p className="text-3xl font-serif font-semibold text-navy">${PRICING.familyMonthly}<span className="text-base text-muted"> / month</span></p>
          <ul className="text-sm text-ink space-y-1.5 list-disc pl-5">
            <li>Up to 6 children</li><li>New lessons and practice as they are published</li><li>Cancel any time. Access continues to the end of the paid month.</li>
          </ul>
          <Button busy={busy} onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              const r = await parentApi.checkout();
              if (r.url) window.location.href = r.url;
              else setMsg(r.error === 'parent_gate_required' ? 'Please re-enter your parent PIN and try again.' : 'Paid plans are not open yet. Everything is free during early access.');
            } catch (e) { setMsg(friendlyError(e)); } finally { setBusy(false); }
          }}>Choose Family</Button>
          {msg && <Notice tone="warn">{msg}</Notice>}
        </Card>
      </div>
      <p className="text-xs text-muted">Payments are handled by a PCI-compliant hosted checkout. Card details never touch our servers. Plan changes take effect only after the payment provider confirms them. Questions: {SUPPORT_EMAIL}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Settings: children, privacy, consent, deletion
// ---------------------------------------------------------------------------
export const ParentSettingsView: React.FC = () => {
  const app = useApp();
  const consents = useAsync(() => parentApi.consents(), []);
  const audit = useAsync(() => parentApi.auditLog(), []);
  const [editing, setEditing] = useState<{ id: string; d: ChildDraft } | null>(null);
  const [del, setDel] = useState<{ kind: 'child'; id: string; name: string } | { kind: 'account' } | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [pin, setPin] = useState('');
  const latestReminder = consents.data?.find((c) => c.consent_type === 'reminder_emails');

  const startEdit = async (id: string) => {
    const c = app.children.find((x) => x.id === id)!;
    const setup = await parentApi.childSetup(id);
    const s = setup.schedule as null | { session_minutes: number; preferred_days: string[]; reminders_opt_in: boolean; audio_enabled: boolean; reduced_motion: boolean };
    setEditing({ id, d: { ...emptyDraft(), nickname: c.nickname, age: c.age, grade: c.grade, avatar: c.avatar, avatarColor: c.avatar_color,
      goals: (setup.goals.length ? setup.goals : ['general']) as GoalId[], sessionMinutes: s?.session_minutes ?? 15, days: s?.preferred_days ?? [],
      reminders: s?.reminders_opt_in ?? false, audio: s?.audio_enabled ?? true, reducedMotion: s?.reduced_motion ?? false } });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Eyebrow>Settings</Eyebrow>
        <h1 className="text-3xl font-serif font-semibold">Children, privacy and account</h1>
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold">Children</h2>
          <Button variant="secondary" size="sm" onClick={() => navigate('/parent/onboarding')}><UserPlus className="w-4 h-4" aria-hidden /> Add</Button>
        </div>
        <ul className="divide-y divide-line">
          {app.children.map((c) => (
            <li key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-3"><Avatar avatar={c.avatar} color={c.avatar_color} size={36} /> <span><span className="font-semibold text-navy">{c.nickname}</span><span className="block text-xs text-muted">Age {c.age} · {c.grade === 'K' ? 'Kindergarten' : `Grade ${c.grade}`}</span></span></span>
              <span className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => startEdit(c.id)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => { setConfirmText(''); setDel({ kind: 'child', id: c.id, name: c.nickname }); }}>Delete data</Button>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold">Parent PIN</h2>
        <p className="text-sm text-muted">Locks reports, billing and settings while your child uses the Studio.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm font-semibold text-navy">New 4-digit PIN
            <input className="block mt-1 w-32 rounded-xl border border-line bg-paper px-3 py-2.5" inputMode="numeric" type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          </label>
          <Button variant="secondary" disabled={pin.length !== 4} onClick={async () => {
            try { await parentApi.setPin(pin); setPin(''); setMsg({ tone: 'info', text: 'PIN updated.' }); } catch (e) { setMsg({ tone: 'error', text: friendlyError(e) }); }
          }}>Change PIN</Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-serif font-semibold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-forest" aria-hidden /> Privacy and consent</h2>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 w-5 h-5 accent-navy" checked={Boolean(latestReminder?.granted)}
            onChange={async (e) => { try { await parentApi.setReminderConsent(e.target.checked); consents.reload(); } catch (err) { setMsg({ tone: 'error', text: friendlyError(err) }); } }} />
          <span>Reminder emails to me (parent only)</span>
        </label>
        <div>
          <h3 className="text-sm font-semibold text-navy mb-2">Consent history</h3>
          {consents.loading ? <Spinner /> : (
            <ul className="text-xs text-muted space-y-1">
              {consents.data?.map((c, i) => <li key={i}>{new Date(c.created_at).toLocaleString()} · {c.consent_type.replace(/_/g, ' ')} · {c.granted ? 'granted' : 'withdrawn'} · v{c.document_version}</li>)}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy mb-2">Recent account activity</h3>
          {audit.loading ? <Spinner /> : (
            <ul className="text-xs text-muted space-y-1 max-h-48 overflow-auto">
              {audit.data?.map((a, i) => <li key={i}>{new Date(a.created_at).toLocaleString()} · {a.action}</li>)}
            </ul>
          )}
        </div>
        <p className="text-xs text-muted">Read the <Link to="/privacy" className="underline">privacy policy</Link>. Questions or a copy of your data: {SUPPORT_EMAIL}.</p>
      </Card>

      <Card className="p-6 space-y-3 border-brick/40">
        <h2 className="text-xl font-serif font-semibold text-brick">Delete account</h2>
        <p className="text-sm text-ink">Permanently deletes your account, every child profile and all learning records. This cannot be undone.</p>
        <Button variant="danger" onClick={() => { setConfirmText(''); setDel({ kind: 'account' }); }}>Delete my account</Button>
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} label="Edit child">
        {editing && (
          <div className="space-y-5 max-h-[75vh] overflow-auto pr-1">
            <h2 className="text-xl font-serif font-semibold">Edit {editing.d.nickname}</h2>
            <ProfileFields d={editing.d} set={(p) => setEditing((e) => e && { ...e, d: { ...e.d, ...p } })} errors={draftErrors(editing.d)} />
            <GoalFields d={editing.d} set={(p) => setEditing((e) => e && { ...e, d: { ...e.d, ...p } })} />
            <RoutineFields d={editing.d} set={(p) => setEditing((e) => e && { ...e, d: { ...e.d, ...p } })} />
            <Button className="w-full" busy={busy} disabled={Object.keys(draftErrors(editing.d)).length > 0} onClick={async () => {
              setBusy(true);
              try { await parentApi.upsertChild(toUpsert(editing.id, editing.d)); await app.refresh(); setEditing(null); setMsg({ tone: 'info', text: 'Saved.' }); }
              catch (e) { setMsg({ tone: 'error', text: friendlyError(e) }); } finally { setBusy(false); }
            }}>Save</Button>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(del)} onClose={() => setDel(null)} label="Confirm deletion">
        {del && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-semibold text-brick">{del.kind === 'child' ? `Delete ${del.name}’s data?` : 'Delete your account?'}</h2>
            <p className="text-sm text-ink">{del.kind === 'child' ? 'This removes the profile, sessions, answers and reports for this child. A record that a deletion happened (with no child details) is kept for audit.' : 'This removes everything. You will be signed out.'}</p>
            <label className="block text-sm font-semibold text-navy">Type DELETE to confirm
              <input className="block mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </label>
            <Button variant="danger" className="w-full" busy={busy} disabled={confirmText !== 'DELETE'} onClick={async () => {
              setBusy(true);
              try {
                if (del.kind === 'child') { await parentApi.deleteChild(del.id); await app.refresh(); setMsg({ tone: 'info', text: 'Deleted.' }); audit.reload(); }
                else { await parentApi.deleteAccount(); await app.signOut(); }
                setDel(null);
              } catch (e) { setMsg({ tone: 'error', text: friendlyError(e) }); setDel(null); } finally { setBusy(false); }
            }}>Delete permanently</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
