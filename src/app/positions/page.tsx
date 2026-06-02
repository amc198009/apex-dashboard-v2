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
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[9px] tracking-[0.15em] text-white/30 uppercase border-b border-white/8">
            <th className="py-2.5 px-2 text-left font-normal">Market</th>
            <th className="py-2.5 px-2 text-left font-normal">Dir</th>
            <th className="py-2.5 px-2 text-right font-normal tabular-nums">Entry</th>
            <th className="py-2.5 px-2 text-right font-normal tabular-nums">Size</th>
            <th className="py-2.5 px-2 text-right font-normal tabular-nums">Edge</th>
            <th className="py-2.5 px-2 text-right font-normal">Resolves</th>
            <th className="py-2.5 px-2 text-left font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {open.map((t) => {
            const upnl = unrealizedPnl(t);
            return (
              <tr
                key={t.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                {/* MARKET */}
                <td className="py-3 px-2 max-w-[260px]">
                  <div className="truncate text-white/80 leading-tight" title={t.question}>
                    {t.question}
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5 tracking-wider">
                    {t.category}
                    {t.signalTier != null && (
                      <span className="ml-1.5 text-white/20">T{t.signalTier}</span>
                    )}
                  </div>
                </td>

                {/* DIR */}
                <td className="py-3 px-2">
                  <span
                    className={clsx(
                      'text-[10px] font-semibold tracking-wider',
                      t.direction === 'YES' ? 'text-apex-green' : 'text-apex-red',
                    )}
                  >
                    {t.direction}
                  </span>
                </td>

                {/* ENTRY */}
                <td className="py-3 px-2 text-right tabular-nums text-white/70">
                  {cents(t.entryPrice)}
                </td>

                {/* SIZE + unrealized P&L */}
                <td className="py-3 px-2 text-right tabular-nums">
                  <div className="text-white/80">{usd(t.allocationUsdc)}</div>
                  <div className="text-[9px] text-white/30">
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
                    'py-3 px-2 text-right tabular-nums',
                    t.netEdge >= 0 ? 'text-apex-green' : 'text-apex-red',
                  )}
                >
                  {signedPct(t.netEdge)}
                </td>

                {/* RESOLVES */}
                <td className="py-3 px-2 text-right tabular-nums text-white/50">
                  {durationUntil(t.resolutionDate)}
                </td>

                {/* STATUS */}
                <td className="py-3 px-2">
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
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[9px] tracking-[0.15em] text-white/30 uppercase border-b border-white/8">
            <th className="py-2.5 px-2 text-left font-normal">Market</th>
            <th className="py-2.5 px-2 text-left font-normal">Dir</th>
            <th className="py-2.5 px-2 text-right font-normal tabular-nums">Exit</th>
            <th className="py-2.5 px-2 text-right font-normal tabular-nums">P&amp;L</th>
            <th className="py-2.5 px-2 text-left font-normal">Reason</th>
          </tr>
        </thead>
        <tbody>
          {closed.map((t) => (
            <tr
              key={t.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              {/* MARKET */}
              <td className="py-3 px-2 max-w-[280px]">
                <div className="truncate text-white/70 leading-tight" title={t.question}>
                  {t.question}
                </div>
                <div className="text-[9px] text-white/25 mt-0.5 tracking-wider">
                  {t.category}
                </div>
              </td>

              {/* DIR */}
              <td className="py-3 px-2">
                <span
                  className={clsx(
                    'text-[10px] font-semibold tracking-wider',
                    t.direction === 'YES' ? 'text-apex-green' : 'text-apex-red',
                  )}
                >
                  {t.direction}
                </span>
              </td>

              {/* EXIT */}
              <td className="py-3 px-2 text-right tabular-nums text-white/50">
                {t.exitPrice != null ? cents(t.exitPrice) : '—'}
              </td>

              {/* P&L */}
              <td className={clsx('py-3 px-2 text-right tabular-nums font-semibold', pnlColor(t.pnl ?? null))}>
                {t.pnl != null ? signedUsd(t.pnl) : '—'}
              </td>

              {/* REASON */}
              <td className="py-3 px-2 text-white/35 text-[10px] tracking-wide uppercase">
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
      <SectionTitle>Position Limits</SectionTitle>
      <div className="space-y-3">
        {/* Open / Max row */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40 tracking-wide">Open / Max</span>
          <span className={clsx('font-semibold tabular-nums font-mono', limitColor)}>
            {openCount} / {cap}
          </span>
        </div>

        {/* Portfolio cap row */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40 tracking-wide">Portfolio Cap</span>
          <span className="text-white/60 tabular-nums font-mono">
            {pct(RISK.maxPortfolioPct, 0)}
          </span>
        </div>

        {/* Category cap row */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40 tracking-wide">Category Cap</span>
          <span className="text-white/60 tabular-nums font-mono">
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
        <p className="text-[9px] text-white/20 tracking-wide leading-relaxed pt-1">
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
  const { trades, bankroll } = useApex();

  const openTrades = trades.filter(isOpen);
  const openCount = openTrades.length;

  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <TopBar
        title="POSITIONS"
        subtitle="Live open positions & risk constraints"
      />

      <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-6">
        {/* ── Main grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Exposure chart */}
            <Card className="p-5">
              <SectionTitle>Category Exposure</SectionTitle>
              <ExposureChart
                trades={trades}
                bankroll={bankroll?.current ?? 0}
                categoryCap={RISK.maxCategoryPct}
              />
            </Card>

            {/* Open Positions table */}
            <div>
              <SectionTitle
                right={
                  <span className="text-[9px] text-white/25 tabular-nums">
                    {openCount} position{openCount !== 1 ? 's' : ''}
                  </span>
                }
              >
                Open Positions
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
              <span className="text-[9px] text-white/25 tabular-nums">
                {trades.filter(isClosed).length} total
              </span>
            }
          >
            Closed History
          </SectionTitle>
          <Card>
            <ClosedHistoryTable trades={trades} />
          </Card>
        </div>
      </div>
    </div>
  );
}
