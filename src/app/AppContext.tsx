import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { parentApi, type ChildRow, type GateStatus } from '../services/remote';
import { navigate } from './router';

type Mode = 'parent' | 'child';

interface AppState {
  ready: boolean;
  session: Session | null;
  displayName: string;
  children: ChildRow[];
  activeChild: ChildRow | null;
  mode: Mode;
  gate: GateStatus | null;
  refresh: () => Promise<void>;
  refreshGate: () => Promise<GateStatus | null>;
  setActiveChild: (id: string) => void;
  enterChildMode: (childId: string, to?: string) => Promise<void>;
  /** Verifies the parent PIN on the server; on success switches to parent mode. */
  unlockParent: (pin: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

const modeKey = (uid: string) => `how:${uid}:mode`;
const childKey = (uid: string) => `how:${uid}:child`;
const read = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const write = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage unavailable */ }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [kids, setKids] = useState<ChildRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('parent');
  const [gate, setGate] = useState<GateStatus | null>(null);
  const [displayName, setDisplayName] = useState('');
  const uid = session?.user.id ?? null;
  const freshLogin = useRef(false);

  const refreshGate = useCallback(async () => {
    try {
      const g = await parentApi.gateStatus();
      setGate(g);
      return g;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const [list, profile] = await Promise.all([
      parentApi.children(),
      supabase.from('parent_users').select('display_name').eq('id', uid).maybeSingle(),
    ]);
    setKids(list);
    setDisplayName(profile.data?.display_name ?? '');
    const stored = read(childKey(uid));
    setActiveId((cur) => (cur && list.some((c) => c.id === cur) ? cur : stored && list.some((c) => c.id === stored) ? stored : list[0]?.id ?? null));
    await refreshGate();
  }, [uid, refreshGate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') freshLogin.current = true;
      setSession(s);
      if (!s) {
        setKids([]);
        setGate(null);
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;
    setMode((read(modeKey(uid)) as Mode) || 'parent');
    (async () => {
      try {
        if (freshLogin.current) {
          freshLogin.current = false;
          // A fresh password sign-in proves the parent is present: open the gate for 15 minutes.
          if (read(modeKey(uid)) !== 'child') await parentApi.unlockAfterLogin().catch(() => undefined);
        }
        await refresh();
      } finally {
        setReady(true);
      }
    })();
  }, [uid, refresh]);

  const setActiveChild = useCallback((id: string) => {
    setActiveId(id);
    if (uid) write(childKey(uid), id);
  }, [uid]);

  const enterChildMode = useCallback(async (childId: string, to = '/studio') => {
    await parentApi.lockGate();
    setActiveChild(childId);
    setMode('child');
    if (uid) write(modeKey(uid), 'child');
    await refreshGate();
    navigate(to);
  }, [uid, setActiveChild, refreshGate]);

  const unlockParent = useCallback(async (pin: string) => {
    const r = await parentApi.verifyPin(pin);
    if (!r.ok) {
      const message = r.reason === 'locked'
        ? 'Too many tries. The PIN is locked for 10 minutes.'
        : `That PIN is not right.${typeof r.remaining === 'number' ? ` ${r.remaining} tries left.` : ''}`;
      return { ok: false, message };
    }
    setMode('parent');
    if (uid) write(modeKey(uid), 'parent');
    await refreshGate();
    return { ok: true };
  }, [uid, refreshGate]);

  const signOut = useCallback(async () => {
    if (uid) write(modeKey(uid), null);
    await supabase.auth.signOut();
    navigate('/');
  }, [uid]);

  const value = useMemo<AppState>(() => ({
    ready,
    session,
    displayName,
    children: kids,
    activeChild: kids.find((k) => k.id === activeId) ?? null,
    mode,
    gate,
    refresh,
    refreshGate,
    setActiveChild,
    enterChildMode,
    unlockParent,
    signOut,
  }), [ready, session, displayName, kids, activeId, mode, gate, refresh, refreshGate, setActiveChild, enterChildMode, unlockParent, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
