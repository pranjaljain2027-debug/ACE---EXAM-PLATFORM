import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { parentApi } from '../../services/remote';
import { friendlyError } from '../../lib/supabase';
import { navigate } from '../../app/router';
import { AFFILIATION_NOTE } from '../../content/coverage';
import { Avatar, Button, Card, Field, Notice, inputCls } from '../../ui/kit';
import { GoalFields, ProfileFields, RoutineFields, draftErrors, emptyDraft, toUpsert, type ChildDraft } from './ChildForm';

/** P03 child profile -> P04 goals -> P05 routine -> parent PIN -> hand-off to the Studio (C02 baseline). */
export const Onboarding: React.FC = () => {
  const app = useApp();
  const needsPin = !app.gate?.has_pin;
  const steps = ['Child', 'Goals', 'Routine', ...(needsPin ? ['Parent PIN'] : []), 'Ready'];
  const [step, setStep] = useState(0);
  const [d, setD] = useState<ChildDraft>(emptyDraft());
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const set = (p: Partial<ChildDraft>) => setD((x) => ({ ...x, ...p }));
  const errors = draftErrors(d);
  const name = steps[step];

  const next = async () => {
    setError(null);
    setTouched(true);
    if (name === 'Child' && errors.nickname) return;
    if (name === 'Goals' && errors.goals) return;
    if (name === 'Routine') {
      setBusy(true);
      try {
        const id = await parentApi.upsertChild(toUpsert(childId, d));
        setChildId(id);
        await app.refresh();
      } catch (e) {
        setBusy(false);
        return setError(friendlyError(e));
      }
      setBusy(false);
    }
    if (name === 'Parent PIN') {
      if (!/^\d{4}$/.test(pin)) return setError('Choose 4 digits.');
      if (pin !== pin2) return setError('The two PINs do not match.');
      setBusy(true);
      try {
        await parentApi.setPin(pin);
        await app.refreshGate();
      } catch (e) {
        setBusy(false);
        return setError(friendlyError(e));
      }
      setBusy(false);
    }
    setTouched(false);
    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <ol className="flex flex-wrap gap-2" aria-label="Setup steps">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${i === step ? 'bg-navy text-white' : i < step ? 'bg-forest-soft text-forest' : 'bg-paper border border-line text-muted'}`}>
            {i < step && <Check className="w-3.5 h-3.5" aria-hidden />} {i + 1}. {s}
          </li>
        ))}
      </ol>

      <Card className="p-6 sm:p-8 space-y-6">
        {name === 'Child' && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-semibold">Tell us about your child</h1>
              <p className="text-sm text-muted mt-1">We only ask for what the Studio needs. No full name, no birthday, no photo.</p>
            </div>
            <ProfileFields d={d} set={set} errors={touched ? errors : {}} />
          </>
        )}
        {name === 'Goals' && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-semibold">What would you like to focus on?</h1>
              <p className="text-sm text-muted mt-1">Each goal lists exactly what we cover today and what we do not.</p>
            </div>
            <GoalFields d={d} set={set} error={touched ? errors.goals : undefined} />
            <Notice>{AFFILIATION_NOTE}</Notice>
          </>
        )}
        {name === 'Routine' && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-semibold">A routine that fits (optional)</h1>
              <p className="text-sm text-muted mt-1">Short, regular sessions work best. You can change this any time.</p>
            </div>
            <RoutineFields d={d} set={set} />
          </>
        )}
        {name === 'Parent PIN' && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-semibold">Set a parent PIN</h1>
              <p className="text-sm text-muted mt-1">The Studio locks while your child uses it. This PIN opens reports, billing and settings again.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="4-digit PIN" htmlFor="pin1">
                <input id="pin1" className={inputCls} inputMode="numeric" type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoComplete="new-password" />
              </Field>
              <Field label="Repeat PIN" htmlFor="pin2">
                <input id="pin2" className={inputCls} inputMode="numeric" type="password" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} autoComplete="new-password" />
              </Field>
            </div>
          </>
        )}
        {name === 'Ready' && (
          <div className="text-center space-y-4">
            <Avatar avatar={d.avatar} color={d.avatarColor} size={72} label={`${d.nickname}'s avatar`} />
            <h1 className="text-2xl font-serif font-semibold">{d.nickname}’s Studio is ready</h1>
            <p className="text-sm text-ink max-w-md mx-auto">
              The first mission is a short Discovery Quest: about 10 untimed shape puzzles with no hints and no score shown.
              It gives us a provisional starting point, not a test result. Hand the device over when you are ready.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" busy={busy} onClick={async () => {
                if (!childId) return;
                setBusy(true);
                try { await app.enterChildMode(childId, '/studio'); } catch (e) { setError(friendlyError(e)); setBusy(false); }
              }}>Hand over to {d.nickname}</Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/parent')}>Go to my dashboard</Button>
            </div>
          </div>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        {name !== 'Ready' && (
          <div className="flex justify-between pt-2">
            <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="w-4 h-4" aria-hidden /> Back</Button>
            <Button busy={busy} onClick={next}>{name === 'Routine' ? 'Save and continue' : 'Continue'} <ArrowRight className="w-4 h-4" aria-hidden /></Button>
          </div>
        )}
      </Card>
    </div>
  );
};
