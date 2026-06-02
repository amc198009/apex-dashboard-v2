'use client';

import clsx from 'clsx';
import { useApex } from '../lib/store';
import { Card, SectionTitle, ProgressBar } from './ui';
import { RISK, utilization, utilStatus } from '../lib/risk';
import { totalExposure, exposureByCategory, isOpen } from '../lib/analytics';
import { usd, pct } from '../lib/format';

// Live monitor of the hard risk constraints vs. current portfolio state.
const tone = (s: 'safe' | 'warn' | 'breach') =>
  s === 'breach' ? 'text-apex-red' : s === 'warn' ? 'text-apex-amber' : 'text-white/70';

type Row =
  | { kind: 'pct'; label: string; pct: number; usdc: number; cap: number }
  | { kind: 'count'; label: string; value: number; cap: number };

export function RiskPanel({ compact = false }: { compact?: boolean }) {
  const { trades, bankroll, health } = useApex();
  // Prefer the live bankroll; fall back to the backend-provided wallet balance
  // so exposure gauges stay meaningful when the optional /bankroll feed is down.
  const bank = bankroll?.current ?? health?.walletBalance ?? 0;
  const hasDenominator = bank > 0;
  const exposure = totalExposure(trades, bank);
  const categories = exposureByCategory(trades, bank);
  const openCount = trades.filter(isOpen).length;
  const topCategory = categories[0];

  const rows: Row[] = [
    { kind: 'pct', label: 'Portfolio exposure', pct: exposure.pct, usdc: exposure.usdc, cap: RISK.maxPortfolioPct },
    { kind: 'pct', label: 'Top category', pct: topCategory?.pct ?? 0, usdc: topCategory?.usdc ?? 0, cap: RISK.maxCategoryPct },
    { kind: 'count', label: 'Concurrent positions', value: openCount, cap: RISK.maxConcurrent },
  ];

  return (
    <Card className="p-5" glow={health?.drawdownActive ? 'red' : 'none'}>
      <SectionTitle right={
        <span className={clsx('inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full', health?.drawdownActive ? 'text-apex-red bg-apex-red/10 ring-1 ring-apex-red/25' : 'text-apex-green bg-apex-green/10 ring-1 ring-apex-green/25')}>
          ● {health?.drawdownActive ? 'Drawdown' : 'Nominal'}
        </span>
      }>Risk Monitor</SectionTitle>

      <div className="space-y-4">
        {rows.map(r => {
          if (r.kind === 'count') {
            const status = utilStatus(utilization(r.value, r.cap));
            return (
              <div key={r.label}>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-white/50">{r.label}</span>
                  <span className={clsx('tnum font-medium', tone(status))}>
                    {r.value} <span className="text-white/30">/ {r.cap}</span>
                  </span>
                </div>
                <ProgressBar value={r.value} max={r.cap} status={status} />
              </div>
            );
          }
          // Percentage rows need a bankroll/wallet denominator. Without one we
          // must NOT show a false "safe 0%" — surface the absolute exposure and
          // an indeterminate (amber) gauge instead.
          const hasExposure = r.usdc > 0;
          const indeterminate = !hasDenominator && hasExposure;
          const status = indeterminate ? 'warn' : utilStatus(utilization(r.pct, r.cap));
          return (
            <div key={r.label}>
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-white/50">{r.label}</span>
                <span className={clsx('tnum font-medium', tone(status))}>
                  {hasDenominator
                    ? <>{pct(r.pct, 1)} <span className="text-white/25">/ {pct(r.cap, 0)}</span></>
                    : hasExposure
                      ? <>{usd(r.usdc)} <span className="text-apex-amber/70">· bankroll n/a</span></>
                      : <>{pct(0, 1)} <span className="text-white/25">/ {pct(r.cap, 0)}</span></>}
                </span>
              </div>
              {indeterminate ? (
                <div className="h-1.5 w-full rounded-full bg-apex-amber/15 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-apex-amber/60 animate-pulse-soft" />
                </div>
              ) : (
                <ProgressBar value={r.pct} max={r.cap} status={status} />
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-y-2.5 gap-x-4 text-[12px]">
          <Constraint label="Min net edge" value={pct(RISK.minNetEdge, 0)} />
          <Constraint label="Max single" value={pct(RISK.maxSinglePct, 0)} />
          <Constraint label="Max correlated" value={pct(RISK.maxCorrelatedPct, 0)} />
          <Constraint label="Bankroll reserve" value={pct(RISK.reserveFraction, 0)} />
          <Constraint label="Min liquidity" value={usd(RISK.minLiquidity, 0)} />
          <Constraint label="Min time to resolve" value={`${RISK.minHoursToResolution}h`} />
        </div>
      )}

      {bankroll && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between text-[12px]">
          <span className="text-white/45">Liquid reserve (20%)</span>
          <span className="text-white/75 tnum font-medium">{usd(bankroll.reserveAmount)}</span>
        </div>
      )}
    </Card>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70 tnum font-medium">{value}</span>
    </div>
  );
}
