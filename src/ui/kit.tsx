import React from 'react';
import { AlertTriangle, Info, Loader2, WifiOff } from 'lucide-react';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ochre';

const variants: Record<BtnVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-deep disabled:bg-navy/40',
  secondary: 'bg-paper text-navy border border-line hover:border-navy/40 disabled:opacity-50',
  ghost: 'text-navy hover:bg-navy/5 disabled:opacity-40',
  danger: 'bg-brick text-white hover:bg-brick/90 disabled:opacity-50',
  ochre: 'bg-ochre text-white hover:bg-ochre/90 disabled:opacity-50',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; busy?: boolean }> = ({
  variant = 'primary',
  size = 'md',
  busy,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  const sz = size === 'sm' ? 'px-3 py-2 text-sm min-h-9' : size === 'lg' ? 'px-6 py-4 text-base min-h-14' : 'px-5 py-3 text-sm min-h-11';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${sz} ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' }> = ({ className = '', as = 'div', ...rest }) => {
  const C = as;
  return <C className={`bg-paper border border-line rounded-2xl ${className}`} {...rest} />;
};

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-forest ${className}`}>{children}</p>
);

export const Notice: React.FC<{ tone?: 'info' | 'warn' | 'error' | 'mock'; children: React.ReactNode; className?: string }> = ({ tone = 'info', children, className = '' }) => {
  const styles = {
    info: 'bg-mist/60 border-mist text-navy',
    warn: 'bg-ochre-soft border-ochre/40 text-ink',
    error: 'bg-brick-soft border-brick/30 text-brick',
    mock: 'bg-ochre-soft border-ochre text-ink border-dashed',
  }[tone];
  const Icon = tone === 'error' || tone === 'warn' ? AlertTriangle : Info;
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={`flex gap-3 items-start border rounded-xl px-4 py-3 text-sm leading-relaxed ${styles} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string }> = ({ label, hint, error, children, htmlFor }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    {error && <p className="text-xs text-brick" role="alert">{error}</p>}
  </div>
);

export const inputCls = 'w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-navy focus:outline-none';

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
    <span className="text-sm">{label}…</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <Card className="p-8 text-center space-y-4 max-w-md mx-auto my-12">
    {/fetch|connection|reach/i.test(message) ? <WifiOff className="w-8 h-8 mx-auto text-muted" aria-hidden /> : <AlertTriangle className="w-8 h-8 mx-auto text-brick" aria-hidden />}
    <p className="text-sm text-ink">{message}</p>
    {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
  </Card>
);

export const EmptyState: React.FC<{ title: string; children?: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <Card className="p-8 text-center space-y-3">
    <h3 className="text-lg font-serif font-semibold">{title}</h3>
    {children && <div className="text-sm text-muted max-w-md mx-auto leading-relaxed">{children}</div>}
    {action && <div className="pt-2">{action}</div>}
  </Card>
);

export const MockLabel: React.FC<{ children?: React.ReactNode }> = ({ children = 'Illustrative' }) => (
  <span className="inline-flex items-center rounded-full border border-dashed border-ochre bg-ochre-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink">{children}</span>
);

const AVATAR_GLYPH: Record<string, string> = { owl: '🦉', fox: '🦊', turtle: '🐢', whale: '🐋', falcon: '🦅', lion: '🦁', bear: '🐻', otter: '🦦' };
export const AVATARS = Object.keys(AVATAR_GLYPH);
export const AVATAR_COLORS = ['#B98E4C', '#547B62', '#233D5B', '#A4493D', '#6E7F8D', '#8A6FA8'];

export const Avatar: React.FC<{ avatar: string; color: string; size?: number; label?: string }> = ({ avatar, color, size = 40, label }) => (
  <span
    className="inline-flex items-center justify-center rounded-full shrink-0 border-2 border-white shadow-sm"
    style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.5 }}
    role="img"
    aria-label={label ?? `${avatar} avatar`}
  >
    <span aria-hidden>{AVATAR_GLYPH[avatar] ?? '⭐'}</span>
  </span>
);

export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = React.useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const run = React.useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fn().then(
      (data) => alive && setState({ data, loading: false }),
      (e) => alive && setState({ error: e instanceof Error ? e.message : String(e), loading: false }),
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useEffect(run, [run]);
  return { ...state, reload: run };
}
