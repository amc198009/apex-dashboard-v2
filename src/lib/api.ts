// APEX v2 Dashboard API Client

const BASE = process.env.NEXT_PUBLIC_APEX_API ?? 'http://localhost:3001/api';

async function apexFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const API_BASE = BASE;

export const api = {
  health:      () => apexFetch<HealthResponse>('/health'),
  queue:       (status?: string) => apexFetch<QueueResponse>(`/queue${status ? `?status=${status}` : ''}`),
  approve:     (id: string) => apexFetch<{ success: boolean; trade: Trade }>(`/queue/${id}/approve`, { method: 'POST' }),
  cancel:      (id: string) => apexFetch<{ success: boolean }>(`/queue/${id}/cancel`, { method: 'POST' }),
  scanTrigger: () => apexFetch<{ message: string }>('/scan/trigger', { method: 'POST' }),
  scanPreview: () => apexFetch<ScanPreview>('/scan'),
  positions:   () => apexFetch<PositionsResponse>('/positions'),
  wallet:      () => apexFetch<{ balance: number; currency: string }>('/wallet'),
  calibration: () => apexFetch<CalibrationSummary>('/calibration'),
  bankroll:    (sync = false) => apexFetch<BankrollStats>(`/bankroll${sync ? '?sync=true' : ''}`),
};

// ── Types ────────────────────────────────────────────────────────────────────

export type TradeStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'OPEN' | 'CLOSED' | 'FAILED' | 'CANCELLED';

export interface Trade {
  id: string;
  marketId: string;
  question: string;
  category: string;
  direction: 'YES' | 'NO';
  tokenId: string;
  entryPrice: number;
  estimatedProbability: number;
  netEdge: number;
  allocationPct: number;
  allocationUsdc: number;
  kellyFractionLabel: string;
  signalTier: number;
  resolutionDate: string;
  counterArgument: string;
  status: TradeStatus;
  queuedAt: string;
  approvedAt?: string;
  executedAt?: string;
  closedAt?: string;
  orderId?: string;
  exitPrice?: number;
  pnl?: number;
  failureReason?: string;
  closeReason?: string;
  // live mark (present on open positions if backend supplies it)
  currentPrice?: number;
}

export interface QueueSummary {
  pending: number;
  open: number;
  closed: number;
  failed: number;
}

export interface QueueResponse {
  trades: Trade[];
  summary: QueueSummary;
  drawdownActive: boolean;
  portfolioExposure: number;
}

export interface HealthResponse {
  status: string;
  agent: string;
  drawdownActive: boolean;
  openPositions: number;
  pendingApprovals: number;
  portfolioExposure: string;
  walletBalance: number | null;
  timestamp: string;
}

export interface CalibrationSummary {
  totalResolved: number;
  avgBrierScore: number;
  calibrationGrade: string;
  drawdownActive: boolean;
  sessionLossCount: number;
  categoryDrift: Record<string, { avgPredicted: number; avgActual: number; bias: number; count: number }>;
}

export interface BankrollStats {
  current: number;
  effective: number;
  starting: number;
  peak: number;
  totalGrowth: number;
  totalGrowthPct: number;
  drawdownFromPeak: number;
  reserveFraction: number;
  reserveAmount: number;
  lastSyncedAt: string | null;
}

// Loosely-typed (backend shape not fully pinned) — consumed defensively.
export interface PositionsResponse {
  positions?: Trade[];
  [k: string]: unknown;
}

export interface ScanCandidate {
  marketId?: string;
  question?: string;
  category?: string;
  liquidity?: number;
  volume?: number;
  endDate?: string;
  yesPrice?: number;
  noPrice?: number;
  [k: string]: unknown;
}

export interface ScanPreview {
  candidates?: ScanCandidate[];
  qualified?: number;
  disqualified?: number;
  scanned?: number;
  [k: string]: unknown;
}
