'use client';

import { useApex } from '../../lib/store';
import { TopBar } from '../../components/TopBar';
import { RiskPanel } from '../../components/RiskPanel';
import { ExposureChart } from '../../components/charts';
import { Card, SectionTitle, StatusBadge, EmptyState, pnlColor } from '../../components/ui';
import { isOpen, isClosed, unrealizedPnl } from '../../lib/analytics';
import { RISK } from '../../lib/risk';
import { usd, signedUsd, pct, cents, signedPct, durationUntil } from '../../lib/format';
import type { Trade } from '../../lib/api';
import clsx from 'clsx';

// ── Open positions table ──────────────────────────────────────────────────────

function OpenPositionsTable({ trades }: { trades: Trade[] }) {
  const open = trades.filter(isOpen);

  if (!open.length) {
    return (
      <EmptyState>
        No open positions — approve a pending trade to open one
      </EmptyState>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[11px] font-medium text-white/40 border-b border-white/[0.06]">
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Dir</th>
            <th className="px-4 py-3 font-medium text-right">Entry</th>
            <th className="px-4 py-3 font-medium text-right">Size</th>
            <th className="px-4 py-3 font-medium text-right">Edge</th>
            <th className="px-4 py-3 font-medium text-right">Resolves</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {open.map((t) => {
            const upnl = unrealizedPnl(t);
            return (
              <tr
                key={t.id}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {/* MARKET */}
                <td className="px-4 py-3.5 text-[13px] max-w-[260px]">
                  <div className="truncate text-white/80 leading-tight" title={t.question}>
                    {t.question}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">
                    {t.category}
                    {t.signalTier != null && (
                      <span className="ml-1.5 text-white/25">T{t.signalTier}</span>
                    )}
                  </div>
                </td>

                {/* DIR */}
                <td className="px-4 py-3.5 text-[13px]">
                  <span
                    className={clsx(
                      'font-semibold',
                      t.direction === 'YES' ? 'text-apex-green' : 'text-apex-red',
                    )}
                  >
                    {t.direction}
                  </span>
                </td>

                {/* ENTRY */}
                <td className="px-4 py-3.5 text-[13px] text-right tnum text-white/70">
                  {cents(t.entryPrice)}
                </td>

                {/* SIZE + unrealized P&L */}
                <td className="px-4 py-3.5 text-[13px] text-right tnum">
                  <div className="text-white/80">{usd(t.allocationUsdc)}</div>
                  <div className="text-[11px] text-white/40">
                    {pct(t.allocationPct, 2)}
                    {upnl != null && (
                      <span className={clsx('ml-1.5', pnlColor(upnl))}>
                        {signedUsd(upnl)}
                      </span>
                    )}
                  </div>
                </td>

                {/* EDGE */}
                <td
                  className={clsx(
                    'px-4 py-3.5 text-[13px] text-right tnum',
                    t.netEdge >= 0 ? 'text-apex-green' : 'text-apex-red',
                  )}
                >
                  {signedPct(t.netEdge)}
                </td>

                {/* RESOLVES */}
                <td className="px-4 py-3.5 text-[13px] text-right tnum text-white/50">
                  {durationUntil(t.resolutionDate)}
                </td>

                {/* STATUS */}
                <td className="px-4 py-3.5 text-[13px]">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Closed history table ──────────────────────────────────────────────────────

function ClosedHistoryTable({ trades }: { trades: Trade[] }) {
  const closed = trades
    .filter(isClosed)
    .sort(
      (a, b) =>
        new Date(b.closedAt ?? b.queuedAt).getTime() -
        new Date(a.closedAt ?? a.queuedAt).getTime(),
    )
    .slice(0, 20);

  if (!closed.length) {
    return <EmptyState>No closed trades yet</EmptyState>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[11px] font-medium text-white/40 border-b border-white/[0.06]">
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Dir</th>
            <th className="px-4 py-3 font-medium text-right">Exit</th>
            <th className="px-4 py-3 font-medium text-right">P&amp;L</th>
            <th className="px-4 py-3 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {closed.map((t) => (
            <tr
              key={t.id}
              className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* MARKET */}
              <td className="px-4 py-3.5 text-[13px] max-w-[280px]">
                <div className="truncate text-white/70 leading-tight" title={t.question}>
                  {t.question}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  {t.category}
                </div>
              </td>

              {/* DIR */}
              <td className="px-4 py-3.5 text-[13px]">
                <span
                  className={clsx(
                    'font-semibold',
                    t.direction === 'YES' ? 'text-apex-green' : 'text-apex-red',
                  )}
                >
                  {t.direction}
                </span>
              </td>

              {/* EXIT */}
              <td className="px-4 py-3.5 text-[13px] text-right tnum text-white/50">
                {t.exitPrice != null ? cents(t.exitPrice) : '—'}
              </td>

              {/* P&L */}
              <td className={clsx('px-4 py-3.5 text-[13px] text-right tnum font-semibold', pnlColor(t.pnl ?? null))}>
                {t.pnl != null ? signedUsd(t.pnl) : '—'}
              </td>

              {/* REASON */}
              <td className="px-4 py-3.5 text-[13px] text-white/40">
                {t.closeReason ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Position Limits card ──────────────────────────────────────────────────────

function PositionLimitsCard({ openCount }: { openCount: number }) {
  const cap = RISK.maxConcurrent;
  const ratio = cap > 0 ? openCount / cap : 0;
  const limitColor =
    ratio >= 1
      ? 'text-apex-red'
      : ratio >= 0.8
        ? 'text-apex-amber'
        : 'text-white/80';

  return (
    <Card className="p-5">
      <SectionTitle>Position limits</SectionTitle>
      <div className="space-y-3">
        {/* Open / Max row */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-white/45">Open / Max</span>
          <span className={clsx('text-2xl font-semibold tnum', limitColor)}>
            {openCount} / {cap}
          </span>
        </div>

        {/* Portfolio cap row */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-white/45">Portfolio cap</span>
          <span className="text-[13px] tnum text-white/60">
            {pct(RISK.maxPortfolioPct, 0)}
          </span>
        </div>

        {/* Category cap row */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-white/45">Category cap</span>
          <span className="text-[13px] tnum text-white/60">
            {pct(RISK.maxCategoryPct, 0)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                ratio >= 1
                  ? 'bg-apex-red'
                  : ratio >= 0.8
                    ? 'bg-apex-amber'
                    : 'bg-apex-green',
              )}
              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Note */}
        <p className="text-[11px] text-white/40 leading-relaxed pt-1">
          {ratio >= 1
            ? 'Position cap reached — new trades blocked until a position closes.'
            : ratio >= 0.8
              ? 'Approaching position cap — Kelly sizing may be reduced.'
              : 'Capacity available for new positions subject to edge filters.'}
        </p>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PositionsPage() {
  const { trades, bankroll, health } = useApex();

  const openTrades = trades.filter(isOpen);
  const openCount = openTrades.length;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <TopBar
        title="Positions"
        subtitle="Live open positions & risk constraints"
      />

      <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-8">
        {/* ── Main grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Exposure chart */}
            <Card className="p-5">
              <SectionTitle>Category exposure</SectionTitle>
              <ExposureChart
                trades={trades}
                bankroll={bankroll?.current ?? health?.walletBalance ?? 0}
                categoryCap={RISK.maxCategoryPct}
              />
            </Card>

            {/* Open Positions table */}
            <div>
              <SectionTitle
                right={
                  <span className="text-[11px] text-white/40 tnum">
                    {openCount} position{openCount !== 1 ? 's' : ''}
                  </span>
                }
              >
                Open positions
              </SectionTitle>
              <Card>
                <OpenPositionsTable trades={trades} />
              </Card>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="space-y-6">
            <RiskPanel />
            <PositionLimitsCard openCount={openCount} />
          </div>
        </div>

        {/* ── Closed History ────────────────────────────────────── */}
        <div>
          <SectionTitle
            right={
              <span className="text-[11px] text-white/40 tnum">
                {trades.filter(isClosed).length} total
              </span>
            }
          >
            Closed history
          </SectionTitle>
          <Card>
            <ClosedHistoryTable trades={trades} />
          </Card>
        </div>
      </div>
    </div>
  );
}
