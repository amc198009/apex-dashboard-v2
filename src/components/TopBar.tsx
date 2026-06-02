'use client';

import { useApex } from '../lib/store';
import { Button, Spinner, pnlColor } from './ui';
import { usd, signedUsd } from '../lib/format';
import { winStats, totalExposure } from '../lib/analytics';
import clsx from 'clsx';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { health, trades, bankroll, calibration, lastRefresh, triggerScan, scanning, error } = useApex();
  const stats = winStats(trades);
  const exposure = totalExposure(trades, bankroll?.current ?? 0);

  const kpis = [
    { label: 'WALLET', value: health?.walletBalance != null ? `${usd(health.walletBalance)}` : '—', tone: 'text-white/85' },
    { label: 'EXPOSURE', value: bankroll ? `${(exposure.pct * 100).toFixed(1)}%` : (health?.portfolioExposure ?? '—'), tone: 'text-white/85' },
    { label: 'SESSION P&L', value: signedUsd(stats.totalPnl), tone: pnlColor(stats.totalPnl) },
    { label: 'WIN RATE', value: stats.resolved ? `${(stats.winRate * 100).toFixed(0)}%` : '—', tone: 'text-white/85' },
    { label: 'BRIER', value: calibration?.avgBrierScore != null ? calibration.avgBrierScore.toFixed(3) : '—', tone: 'text-white/85' },
  ];

  return (
    <div className="sticky top-0 z-30 border-b border-white/8 bg-[#080808]/85 backdrop-blur-md">
      {health?.drawdownActive && (
        <div className="bg-apex-red/20 border-b border-apex-red/40 px-6 py-1.5 text-center text-apex-red text-[10px] tracking-[0.2em] animate-pulse-soft">
          ⚠ DRAWDOWN PROTOCOL ACTIVE — KELLY FRACTIONS HALVED
        </div>
      )}
      {error && (
        <div className="bg-apex-amber/15 border-b border-apex-amber/30 px-6 py-1.5 text-center text-apex-amber/90 text-[10px] tracking-[0.15em]">
          ⚠ BACKEND UNREACHABLE — {error.toUpperCase()} · retrying
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <div className="text-white/90 text-sm font-semibold tracking-[0.18em]">{title}</div>
          {subtitle && <div className="text-white/30 text-[10px] tracking-[0.1em] mt-0.5">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-5">
            {kpis.map(k => (
              <div key={k.label} className="text-right">
                <div className="text-[8px] text-white/25 tracking-[0.15em]">{k.label}</div>
                <div className={clsx('text-sm font-semibold tabular-nums', k.tone)}>{k.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 border-l border-white/8 pl-5">
            <span className="text-[9px] text-white/20 tracking-wider hidden lg:inline">
              {lastRefresh ? `synced ${lastRefresh.toLocaleTimeString()}` : 'connecting…'}
            </span>
            <Button variant="accent" size="sm" onClick={triggerScan} disabled={scanning}>
              {scanning ? <><Spinner /> SCANNING</> : '▶ TRIGGER SCAN'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
