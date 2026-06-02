'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Trade, type HealthResponse, type CalibrationSummary, type BankrollStats } from '../lib/api';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'text-apex-amber border-apex-amber/40 bg-apex-amber/10',
  APPROVED:         'text-blue-400 border-blue-400/40 bg-blue-400/10',
  EXECUTING:        'text-blue-300 border-blue-300/40 bg-blue-300/10',
  OPEN:             'text-apex-green border-apex-green/40 bg-apex-green/10',
  CLOSED:           'text-white/40 border-white/20 bg-white/5',
  FAILED:           'text-apex-red border-apex-red/40 bg-apex-red/10',
  CANCELLED:        'text-white/30 border-white/10 bg-transparent',
};

const DIRECTION_COLOR: Record<string, string> = {
  YES: 'text-apex-green',
  NO:  'text-apex-red',
};

export default function Dashboard() {
  const [health, setHealth]           = useState<HealthResponse | null>(null);
  const [trades, setTrades]           = useState<Trade[]>([]);
  const [summary, setSummary]         = useState({ pending: 0, open: 0, closed: 0, failed: 0 });
  const [calibration, setCalibration] = useState<CalibrationSummary | null>(null);
  const [bankroll, setBankroll]       = useState<BankrollStats | null>(null);
  const [activeTab, setActiveTab]     = useState<'PENDING_APPROVAL' | 'OPEN' | 'CLOSED' | 'ALL'>('PENDING_APPROVAL');
  const [approving, setApproving]     = useState<string | null>(null);
  const [cancelling, setCancelling]   = useState<string | null>(null);
  const [scanning, setScanning]       = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [queueRes, healthRes] = await Promise.all([api.queue(), api.health()]);
      setTrades(queueRes.trades);
      setSummary(queueRes.summary);
      setHealth(healthRes);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Refresh failed', err);
    }
  }, []);

  const loadCalibration = useCallback(async () => {
    try { setCalibration(await api.calibration()); } catch { /* no data yet */ }
  }, []);

  const loadBankroll = useCallback(async () => {
    try { setBankroll(await api.bankroll()); } catch { /* wallet not configured */ }
  }, []);

  useEffect(() => {
    refresh();
    loadCalibration();
    loadBankroll();
    // Poll every 8 seconds for live updates
    pollRef.current = setInterval(refresh, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh, loadCalibration, loadBankroll]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await api.approve(id);
      await refresh();
    } catch (err) {
      console.error('Approve failed', err);
    } finally {
      setApproving(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.cancel(id);
      await refresh();
    } catch (err) {
      console.error('Cancel failed', err);
    } finally {
      setCancelling(null);
    }
  };

  const handleScanTrigger = async () => {
    setScanning(true);
    try { await api.scanTrigger(); } catch { /* silent */ }
    setTimeout(() => { setScanning(false); refresh(); }, 3000);
  };

  const filteredTrades = activeTab === 'ALL'
    ? trades
    : trades.filter(t => t.status === activeTab);

  const pendingTrades = trades.filter(t => t.status === 'PENDING_APPROVAL');
  const openTrades    = trades.filter(t => t.status === 'OPEN' || t.status === 'EXECUTING');
  const totalPnl      = trades.filter(t => t.pnl != null).reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white/90">

      {/* Drawdown Banner */}
      {health?.drawdownActive && (
        <div className="bg-apex-red/20 border-b border-apex-red/40 px-6 py-2 text-center text-apex-red text-[11px] tracking-[0.2em] animate-pulse">
          ⚠  DRAWDOWN PROTOCOL ACTIVE — KELLY FRACTIONS HALVED
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="text-apex-red text-xl font-semibold tracking-[0.2em]">APEX</div>
            <div className="text-white/30 text-[10px] tracking-[0.15em] mt-0.5">AUTONOMOUS POLYMARKET EDGE v2.0</div>
          </div>
          <div className="flex items-center gap-6">
            {/* Compounding bankroll */}
            {bankroll && (
              <div className="text-right border-r border-white/8 pr-6">
                <div className="text-[9px] text-white/30 tracking-wider">BANKROLL</div>
                <div className="text-sm font-semibold text-white/80">${bankroll.current.toFixed(2)}</div>
                <div className={clsx('text-[9px]', bankroll.totalGrowthPct >= 0 ? 'text-apex-green' : 'text-apex-red')}>
                  {bankroll.totalGrowthPct >= 0 ? '+' : ''}{bankroll.totalGrowthPct.toFixed(1)}% growth
                </div>
              </div>
            )}
            {/* Wallet balance */}
            {health?.walletBalance != null && (
              <div className="text-right">
                <div className="text-[9px] text-white/30 tracking-wider">WALLET</div>
                <div className="text-sm font-semibold text-white/80">${health.walletBalance.toFixed(2)} USDC</div>
              </div>
            )}
            {/* Portfolio exposure */}
            <div className="text-right">
              <div className="text-[9px] text-white/30 tracking-wider">EXPOSURE</div>
              <div className="text-sm font-semibold text-white/80">{health?.portfolioExposure ?? '—'}</div>
            </div>
            {/* Session PnL */}
            <div className="text-right">
              <div className="text-[9px] text-white/30 tracking-wider">SESSION P&L</div>
              <div className={clsx('text-sm font-semibold', totalPnl >= 0 ? 'text-apex-green' : 'text-apex-red')}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
            </div>
            {/* Agent status */}
            <div className="flex items-center gap-2 border border-white/10 rounded px-3 py-1.5">
              <div className={clsx('w-1.5 h-1.5 rounded-full',
                health?.status === 'online' ? 'bg-apex-green animate-pulse' : 'bg-apex-red')} />
              <span className="text-[10px] tracking-widest text-white/50">
                {health?.status === 'online' ? 'AGENT ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'PENDING',   value: summary.pending,  color: 'text-apex-amber' },
            { label: 'OPEN',      value: summary.open,     color: 'text-apex-green' },
            { label: 'CLOSED',    value: summary.closed,   color: 'text-white/60' },
            { label: 'FAILED',    value: summary.failed,   color: 'text-apex-red' },
            { label: 'BRIER SCORE', value: calibration?.avgBrierScore?.toFixed(3) ?? '—', color: 'text-white/60' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/8 rounded p-3">
              <div className="text-[9px] text-white/30 tracking-[0.12em] mb-1">{label}</div>
              <div className={clsx('text-2xl font-semibold', color)}>{value}</div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['PENDING_APPROVAL', 'OPEN', 'CLOSED', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'text-[10px] tracking-widest px-3 py-1.5 rounded border transition-all',
                  activeTab === tab
                    ? 'border-white/30 text-white/90 bg-white/8'
                    : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/60'
                )}
              >
                {tab.replace('_', ' ')}
                {tab === 'PENDING_APPROVAL' && summary.pending > 0 && (
                  <span className="ml-1.5 bg-apex-amber text-black text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                    {summary.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-white/20 tracking-wider">
              refreshed {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleScanTrigger}
              disabled={scanning}
              className={clsx(
                'text-[10px] tracking-widest px-4 py-1.5 border rounded transition-all',
                scanning
                  ? 'border-white/10 text-white/20 cursor-not-allowed'
                  : 'border-apex-red/60 text-apex-red hover:bg-apex-red/10'
              )}
            >
              {scanning ? '◌ SCANNING...' : '▶ TRIGGER SCAN'}
            </button>
          </div>
        </div>

        {/* Trade list */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/8 rounded text-white/20 text-[12px]">
            {activeTab === 'PENDING_APPROVAL'
              ? 'No pending approvals — agent is scanning markets autonomously'
              : `No ${activeTab.toLowerCase().replace('_', ' ')} trades`}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTrades.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onApprove={handleApprove}
                onCancel={handleCancel}
                approving={approving === trade.id}
                cancelling={cancelling === trade.id}
              />
            ))}
          </div>
        )}

        {/* Calibration footer */}
        {calibration && (
          <div className="mt-8 border-t border-white/8 pt-4 grid grid-cols-4 gap-4 text-[10px] text-white/30">
            <div>
              <span className="tracking-wider">CALIBRATION</span>
              <span className={clsx('ml-2', calibration.calibrationGrade === 'Excellent' || calibration.calibrationGrade === 'Good' ? 'text-apex-green' : 'text-apex-amber')}>
                {calibration.calibrationGrade}
              </span>
            </div>
            <div>RESOLVED: {calibration.totalResolved}</div>
            <div>LOSSES: {calibration.sessionLossCount}</div>
            <div>DRAWDOWN: <span className={calibration.drawdownActive ? 'text-apex-red' : 'text-apex-green'}>{calibration.drawdownActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TradeCard component
// ---------------------------------------------------------------------------

function TradeCard({
  trade,
  onApprove,
  onCancel,
  approving,
  cancelling,
}: {
  trade: Trade;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  approving: boolean;
  cancelling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending  = trade.status === 'PENDING_APPROVAL';
  const isOpen     = trade.status === 'OPEN' || trade.status === 'EXECUTING';
  const isClosed   = trade.status === 'CLOSED';

  return (
    <div className={clsx(
      'border rounded transition-all',
      isPending ? 'border-apex-amber/30 bg-apex-amber/5' :
      isOpen    ? 'border-apex-green/25 bg-apex-green/5' :
      isClosed  ? 'border-white/8 bg-transparent' :
      trade.status === 'FAILED' ? 'border-apex-red/25 bg-apex-red/5' :
      'border-white/5'
    )}>
      {/* Main row */}
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: question + meta */}
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 leading-snug mb-2 truncate">{trade.question}</div>
            <div className="flex items-center gap-3 text-[10px] text-white/40 flex-wrap">
              <span className={clsx('font-semibold text-[11px]', DIRECTION_COLOR[trade.direction] ?? '')}>{trade.direction}</span>
              <span>T{trade.signalTier}</span>
              <span>{trade.category}</span>
              <span>entry: {(trade.entryPrice * 100).toFixed(0)}¢</span>
              <span>prob: {(trade.estimatedProbability * 100).toFixed(1)}%</span>
              <span className={trade.netEdge > 0.07 ? 'text-apex-green' : 'text-apex-amber'}>
                edge: +{(trade.netEdge * 100).toFixed(1)}%
              </span>
              <span>kelly: {trade.kellyFractionLabel}</span>
            </div>
          </div>

          {/* Right: size + status + actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[9px] text-white/30 tracking-wider">POSITION</div>
              <div className="text-sm font-semibold text-white/80">${trade.allocationUsdc?.toFixed(2)}</div>
              <div className="text-[9px] text-white/30">{(trade.allocationPct * 100).toFixed(2)}% bankroll</div>
            </div>

            {/* PnL if closed */}
            {isClosed && trade.pnl != null && (
              <div className="text-right">
                <div className="text-[9px] text-white/30 tracking-wider">P&L</div>
                <div className={clsx('text-sm font-semibold', trade.pnl >= 0 ? 'text-apex-green' : 'text-apex-red')}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </div>
                {trade.closeReason && <div className="text-[9px] text-white/30">{trade.closeReason}</div>}
              </div>
            )}

            {/* Status badge */}
            <span className={clsx('text-[9px] px-2 py-0.5 border rounded tracking-wider', STATUS_COLORS[trade.status] ?? '')}>
              {trade.status === 'EXECUTING' ? '◌ EXECUTING' : trade.status.replace('_', ' ')}
            </span>

            {/* Approve / Cancel buttons (pending only) */}
            {isPending && (
              <div className="flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); onCancel(trade.id); }}
                  disabled={cancelling || approving}
                  className="text-[10px] tracking-wider px-3 py-1.5 border border-white/15 text-white/40 rounded hover:border-apex-red/60 hover:text-apex-red transition-all disabled:opacity-30"
                >
                  {cancelling ? '◌' : '✕'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onApprove(trade.id); }}
                  disabled={approving || cancelling}
                  className="text-[10px] tracking-[0.1em] px-4 py-1.5 bg-apex-green/20 border border-apex-green/50 text-apex-green rounded hover:bg-apex-green/30 transition-all disabled:opacity-30 font-semibold"
                >
                  {approving ? '◌ EXECUTING...' : '✓ APPROVE'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/8 px-4 py-3 space-y-2 text-[11px] text-white/50">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <Row label="Market ID" value={trade.marketId} />
            <Row label="Trade ID" value={trade.id} />
            <Row label="Resolution" value={new Date(trade.resolutionDate).toLocaleDateString()} />
            <Row label="Queued" value={new Date(trade.queuedAt).toLocaleString()} />
            {trade.approvedAt && <Row label="Approved" value={new Date(trade.approvedAt).toLocaleString()} />}
            {trade.orderId && <Row label="Order ID" value={trade.orderId} />}
            {trade.exitPrice && <Row label="Exit Price" value={`${(trade.exitPrice * 100).toFixed(0)}¢`} />}
            {trade.failureReason && <Row label="Failure" value={trade.failureReason} highlight="red" />}
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

function Row({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-white/25 min-w-[90px]">{label}</span>
      <span className={clsx(highlight === 'red' ? 'text-apex-red' : 'text-white/60')}>{value}</span>
    </div>
  );
}
