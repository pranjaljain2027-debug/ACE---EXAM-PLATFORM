import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { Button } from '../ui/kit';

/** PIN pad used to leave the child Studio or re-open parent areas. Verification happens on the server. */
export const PinPad: React.FC<{ onSubmit: (pin: string) => Promise<{ ok: boolean; message?: string }>; title?: string; subtitle?: string; onCancel?: () => void }> = ({
  onSubmit,
  title = 'Grown-ups only',
  subtitle = 'Enter the 4-digit parent PIN.',
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (value: string) => {
    if (value.length !== 4) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await onSubmit(value);
      if (!r.ok) {
        setMsg(r.message ?? 'That PIN is not right.');
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  const press = (d: string) => {
    if (busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) submit(next);
  };

  return (
    <div className="space-y-5 text-center">
      <Lock className="w-8 h-8 mx-auto text-navy" aria-hidden />
      <div>
        <h2 className="text-xl font-serif font-semibold">{title}</h2>
        <p className="text-sm text-muted mt-1">{subtitle}</p>
      </div>
      <label htmlFor="parent-pin" className="sr-only">Parent PIN</label>
      <input
        id="parent-pin"
        ref={inputRef}
        inputMode="numeric"
        autoComplete="off"
        type="password"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(v);
          if (v.length === 4) submit(v);
        }}
        className="mx-auto block w-40 text-center text-3xl tracking-[0.6em] rounded-xl border border-line bg-paper py-3"
      />
      <div className="grid grid-cols-3 gap-2 max-w-[15rem] mx-auto" aria-hidden>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? <span key={i} /> : (
            <button key={i} type="button" tabIndex={-1} onClick={() => (d === '⌫' ? setPin((p) => p.slice(0, -1)) : press(d))}
              className="h-14 rounded-xl border border-line bg-paper text-xl font-semibold text-navy hover:bg-mist/40">{d}</button>
          ),
        )}
      </div>
      <div aria-live="assertive" className="min-h-5 text-sm text-brick">{msg}</div>
      {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
    </div>
  );
};

export const Modal: React.FC<{ open: boolean; onClose: () => void; label: string; children: React.ReactNode }> = ({ open, onClose, label, children }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-deep/50" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="relative w-full max-w-sm bg-paper rounded-2xl p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg text-muted hover:bg-navy/5" aria-label="Close">
          <X className="w-5 h-5" aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
};
