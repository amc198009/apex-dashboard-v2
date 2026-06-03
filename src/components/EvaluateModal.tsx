'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import clsx from 'clsx';
import { api, type EvaluateResult } from '../lib/api';
import { useToast } from './Toast';
import { Button, Spinner, Badge } from './ui';
import { pct, signedPct, cents, usd } from '../lib/format';

interface EvalCtx { open: () => void; }
const Ctx = createContext<EvalCtx | null>(null);
export function useEvaluate(): EvalCtx {
  return useContext(Ctx) ?? { open: () => {} };
}

export function EvaluateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && <Modal onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  const { push } = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const v = input.trim();
    if (!v) return;
    setLoading(true); setErr(null); setResult(null);
    const payload = v.startsWith('http') ? { url: v } : { marketId: v };
    try {
      const r = await api.evaluate(payload);
      setResult(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Evaluation failed';
      setErr(msg);
      push({ kind: 'error', title: 'Evaluation failed', msg: 'The backend /evaluate endpoint may not be available yet.' });
    } finally {
      setLoading(false);
    }
  }, [input, push]);

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center pt-[14vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-apex-surface-2/95 shadow-card-hover overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-white">Evaluate a market</div>
            <div className="text-[12px] text-white/40 mt-0.5">Run a Polymarket market through the 7-layer engine on demand</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="Market URL or condition/market ID"
              className="flex-1 rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:ring-white/25"
            />
            <Button variant="approve" onClick={submit} disabled={loading || !input.trim()}>
              {loading ? <><Spinner /> Running</> : 'Evaluate'}
            </Button>
          </div>

          {err && (
            <div className="rounded-xl bg-apex-red/10 ring-1 ring-apex-red/20 px-3.5 py-3 text-[12px] text-apex-red/90">
              {err}
              <div className="text-white/40 mt-1">This is expected if the agent doesn’t expose <span className="tnum">/evaluate</span> yet, or the API URL isn’t configured.</div>
            </div>
          )}

          {result && <ResultView r={result} />}

          {!result && !err && !loading && (
            <div className="text-[12px] text-white/35 leading-relaxed">
              Paste a market link or ID. The agent returns its directional read, edge vs. the 7% floor, signal tier, and the strongest counter-argument.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultView({ r }: { r: EvaluateResult }) {
  const known = r.question != null || r.netEdge != null || r.direction != null || r.disqualified != null;
  if (!known) {
    return (
      <pre className="rounded-xl bg-black/40 ring-1 ring-white/10 p-3 text-[11px] text-white/60 overflow-auto max-h-64 tnum">
        {JSON.stringify(r, null, 2)}
      </pre>
    );
  }
  return (
    <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] p-4 space-y-3 animate-fade-in">
      {r.question && <div className="text-[13px] text-white/90 font-medium leading-snug">{r.question}</div>}

      <div className="flex items-center gap-2 flex-wrap">
        {r.direction && (
          <Badge className={clsx('font-semibold', r.direction === 'YES' ? 'text-apex-green bg-apex-green/10 ring-1 ring-apex-green/20' : 'text-apex-red bg-apex-red/10 ring-1 ring-apex-red/20')}>{r.direction}</Badge>
        )}
        {r.signalTier != null && <Badge className="text-white/60 bg-white/5 ring-1 ring-white/10">Tier {r.signalTier}</Badge>}
        {r.disqualified
          ? <Badge className="text-apex-red bg-apex-red/10 ring-1 ring-apex-red/20">Disqualified</Badge>
          : r.netEdge != null && <Badge className="text-apex-green bg-apex-green/10 ring-1 ring-apex-green/20">Edge {signedPct(r.netEdge)}</Badge>}
      </div>

      {!r.disqualified && (
        <div className="grid grid-cols-3 gap-3 text-[12px]">
          {r.estimatedProbability != null && <Cell k="Model prob" v={pct(r.estimatedProbability)} />}
          {r.entryPrice != null && <Cell k="Entry" v={cents(r.entryPrice)} />}
          {r.allocationUsdc != null && <Cell k="Size" v={usd(r.allocationUsdc)} />}
        </div>
      )}

      {r.disqualified && r.reason && (
        <div className="text-[12px] text-apex-amber/90">Reason: {r.reason}</div>
      )}
      {r.recommendation && <div className="text-[12px] text-white/60">{r.recommendation}</div>}
      {r.counterArgument && (
        <div className="pt-2 border-t border-white/[0.06]">
          <span className="text-apex-amber/80 text-[11px] font-semibold">Strongest counter</span>
          <p className="text-white/55 italic mt-1 text-[12px] leading-relaxed">{r.counterArgument}</p>
        </div>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/35">{k}</div>
      <div className="text-[13px] font-medium text-white/85 tnum mt-0.5">{v}</div>
    </div>
  );
}
