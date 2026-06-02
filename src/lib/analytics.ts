// APEX v2 — derived analytics computed from trade history.
// All selectors are pure functions over the typed /api/queue data so the
// dashboard stays correct even when optional backend endpoints are absent.

import type { Trade, CalibrationSummary } from './api';

export const isOpen = (t: Trade) => t.status === 'OPEN' || t.status === 'EXECUTING';
export const isClosed = (t: Trade) => t.status === 'CLOSED';
export const isResolved = (t: Trade) => t.pnl != null && (t.status === 'CLOSED');

// ── Cumulative P&L curve over closed trades ───────────────────────────────────
export interface PnlPoint { t: number; label: string; pnl: number; cumulative: number; id: string; }

export function cumulativePnl(trades: Trade[]): PnlPoint[] {
  const closed = trades
    .filter(t => t.pnl != null)
    .sort((a, b) => new Date(a.closedAt ?? a.queuedAt).getTime() - new Date(b.closedAt ?? b.queuedAt).getTime());
  let run = 0;
  return closed.map(t => {
    run += t.pnl ?? 0;
    const when = new Date(t.closedAt ?? t.queuedAt);
    return {
      t: when.getTime(),
      label: when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: t.pnl ?? 0,
      cumulative: Number(run.toFixed(2)),
      id: t.id,
    };
  });
}

// ── Win / loss summary ────────────────────────────────────────────────────────
export interface WinStats {
  resolved: number;
  wins: number;
  losses: number;
  winRate: number;       // 0..1
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;  // gross win / gross loss
  bestTrade: number;
  worstTrade: number;
}

export function winStats(trades: Trade[]): WinStats {
  const resolved = trades.filter(t => t.pnl != null);
  const wins = resolved.filter(t => (t.pnl ?? 0) > 0);
  const losses = resolved.filter(t => (t.pnl ?? 0) < 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const pnls = resolved.map(t => t.pnl ?? 0);
  return {
    resolved: resolved.length,
    wins: wins.length,
    losses: losses.length,
    winRate: resolved.length ? wins.length / resolved.length : 0,
    totalPnl: Number((grossWin - grossLoss).toFixed(2)),
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
  };
}

// ── Exposure by category (open positions) vs caps ─────────────────────────────
export interface ExposureRow { category: string; usdc: number; pct: number; count: number; }

export function exposureByCategory(trades: Trade[], bankroll: number): ExposureRow[] {
  const open = trades.filter(isOpen);
  const map = new Map<string, { usdc: number; count: number }>();
  for (const t of open) {
    const k = t.category || 'UNCATEGORIZED';
    const cur = map.get(k) ?? { usdc: 0, count: 0 };
    cur.usdc += t.allocationUsdc ?? 0;
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      usdc: Number(v.usdc.toFixed(2)),
      pct: bankroll > 0 ? v.usdc / bankroll : 0,
      count: v.count,
    }))
    .sort((a, b) => b.usdc - a.usdc);
}

export function totalExposure(trades: Trade[], bankroll: number): { usdc: number; pct: number } {
  const usdc = trades.filter(isOpen).reduce((s, t) => s + (t.allocationUsdc ?? 0), 0);
  return { usdc: Number(usdc.toFixed(2)), pct: bankroll > 0 ? usdc / bankroll : 0 };
}

// ── Signal tier distribution ──────────────────────────────────────────────────
export interface TierRow { tier: string; count: number; }
export function tierDistribution(trades: Trade[]): TierRow[] {
  const map = new Map<number, number>();
  for (const t of trades) map.set(t.signalTier, (map.get(t.signalTier) ?? 0) + 1);
  return [1, 2, 3, 4].map(tier => ({ tier: `T${tier}`, count: map.get(tier) ?? 0 }));
}

// ── Edge distribution buckets ────────────────────────────────────────────────
export interface EdgeBucket { range: string; count: number; }
export function edgeBuckets(trades: Trade[]): EdgeBucket[] {
  const buckets: Record<string, number> = { '7–10%': 0, '10–15%': 0, '15–20%': 0, '20%+': 0 };
  for (const t of trades) {
    const e = t.netEdge;
    if (e < 0.1) buckets['7–10%']++;
    else if (e < 0.15) buckets['10–15%']++;
    else if (e < 0.2) buckets['15–20%']++;
    else buckets['20%+']++;
  }
  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

// ── Calibration scatter (predicted vs actual per category) ────────────────────
export interface CalibrationPoint { category: string; predicted: number; actual: number; bias: number; count: number; }
export function calibrationScatter(cal: CalibrationSummary | null): CalibrationPoint[] {
  if (!cal?.categoryDrift) return [];
  return Object.entries(cal.categoryDrift).map(([category, d]) => ({
    category,
    predicted: d.avgPredicted,
    actual: d.avgActual,
    bias: d.bias,
    count: d.count,
  }));
}

// ── Unrealized P&L for an open position (needs a current mark) ────────────────
export function unrealizedPnl(t: Trade): number | null {
  if (!isOpen(t) || t.currentPrice == null || t.entryPrice == null) return null;
  const shares = t.allocationUsdc / t.entryPrice;
  return Number((shares * (t.currentPrice - t.entryPrice)).toFixed(2));
}
