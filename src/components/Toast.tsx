'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import clsx from 'clsx';

export type ToastKind = 'info' | 'success' | 'error' | 'warn';
export interface Toast { id: number; kind: ToastKind; title: string; msg?: string; }

interface ToastCtx { push: (t: Omit<Toast, 'id'>) => void; }
const Ctx = createContext<ToastCtx | null>(null);

let seq = 0;
const TTL = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts(ts => ts.filter(t => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq;
    setToasts(ts => [...ts.slice(-4), { ...t, id }]);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  // Safe no-op if used outside provider (keeps non-UI callers from crashing).
  return ctx ?? { push: () => {} };
}

const ACCENT: Record<ToastKind, string> = {
  info: 'border-l-apex-blue',
  success: 'border-l-apex-green',
  error: 'border-l-apex-red',
  warn: 'border-l-apex-amber',
};
const GLYPH: Record<ToastKind, string> = { info: 'ⓘ', success: '✓', error: '✕', warn: '⚠' };
const GLYPH_COLOR: Record<ToastKind, string> = {
  info: 'text-apex-blue', success: 'text-apex-green', error: 'text-apex-red', warn: 'text-apex-amber',
};

function Toaster({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[60] bottom-24 md:bottom-6 right-4 md:right-6 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), TTL);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={clsx(
        'pointer-events-auto rounded-xl border border-white/10 border-l-2 bg-apex-surface-2/95 shadow-card-hover backdrop-blur px-4 py-3 animate-fade-in cursor-pointer',
        ACCENT[toast.kind],
      )}
      onClick={() => onClose(toast.id)}
    >
      <div className="flex items-start gap-2.5">
        <span className={clsx('text-[13px] mt-0.5', GLYPH_COLOR[toast.kind])}>{GLYPH[toast.kind]}</span>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-white/90 leading-snug">{toast.title}</div>
          {toast.msg && <div className="text-[12px] text-white/45 mt-0.5 leading-snug line-clamp-2">{toast.msg}</div>}
        </div>
      </div>
    </div>
  );
}
