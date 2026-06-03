'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useApex } from '../lib/store';

interface Command { id: string; label: string; hint?: string; run: () => void; }

export function CommandPalette() {
  const router = useRouter();
  const { triggerScan, refresh } = useApex();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => [
    { id: 'nav-overview', label: 'Go to Overview', hint: 'Page', run: () => router.push('/') },
    { id: 'nav-positions', label: 'Go to Positions', hint: 'Page', run: () => router.push('/positions') },
    { id: 'nav-markets', label: 'Go to Markets', hint: 'Page', run: () => router.push('/markets') },
    { id: 'nav-analytics', label: 'Go to Analytics', hint: 'Page', run: () => router.push('/analytics') },
    { id: 'nav-settings', label: 'Go to Settings', hint: 'Page', run: () => router.push('/settings') },
    { id: 'act-scan', label: 'Trigger market scan', hint: 'Action', run: () => triggerScan() },
    { id: 'act-refresh', label: 'Refresh data', hint: 'Action', run: () => refresh() },
  ], [router, triggerScan, refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q));
  }, [commands, query]);

  const close = useCallback(() => { setOpen(false); setQuery(''); setActive(0); }, []);

  // ⌘K / Ctrl+K toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); }, [open]);
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) { cmd.run(); close(); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-apex-surface-2/95 shadow-card-hover overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <span className="text-white/30 text-[13px]">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-white/35 text-[13px]">No commands</div>
          ) : filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => { c.run(); close(); }}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors',
                i === active ? 'bg-white/[0.07] text-white' : 'text-white/70 hover:bg-white/[0.04]',
              )}
            >
              {c.label}
              {c.hint && <span className="text-[11px] text-white/30">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
