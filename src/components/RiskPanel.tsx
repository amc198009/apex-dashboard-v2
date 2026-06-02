'use client';

import clsx from 'clsx';
import { useApex } from '../lib/store';
import { Card, SectionTitle, ProgressBar } from './ui';
import { RISK, utilization, utilStatus } from '../lib/risk';
import { totalExposure, exposureByCategory, isOpen } from '../lib/analytics';
import { usd, pct } from '../lib/format';

// Live monitor of the hard risk constraints vs. current portfolio state.
export function RiskPanel({ compact = false }: { compact?: boolean }) {
  const { trades, bankroll, health } = useApex();
  const bank = bankroll?.current ?? 0;
  const exposure = totalExposure(trades, bank);
  const categories = exposureByCategory(trades, bank);
  const openCount = trades.filter(isOpen).length;
  const topCategory = categories[0];

  const constraints: { label: string; value: number; cap: number; fmt: (v: number) => string }[] = [
    { label: 'Portfolio exposure', value: exposure.pct, cap: RISK.maxPortfolioPct, fmt: v => pct(v, 1) },
    { label: 'Top category', value: topCategory?.pct ?? 0, cap: RISK.maxCategoryPct, fmt: v => pct(v, 1) },
    { label: 'Concurrent positions', value: openCount, cap: RISK.maxConcurrent, fmt: v => `${v}` },
  ];

  return (
    <Card className="p-5" glow={health?.drawdownActive ? 'red' : 'none'}>
      <SectionTitle right={
        <span className={clsx('text-[9px] tracking-[0.15em]', health?.drawdownActive ? 'text-apex-red' : 'text-apex-green')}>
          {health?.drawdownActive ? '◉ DRAWDOWN' : '◉ NOMINAL'}
        </span>
      }>Risk Monitor</SectionTitle>

      <div className="space-y-4">
        {constraints.map(c => {
          const ratio = utilization(c.value, c.cap);
          const status = utilStatus(ratio);
          return (
            <div key={c.label}>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-white/45">{c.label}</span>
                <span className={clsx('tabular-nums', status === 'breach' ? 'text-apex-red' : status === 'warn' ? 'text-apex-amber' : 'text-white/70')}>
                  {c.fmt(c.value)} <span className="text-white/25">/ {c.fmt(c.cap)}</span>
                </span>
              </div>
              <ProgressBar value={c.value} max={c.cap} status={status} />
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-5 pt-4 border-t border-white/8 grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
          <Constraint label="Min net edge" value={pct(RISK.minNetEdge, 0)} />
          <Constraint label="Max single" value={pct(RISK.maxSinglePct, 0)} />
          <Constraint label="Max correlated" value={pct(RISK.maxCorrelatedPct, 0)} />
          <Constraint label="Bankroll reserve" value={pct(RISK.reserveFraction, 0)} />
          <Constraint label="Min liquidity" value={usd(RISK.minLiquidity, 0)} />
          <Constraint label="Min time to resolve" value={`${RISK.minHoursToResolution}h`} />
        </div>
      )}

      {bankroll && (
        <div className="mt-4 pt-4 border-t border-white/8 flex justify-between text-[10px]">
          <span className="text-white/40">Liquid reserve (20%)</span>
          <span className="text-white/70 tabular-nums">{usd(bankroll.reserveAmount)}</span>
        </div>
      )}
    </Card>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/35">{label}</span>
      <span className="text-white/65 tabular-nums">{value}</span>
    </div>
  );
}
