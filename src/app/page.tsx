'use client';

import clsx from 'clsx';
import { useApex } from '../lib/store';
import { TopBar } from '../components/TopBar';
import { TradeCard } from '../components/TradeCard';
import { RiskPanel } from '../components/RiskPanel';
import { EquityCurve } from '../components/charts';
import { Card, SectionTitle, StatTile, EmptyState, pnlColor } from '../components/ui';
import { winStats, isOpen } from '../lib/analytics';
import { usd, signedUsd, signedPct, pct } from '../lib/format';

export default function OverviewPage() {
  const { trades, summary, bankroll } = useApex();

  const stats = winStats(trades);
  const pendingTrades = trades.filter(t => t.status === 'PENDING_APPROVAL');
  const openTrades = trades.filter(isOpen).slice(0, 6);

  const bankrollSub = bankroll
    ? signedPct(bankroll.totalGrowthPct / 100) + ' growth'
    : '—';

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-white/90">
      <TopBar title="Overview" subtitle="Autonomous Polymarket edge execution" />

      <div className="px-4 py-6 md:px-8 md:py-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8">

        {/* ── Stat tiles row ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatTile
            label="Pending"
            value={String(summary.pending)}
            accent="text-apex-amber"
          />
          <StatTile
            label="Open"
            value={String(summary.open)}
            accent="text-apex-green"
          />
          <StatTile
            label="Closed"
            value={String(summary.closed)}
          />
          <StatTile
            label="Failed"
            value={String(summary.failed)}
            accent="text-apex-red"
          />
          <StatTile
            label="Bankroll"
            value={bankroll != null ? usd(bankroll.current) : '—'}
            sub={bankrollSub}
            accent={
              bankroll != null
                ? bankroll.totalGrowthPct >= 0
                  ? 'text-apex-green'
                  : 'text-apex-red'
                : undefined
            }
          />
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Equity Curve */}
            <Card className="p-6">
              <SectionTitle>Equity curve</SectionTitle>
              <EquityCurve
                trades={trades}
                starting={bankroll?.starting ?? 0}
              />
            </Card>

            {/* Pending Approvals */}
            <div>
              <SectionTitle>Pending approvals</SectionTitle>
              {pendingTrades.length === 0 ? (
                <EmptyState>
                  No pending approvals — agent is scanning markets autonomously
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {pendingTrades.map(t => (
                    <TradeCard key={t.id} trade={t} />
                  ))}
                </div>
              )}
            </div>

            {/* Open Positions */}
            <div>
              <SectionTitle>Open positions</SectionTitle>
              {openTrades.length === 0 ? (
                <EmptyState>No open positions</EmptyState>
              ) : (
                <div className="space-y-3">
                  {openTrades.map(t => (
                    <TradeCard key={t.id} trade={t} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT column ── */}
          <div className="space-y-6">

            <RiskPanel />

            {/* Session stats card */}
            <Card className="p-6">
              <SectionTitle>Session</SectionTitle>
              <div className="mt-3">
                <SessionRow
                  label="Resolved"
                  value={String(stats.resolved)}
                />
                <SessionRow
                  label="Win rate"
                  value={pct(stats.winRate, 0)}
                />
                <SessionRow
                  label="Profit factor"
                  value={
                    stats.profitFactor === Infinity
                      ? '∞'
                      : stats.profitFactor.toFixed(2)
                  }
                />
                <SessionRow
                  label="Total P&L"
                  value={signedUsd(stats.totalPnl)}
                  valueClass={clsx('tnum', pnlColor(stats.totalPnl))}
                />
                <SessionRow
                  label="Best trade"
                  value={
                    stats.bestTrade != null
                      ? signedUsd(stats.bestTrade)
                      : '—'
                  }
                  valueClass={clsx(
                    'tnum',
                    stats.bestTrade != null ? pnlColor(stats.bestTrade) : 'text-white/40'
                  )}
                />
                <SessionRow
                  label="Worst trade"
                  value={
                    stats.worstTrade != null
                      ? signedUsd(stats.worstTrade)
                      : '—'
                  }
                  valueClass={clsx(
                    'tnum',
                    stats.worstTrade != null ? pnlColor(stats.worstTrade) : 'text-white/40'
                  )}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local helper: one stat row inside the Session card
// ---------------------------------------------------------------------------

function SessionRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-white/45">{label}</span>
      <span className={clsx('font-medium tnum', valueClass ?? 'text-white')}>
        {value}
      </span>
    </div>
  );
}
