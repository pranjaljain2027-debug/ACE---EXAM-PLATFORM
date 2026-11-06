import React from 'react';
import { GOALS, type GoalId } from '../../content/coverage';
import { AVATARS, AVATAR_COLORS, Avatar, Field, inputCls } from '../../ui/kit';

export interface ChildDraft {
  nickname: string;
  age: number;
  grade: string;
  avatar: string;
  avatarColor: string;
  goals: GoalId[];
  sessionMinutes: number;
  days: string[];
  reminders: boolean;
  audio: boolean;
  reducedMotion: boolean;
}

export const emptyDraft = (): ChildDraft => ({
  nickname: '', age: 9, grade: '4', avatar: 'owl', avatarColor: AVATAR_COLORS[0], goals: ['general'],
  sessionMinutes: 15, days: [], reminders: false, audio: true, reducedMotion: false,
});

export const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function draftErrors(d: ChildDraft): Partial<Record<'nickname' | 'goals', string>> {
  const e: Partial<Record<'nickname' | 'goals', string>> = {};
  if (!d.nickname.trim()) e.nickname = 'Add a nickname.';
  else if (d.nickname.trim().length > 24) e.nickname = 'Keep it to 24 characters.';
  if (!d.goals.length) e.goals = 'Choose at least one goal.';
  return e;
}

export const ProfileFields: React.FC<{ d: ChildDraft; set: (p: Partial<ChildDraft>) => void; errors?: ReturnType<typeof draftErrors> }> = ({ d, set, errors = {} }) => (
  <div className="space-y-5">
    <Field label="Nickname" htmlFor="cf-nick" hint="A first name or nickname is enough. Please do not use a full legal name." error={errors.nickname}>
      <input id="cf-nick" className={inputCls} value={d.nickname} maxLength={24} onChange={(e) => set({ nickname: e.target.value })} autoComplete="off" />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Age" htmlFor="cf-age" hint={d.age < 8 || d.age > 10 ? 'Lessons are designed for ages 8–10.' : undefined}>
        <select id="cf-age" className={inputCls} value={d.age} onChange={(e) => set({ age: Number(e.target.value) })}>
          {[6, 7, 8, 9, 10, 11, 12].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
      <Field label="Grade" htmlFor="cf-grade">
        <select id="cf-grade" className={inputCls} value={d.grade} onChange={(e) => set({ grade: e.target.value })}>
          {GRADES.map((g) => <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>)}
        </select>
      </Field>
    </div>
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-navy">Avatar</legend>
      <div className="flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button key={a} type="button" aria-pressed={d.avatar === a} aria-label={a} onClick={() => set({ avatar: a })}
            className={`rounded-full p-1 border-2 ${d.avatar === a ? 'border-navy' : 'border-transparent'}`}>
            <Avatar avatar={a} color={d.avatarColor} size={44} label={a} />
          </button>
        ))}
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Avatar colour">
        {AVATAR_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={d.avatarColor === c} aria-label={`Colour ${c}`} onClick={() => set({ avatarColor: c })}
            className={`w-9 h-9 rounded-full border-2 ${d.avatarColor === c ? 'border-navy ring-2 ring-navy/20' : 'border-white'}`} style={{ backgroundColor: c }} />
        ))}
      </div>
    </fieldset>
  </div>
);

export const GoalFields: React.FC<{ d: ChildDraft; set: (p: Partial<ChildDraft>) => void; error?: string }> = ({ d, set, error }) => (
  <fieldset className="space-y-3">
    <legend className="text-sm font-semibold text-navy">Goals (choose any)</legend>
    {GOALS.map((g) => {
      const on = d.goals.includes(g.id);
      return (
        <label key={g.id} className={`block rounded-xl border-2 p-4 cursor-pointer ${on ? 'border-navy bg-mist/30' : 'border-line bg-paper'}`}>
          <span className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 accent-navy" checked={on}
              onChange={() => set({ goals: on ? d.goals.filter((x) => x !== g.id) : [...d.goals, g.id] })} />
            <span className="font-semibold text-navy">{g.title}</span>
          </span>
          <span className="block mt-2 text-sm text-ink"><strong>Covers:</strong> {g.covers.join('; ')}.</span>
          <span className="block mt-1 text-sm text-muted"><strong>Not covered:</strong> {g.notCovered.join('; ')}.</span>
        </label>
      );
    })}
    {d.goals.length > 1 && <p className="text-xs text-muted">Shared skills are taught once. Picking several goals does not repeat lessons.</p>}
    {error && <p className="text-xs text-brick" role="alert">{error}</p>}
  </fieldset>
);

export const RoutineFields: React.FC<{ d: ChildDraft; set: (p: Partial<ChildDraft>) => void }> = ({ d, set }) => (
  <div className="space-y-5">
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-navy">Session length</legend>
      <div className="flex gap-2">
        {[10, 15, 20].map((m) => (
          <button key={m} type="button" aria-pressed={d.sessionMinutes === m} onClick={() => set({ sessionMinutes: m })}
            className={`min-h-11 px-5 rounded-full border-2 text-sm font-semibold ${d.sessionMinutes === m ? 'border-navy bg-mist/40 text-navy' : 'border-line bg-paper'}`}>{m} min</button>
        ))}
      </div>
    </fieldset>
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-navy">Preferred days (optional)</legend>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const on = d.days.includes(day);
          return (
            <button key={day} type="button" aria-pressed={on} onClick={() => set({ days: on ? d.days.filter((x) => x !== day) : [...d.days, day] })}
              className={`min-h-11 w-14 rounded-full border-2 text-sm font-semibold ${on ? 'border-navy bg-mist/40 text-navy' : 'border-line bg-paper'}`}>{day}</button>
          );
        })}
      </div>
    </fieldset>
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 w-5 h-5 accent-navy" checked={d.reminders} onChange={(e) => set({ reminders: e.target.checked })} />
      <span>Remind me (the parent) on these days. <span className="text-muted">Reminder emails are not switched on yet. We will save your choice.</span></span>
    </label>
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 w-5 h-5 accent-navy" checked={d.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} />
      <span>Reduce motion and animations in the Studio</span>
    </label>
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 w-5 h-5 accent-navy" checked={d.audio} onChange={(e) => set({ audio: e.target.checked })} />
      <span>Allow sound <span className="text-muted">(no audio is used yet)</span></span>
    </label>
  </div>
);

export const toUpsert = (id: string | null, d: ChildDraft) => ({
  id,
  nickname: d.nickname.trim(),
  age: d.age,
  grade: d.grade,
  avatar: d.avatar,
  avatarColor: d.avatarColor,
  goals: d.goals,
  schedule: { session_minutes: d.sessionMinutes, preferred_days: d.days, reminders_opt_in: d.reminders, audio_enabled: d.audio, reduced_motion: d.reducedMotion },
});
