'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Trade } from '../lib/api';
import { useApex } from '../lib/store';
import { Button, HoldButton, StatusBadge, Spinner, pnlColor } from './ui';
import { usd, signedUsd, pct, signedPct, cents, dateShort, durationUntil, shortId } from '../lib/format';

const DIR_STYLE: Record<string, string> = {
  YES: 'text-apex-green bg-apex-green/10 ring-1 ring-apex-green/20',
  NO: 'text-apex-red bg-apex-red/10 ring-1 ring-apex-red/20',
};

export function TradeCard({ trade }: { trade: Trade }) {
  const { approve, cancel, busyId } = useApex();
  const [expanded, setExpanded] = useState(false);
  const busy = busyId === trade.id;

  const isPending = trade.status === 'PENDING_APPROVAL';
  const isOpen = trade.status === 'OPEN' || trade.status === 'EXECUTING';
  const isClosed = trade.status === 'CLOSED';

  return (
    <div className={clsx(
      'rounded-2xl border bg-apex-surface/70 shadow-card transition-all animate-fade-in',
      isPending ? 'border-apex-amber/25' :
      isOpen ? 'border-apex-green/20' :
      trade.status === 'FAILED' ? 'border-apex-red/20' :
      'border-white/[0.06]',
    )}>
      <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-md', DIR_STYLE[trade.direction] ?? '')}>{trade.direction}</span>
              <span className="text-[14px] text-white/90 font-medium leading-snug line-clamp-1">{trade.question}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[12px] text-white/45 flex-wrap">
              <Meta>Tier {trade.signalTier}</Meta>
              <Dot /><Meta>{trade.category}</Meta>
              <Dot /><Meta>entry <b className="text-white/70 font-medium tnum">{cents(trade.entryPrice)}</b></Meta>
              <Dot /><Meta>prob <b className="text-white/70 font-medium tnum">{pct(trade.estimatedProbability)}</b></Meta>
              <Dot /><span className={clsx('font-medium', trade.netEdge > 0.1 ? 'text-apex-green' : 'text-apex-amber')}>edge {signedPct(trade.netEdge)}</span>
              {isOpen && <><Dot /><Meta>resolves <b className="text-white/70 font-medium">{durationUntil(trade.resolutionDate)}</b></Meta></>}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-white/35 font-medium">Size</div>
              <div className="text-[15px] font-semibold text-white tnum mt-0.5">{usd(trade.allocationUsdc)}</div>
              <div className="text-[10px] text-white/35 tnum">{pct(trade.allocationPct, 2)}</div>
            </div>

            {isClosed && trade.pnl != null && (
              <div className="text-right">
                <div className="text-[10px] text-white/35 font-medium">P&L</div>
                <div className={clsx('text-[15px] font-semibold tnum mt-0.5', pnlColor(trade.pnl))}>{signedUsd(trade.pnl)}</div>
                {trade.closeReason && <div className="text-[10px] text-white/35">{trade.closeReason}</div>}
              </div>
            )}

            <StatusBadge status={trade.status} />

            {isPending && (
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="danger" disabled={busy} onClick={e => { e.stopPropagation(); cancel(trade.id); }}>
                  {busy ? <Spinner /> : '✕'}
                </Button>
                <HoldButton
                  busy={busy}
                  disabled={busy}
                  onConfirm={() => approve(trade.id)}
                  idleLabel={<>✓ Hold to approve</>}
                  busyLabel={<><Spinner /> Executing</>}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4 grid grid-cols-2 gap-x-10 gap-y-2 text-[12px] animate-fade-in">
          {/* Decision breakdown — the agent's reasoning at a glance */}
          <div className="col-span-2 mb-2 rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-medium text-white/45">Decision breakdown</span>
              <span className="text-[11px] text-white/40">Tier {trade.signalTier} · Kelly {trade.kellyFractionLabel}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-white/45">Net edge</span>
              <span className={clsx('tnum font-medium', trade.netEdge >= 0.1 ? 'text-apex-green' : 'text-apex-amber')}>{signedPct(trade.netEdge)}</span>
            </div>
            {/* edge meter — fill vs. the 7% minimum-edge floor (scale 0–25%) */}
            <div className="relative h-7 rounded-lg bg-apex-bg-2 ring-1 ring-white/[0.06] overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-r-lg bg-gradient-to-r from-apex-green/50 to-apex-green transition-all duration-500"
                style={{ width: `${Math.min(Math.max(trade.netEdge / 0.25, 0.03), 1) * 100}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-apex-amber z-[2]" style={{ left: `${(0.07 / 0.25) * 100}%` }} />
              <span className="absolute bottom-0.5 text-[9px] tnum text-apex-amber z-[2]" style={{ left: `${(0.07 / 0.25) * 100}%`, transform: 'translateX(4px)' }}>7% floor</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Stat k="Model prob" v={pct(trade.estimatedProbability)} />
              <Stat k="Entry" v={cents(trade.entryPrice)} />
              <Stat k="Allocation" v={pct(trade.allocationPct, 2)} />
            </div>
          </div>
          <Row label="Market ID" value={shortId(trade.marketId)} />
          <Row label="Trade ID" value={shortId(trade.id)} />
          <Row label="Resolution" value={dateShort(trade.resolutionDate)} />
          <Row label="Queued" value={dateShort(trade.queuedAt)} />
          {trade.approvedAt && <Row label="Approved" value={dateShort(trade.approvedAt)} />}
          {trade.orderId && <Row label="Order ID" value={shortId(trade.orderId)} />}
          {trade.exitPrice != null && <Row label="Exit price" value={cents(trade.exitPrice)} />}
          {trade.failureReason && <Row label="Failure" value={trade.failureReason} danger />}
          {trade.counterArgument && (
            <div className="col-span-2 mt-1 pt-3 border-t border-white/[0.06]">
              <span className="text-apex-amber/80 text-[11px] font-semibold">Strongest counter</span>
              <p className="text-white/55 italic mt-1 leading-relaxed">{trade.counterArgument}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}
function Dot() {
  return <span className="text-white/20">·</span>;
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/35">{k}</div>
      <div className="text-[13px] font-medium text-white/80 tnum mt-0.5">{v}</div>
    </div>
  );
}
function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-white/35 min-w-[92px]">{label}</span>
      <span className={clsx('truncate font-medium', danger ? 'text-apex-red' : 'text-white/70')}>{value}</span>
    </div>
  );
}
