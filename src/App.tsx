import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppProvider, useApp } from './app/AppContext';
import { Link, match, navigate, usePath } from './app/router';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PinPad } from './components/ParentGate';
import { Avatar, Button, Card, Spinner } from './ui/kit';
import { StudioApp } from './views/studio/StudioApp';
import { Landing, HowItWorks, Curriculum, Pricing, Faq, Privacy, Terms, NotFound } from './views/public/PublicPages';
import { SignIn, SignUp, ForgotPassword, ResetPassword } from './views/parent/Auth';
import { Onboarding } from './views/parent/Onboarding';
import { ParentDashboard, SkillReport, Billing, ParentSettingsView } from './views/parent/ParentViews';
import { StaffArea } from './views/staff/StaffViews';
import { staffApi } from './services/bank';
import { AFFILIATION_NOTE } from './content/coverage';
import { friendlyError } from './lib/supabase';
import { maybeLoadMarketingAnalytics, isProtectedPath, analyticsLoaded } from './lib/analytics';

export default function App() {
  return (
    <AppProvider>
      <OfflineIndicator />
      <Routes />
    </AppProvider>
  );
}

const PUBLIC: Record<string, React.FC> = {
  '/': Landing,
  '/how-it-works': HowItWorks,
  '/curriculum': Curriculum,
  '/pricing': Pricing,
  '/faq': Faq,
  '/privacy': Privacy,
  '/terms': Terms,
  '/signin': SignIn,
  '/signup': SignUp,
  '/forgot-password': ForgotPassword,
  '/reset-password': ResetPassword,
};

function Redirect({ to }: { to: string }) {
  useEffect(() => { navigate(to, { replace: true }); }, [to]);
  return null;
}

function Routes() {
  const { path } = usePath();
  const app = useApp();

  // Marketing analytics only on public pages, and only if the tab never visited a protected area.
  useEffect(() => {
    if (isProtectedPath(path)) {
      sessionStorage.setItem('how:protected', '1');
      // Unload third-party scripts completely before showing a protected area.
      if (analyticsLoaded()) window.location.replace(window.location.href);
    }
    else if (app.ready && !sessionStorage.getItem('how:protected')) maybeLoadMarketingAnalytics(path, Boolean(app.session));
  }, [path, app.ready, app.session]);

  // No-account demo: fully separate, never touches the account.
  if (path === '/demo' || path.startsWith('/demo/')) return <StudioApp demo />;

  if (!app.ready) return <Spinner label="Loading" />;

  const signedIn = Boolean(app.session);

  // Child mode: the Studio is the only place a child can go. Leaving needs the parent PIN.
  if (signedIn && app.mode === 'child') {
    if (!path.startsWith('/studio')) return <Redirect to="/studio" />;
    return <StudioApp />;
  }

  if (path === '/studio' || path.startsWith('/studio/')) {
    if (!signedIn) return <Redirect to="/signin" />;
    return <Layout><HandOver /></Layout>;
  }

  if (path === '/parent' || path.startsWith('/parent/')) {
    if (!signedIn) return <Redirect to="/signin" />;
    return <Layout><ParentArea path={path} /></Layout>;
  }

  if (path === '/staff' || path.startsWith('/staff/')) {
    if (!signedIn) return <Redirect to="/signin" />;
    return <Layout><GatedArea><StaffArea path={path} /></GatedArea></Layout>;
  }

  if (path.startsWith('/blog')) return <Redirect to="/faq" />;
  if ((path === '/signin' || path === '/signup') && signedIn) return <Redirect to="/parent" />;

  const Page = PUBLIC[path] ?? NotFound;
  return <Layout><Page /></Layout>;
}

/** Parent PIN gate shared by the parent area and the staff area. */
function GatedArea({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30000);
    return () => window.clearInterval(t);
  }, []);

  const g = app.gate;
  const open = Boolean(g) && (!g!.has_pin || (g!.unlocked_until !== null && new Date(g!.unlocked_until).getTime() > Date.now()));

  if (!g) return <Spinner label="Checking access" />;
  if (!open) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <Card className="p-6">
          <PinPad title="Parent area" subtitle="Enter your parent PIN to see reports, billing and settings." onSubmit={app.unlockParent} />
          <p className="text-xs text-center text-muted mt-4">Forgot it? <button className="underline" onClick={() => app.signOut().then(() => navigate('/signin'))}>Sign out and sign in again</button> to unlock with your password.</p>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

