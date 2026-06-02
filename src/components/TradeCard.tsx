'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Trade } from '../lib/api';
import { useApex } from '../lib/store';
import { Button, StatusBadge, Spinner, pnlColor } from './ui';
import { usd, signedUsd, pct, signedPct, cents, dateShort, durationUntil, shortId } from '../lib/format';

const DIR_COLOR: Record<string, string> = { YES: 'text-apex-green', NO: 'text-apex-red' };

export function TradeCard({ trade }: { trade: Trade }) {
  const { approve, cancel, busyId } = useApex();
  const [expanded, setExpanded] = useState(false);
  const busy = busyId === trade.id;

  const isPending = trade.status === 'PENDING_APPROVAL';
  const isOpen = trade.status === 'OPEN' || trade.status === 'EXECUTING';
  const isClosed = trade.status === 'CLOSED';

  return (
    <div className={clsx(
      'rounded-lg border transition-all animate-fade-in',
      isPending ? 'border-apex-amber/30 bg-apex-amber/[0.04]' :
      isOpen ? 'border-apex-green/25 bg-apex-green/[0.04]' :
      isClosed ? 'border-white/8 bg-transparent' :
      trade.status === 'FAILED' ? 'border-apex-red/25 bg-apex-red/[0.04]' :
      'border-white/6',
    )}>
      <div className="px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 leading-snug mb-2 line-clamp-2">{trade.question}</div>
            <div className="flex items-center gap-x-3 gap-y-1 text-[10px] text-white/40 flex-wrap">
              <span className={clsx('font-semibold text-[11px]', DIR_COLOR[trade.direction] ?? '')}>{trade.direction}</span>
              <span className="text-white/25">·</span>
              <span>T{trade.signalTier}</span>
              <span>{trade.category}</span>
              <span>entry {cents(trade.entryPrice)}</span>
              <span>prob {pct(trade.estimatedProbability)}</span>
              <span className={trade.netEdge > 0.1 ? 'text-apex-green' : 'text-apex-amber'}>edge {signedPct(trade.netEdge)}</span>
              <span>kelly {trade.kellyFractionLabel}</span>
              {isOpen && <span className="text-white/50">resolves {durationUntil(trade.resolutionDate)}</span>}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[8px] text-white/30 tracking-wider">SIZE</div>
              <div className="text-sm font-semibold text-white/85 tabular-nums">{usd(trade.allocationUsdc)}</div>
              <div className="text-[8px] text-white/30">{pct(trade.allocationPct, 2)} bankroll</div>
            </div>

            {isClosed && trade.pnl != null && (
              <div className="text-right">
                <div className="text-[8px] text-white/30 tracking-wider">P&L</div>
                <div className={clsx('text-sm font-semibold tabular-nums', pnlColor(trade.pnl))}>{signedUsd(trade.pnl)}</div>
                {trade.closeReason && <div className="text-[8px] text-white/30">{trade.closeReason}</div>}
              </div>
            )}

            <StatusBadge status={trade.status} />

            {isPending && (
              <div className="flex gap-2">
                <Button size="sm" variant="danger" disabled={busy} onClick={e => { e.stopPropagation(); cancel(trade.id); }}>
                  {busy ? <Spinner /> : '✕'}
                </Button>
                <Button size="sm" variant="approve" disabled={busy} onClick={e => { e.stopPropagation(); approve(trade.id); }}>
                  {busy ? <><Spinner /> EXEC</> : '✓ APPROVE'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/8 px-4 py-3 space-y-2 text-[11px] text-white/50 animate-fade-in">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <Row label="Market ID" value={shortId(trade.marketId)} />
            <Row label="Trade ID" value={shortId(trade.id)} />
            <Row label="Resolution" value={dateShort(trade.resolutionDate)} />
            <Row label="Queued" value={dateShort(trade.queuedAt)} />
            {trade.approvedAt && <Row label="Approved" value={dateShort(trade.approvedAt)} />}
            {trade.orderId && <Row label="Order ID" value={shortId(trade.orderId)} />}
            {trade.exitPrice != null && <Row label="Exit Price" value={cents(trade.exitPrice)} />}
            {trade.failureReason && <Row label="Failure" value={trade.failureReason} danger />}
          </div>
          {trade.counterArgument && (
            <div className="mt-2 pt-2 border-t border-white/8">
              <span className="text-white/30 tracking-wider text-[9px]">STRONGEST COUNTER ⚠ </span>
              <span className="italic text-apex-amber/80">{trade.counterArgument}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-white/25 min-w-[90px]">{label}</span>
      <span className={clsx('truncate', danger ? 'text-apex-red' : 'text-white/65')}>{value}</span>
    </div>
  );
}
