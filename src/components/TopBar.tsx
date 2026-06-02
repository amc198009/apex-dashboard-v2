'use client';

import { useApex } from '../lib/store';
import { Button, Spinner, pnlColor } from './ui';
import { usd, signedUsd } from '../lib/format';
import { winStats, totalExposure } from '../lib/analytics';
import clsx from 'clsx';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { health, trades, bankroll, calibration, lastRefresh, triggerScan, scanning, error } = useApex();
  const stats = winStats(trades);
  const denom = bankroll?.current ?? health?.walletBalance ?? 0;
  const exposure = totalExposure(trades, denom);

  const kpis = [
    { label: 'Wallet', value: health?.walletBalance != null ? usd(health.walletBalance) : '—', tone: 'text-white' },
    { label: 'Exposure', value: denom > 0 ? `${(exposure.pct * 100).toFixed(1)}%` : (health?.portfolioExposure ?? '—'), tone: 'text-white' },
    { label: 'Session P&L', value: signedUsd(stats.totalPnl), tone: pnlColor(stats.totalPnl) },
    { label: 'Win rate', value: stats.resolved ? `${(stats.winRate * 100).toFixed(0)}%` : '—', tone: 'text-white' },
    { label: 'Brier', value: calibration?.avgBrierScore != null ? calibration.avgBrierScore.toFixed(3) : '—', tone: 'text-white' },
  ];

  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b0d12]/80 backdrop-blur-xl">
      {health?.drawdownActive && (
        <div className="bg-apex-red/15 border-b border-apex-red/25 px-8 py-2 text-center text-apex-red text-[12px] font-medium animate-pulse-soft">
          ⚠ Drawdown protocol active — Kelly fractions halved
        </div>
      )}
      {error && (
        <div className="bg-apex-amber/10 border-b border-apex-amber/20 px-8 py-2 text-center text-apex-amber/90 text-[12px] font-medium">
          Backend unreachable — {error} · retrying
        </div>
      )}
      <div className="flex items-center justify-between gap-6 px-8 py-4">
        <div>
          <h1 className="text-white text-[19px] font-semibold tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-white/40 text-[12px] mt-1.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            {kpis.map(k => (
              <div key={k.label} className="text-right">
                <div className="text-[10px] text-white/35 font-medium">{k.label}</div>
                <div className={clsx('text-[15px] font-semibold tnum mt-0.5', k.tone)}>{k.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 border-l border-white/[0.07] pl-6">
            <span className="text-[11px] text-white/30 hidden lg:inline">
              {lastRefresh ? `synced ${lastRefresh.toLocaleTimeString()}` : 'connecting…'}
            </span>
            <Button variant="accent" size="sm" onClick={triggerScan} disabled={scanning}>
              {scanning ? <><Spinner /> Scanning</> : <>▶ Trigger scan</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