function ParentArea({ path }: { path: string }) {
  return <GatedArea><ParentRoutes path={path} /></GatedArea>;
}

function ParentRoutes({ path }: { path: string }) {
  if (path === '/parent/onboarding') return <Onboarding />;
  if (path === '/parent/billing') return <Billing />;
  if (path === '/parent/settings') return <ParentSettingsView />;
  const rep = match('/parent/report/:id', path);
  if (rep) return <SkillReport childId={rep.id} />;
  if (path === '/parent') return <ParentDashboard />;
  return <NotFound />;
}

/** Signed-in parent opened /studio: pick which child and hand the device over. */
function HandOver() {
  const app = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (!app.children.length) return <Redirect to="/parent/onboarding" />;
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="p-7 space-y-5 text-center">
        <h1 className="text-2xl font-serif font-semibold">Who is learning now?</h1>
        <p className="text-sm text-muted">The Studio locks with your parent PIN until you come back.</p>
        <div className="grid gap-3">
          {app.children.map((c) => (
            <Button key={c.id} variant="secondary" size="lg" busy={busy === c.id} onClick={async () => {
              setBusy(c.id);
              setErr(null);
              try { await app.enterChildMode(c.id); } catch (e) { setErr(friendlyError(e)); setBusy(null); }
            }}>
              <Avatar avatar={c.avatar} color={c.avatar_color} size={32} /> {c.nickname}
            </Button>
          ))}
        </div>
        {err && <p className="text-sm text-brick" role="alert">{err}</p>}
      </Card>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const { path } = usePath();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = [
    { to: '/how-it-works', label: 'How it works' },
    { to: '/curriculum', label: 'Curriculum' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/faq', label: 'FAQ' },
  ];
  const signedIn = Boolean(app.session);
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    if (!signedIn) { setIsStaff(false); return; }
    let alive = true;
    staffApi.roles().then((r) => alive && setIsStaff(r.length > 0), () => undefined);
    return () => { alive = false; };
  }, [signedIn]);
  const staffLink = isStaff ? [{ to: '/staff', label: 'Review' }] : [];
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] bg-paper px-4 py-2 rounded-lg">Skip to content</a>
      <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to={signedIn ? '/parent' : '/'} className="font-serif text-xl font-semibold text-navy whitespace-nowrap">Heir of Wisdom</Link>
          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {(signedIn ? [{ to: '/parent', label: 'Dashboard' }, { to: '/parent/settings', label: 'Settings' }, ...staffLink, { to: '/faq', label: 'Help' }] : links).map((l) => (
              <Link key={l.to} to={l.to} aria-current={path === l.to ? 'page' : undefined} className={`px-3 py-2 rounded-lg text-sm font-semibold ${path === l.to ? 'text-navy bg-navy/5' : 'text-ink hover:text-navy'}`}>{l.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {signedIn ? (
              <>
                <Button size="sm" onClick={() => navigate('/studio')}>Open Studio</Button>
                <Button size="sm" variant="ghost" onClick={app.signOut}>Sign out</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => navigate('/signin')}>Sign in</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>Start free</Button>
              </>
            )}
          </div>
          <button type="button" className="md:hidden p-2 rounded-lg text-navy" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
          </button>
        </div>
        {open && (
          <nav aria-label="Mobile" className="md:hidden border-t border-line bg-paper px-4 py-3 space-y-1">
            {(signedIn ? [{ to: '/parent', label: 'Dashboard' }, { to: '/parent/settings', label: 'Settings' }, ...staffLink, { to: '/studio', label: 'Open Studio' }] : [...links, { to: '/signin', label: 'Sign in' }, { to: '/signup', label: 'Start free' }]).map((l) => (
              <Link key={l.to} to={l.to} className="block px-3 py-3 rounded-lg text-base font-semibold text-navy hover:bg-navy/5">{l.label}</Link>
            ))}
            {signedIn && <button type="button" onClick={app.signOut} className="block w-full text-left px-3 py-3 rounded-lg text-base font-semibold text-navy hover:bg-navy/5">Sign out</button>}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-line bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-[1fr_auto] gap-4 text-xs text-muted">
          <p className="max-w-2xl">{AFFILIATION_NOTE}</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link to="/privacy" className="underline">Privacy</Link>
            <Link to="/terms" className="underline">Terms</Link>
            <Link to="/curriculum" className="underline">Coverage</Link>
            <Link to="/demo" className="underline">Demo</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
