import React, { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { supabase, friendlyError } from '../../lib/supabase';
import { CONSENT_VERSION } from '../../config';
import { Link, navigate } from '../../app/router';
import { Button, Card, Field, Notice, inputCls } from '../../ui/kit';

const Shell: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="max-w-md mx-auto px-4 py-12">
    <Card className="p-7 sm:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </Card>
  </div>
);

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [coppa, setCoppa] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 10) return setError('Use at least 10 characters for your password.');
    if (!terms || !coppa) return setError('Please accept the terms, privacy policy and parental consent to continue.');
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/parent/onboarding`,
          data: {
            display_name: name.trim(),
            consent_version: CONSENT_VERSION,
            consents: { terms: true, privacy: true, coppa_parental_consent: true, reminder_emails: reminders },
          },
        },
      });
      if (err) throw err;
      if (data.session) navigate('/parent/onboarding');
      else setSent(true);
    } catch (e2) {
      setError(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Shell title="Check your email">
        <div className="text-center space-y-4">
          <MailCheck className="w-10 h-10 mx-auto text-forest" aria-hidden />
          <p className="text-sm text-ink">We sent a confirmation link to <strong>{email}</strong>. Open it to verify your email, then sign in to set up your child’s Studio.</p>
          <Button variant="secondary" onClick={() => navigate('/signin')}>Go to sign in</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Create your parent account" subtitle="Parents own the account. Children never sign up or enter an email.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Your first name" htmlFor="su-name" hint="Shown only to you.">
          <input id="su-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={80} />
        </Field>
        <Field label="Email" htmlFor="su-email">
          <input id="su-email" type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="su-pass" hint="At least 10 characters.">
          <input id="su-pass" type="password" required minLength={10} className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>

        <div className="space-y-3 rounded-xl bg-ivory border border-line p-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-navy" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>I am 18 or older and agree to the <Link to="/terms" className="underline font-semibold" target="_blank">Terms</Link> and <Link to="/privacy" className="underline font-semibold" target="_blank">Privacy Policy</Link>.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-navy" checked={coppa} onChange={(e) => setCoppa(e.target.checked)} />
            <span>
              I am the parent or legal guardian, and I consent to Heir of Wisdom collecting my child’s nickname, age, grade, avatar and learning activity
              to run the Studio and show me progress. It is never sold, used for ads or shared for marketing. I can review or delete it at any time.
              {' '}<Link to="/privacy#children" className="underline" target="_blank">Children’s privacy notice</Link>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-navy" checked={reminders} onChange={(e) => setReminders(e.target.checked)} />
            <span>Optional: send me practice reminder emails. Reminders only ever go to parents.</span>
          </label>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" className="w-full" busy={busy}>Create account</Button>
        <p className="text-sm text-center text-muted">Already have an account? <Link to="/signin" className="font-semibold text-navy underline">Sign in</Link></p>
      </form>
    </Shell>
  );
};

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate('/parent');
    } catch (e2) {
      setError(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Parent sign in">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="si-email">
          <input id="si-email" type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="si-pass">
          <input id="si-pass" type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" className="w-full" busy={busy}>Sign in</Button>
        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="text-navy underline">Forgot password?</Link>
          <Link to="/signup" className="text-navy underline">Create an account</Link>
        </div>
      </form>
    </Shell>
  );
};

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Reset your password" subtitle="We will email you a secure link.">
      {done ? (
        <p className="text-sm text-ink">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
          setBusy(false);
          if (err) setError(friendlyError(err)); else setDone(true);
        }}>
          <Field label="Email" htmlFor="fp-email">
            <input id="fp-email" type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" className="w-full" busy={busy}>Send reset link</Button>
        </form>
      )}
    </Shell>
  );
};

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Choose a new password">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 10) return setError('Use at least 10 characters.');
        setBusy(true);
        const { error: err } = await supabase.auth.updateUser({ password });
        setBusy(false);
        if (err) setError(friendlyError(err)); else navigate('/parent');
      }}>
        <Field label="New password" htmlFor="rp-pass" hint="At least 10 characters.">
          <input id="rp-pass" type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" className="w-full" busy={busy}>Save password</Button>
      </form>
    </Shell>
  );
};
