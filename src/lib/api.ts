// APEX v2 Dashboard API Client

const BASE = process.env.NEXT_PUBLIC_APEX_API ?? 'http://localhost:3001/api';
const API_KEY = process.env.NEXT_PUBLIC_APEX_KEY ?? '';
// Real-time stream: enabled when the backend exposes an SSE endpoint.
export const SSE_ENABLED = ['1', 'true', 'yes'].includes((process.env.NEXT_PUBLIC_APEX_SSE ?? '').toLowerCase());
export const STREAM_URL = `${BASE}/stream`;

async function apexFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts?.headers as Record<string, string>) };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    ...opts,
    headers,
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
  getConfig:   () => apexFetch<AgentConfig>('/config'),
  updateConfig: (patch: Partial<AgentConfig>) => apexFetch<AgentConfig>('/config', { method: 'PATCH', body: JSON.stringify(patch) }),
  evaluate:    (input: EvaluateInput) => apexFetch<EvaluateResult>('/evaluate', { method: 'POST', body: JSON.stringify(input) }),
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

// Manual market evaluation (POST /evaluate). Shapes are loose — backend not pinned.
export interface EvaluateInput { url?: string; marketId?: string; question?: string; }
export interface EvaluateResult {
  question?: string;
  category?: string;
  direction?: 'YES' | 'NO';
  estimatedProbability?: number;
  entryPrice?: number;
  netEdge?: number;
  signalTier?: number;
  allocationUsdc?: number;
  allocationPct?: number;
  kellyFractionLabel?: string;
  recommendation?: string;
  counterArgument?: string;
  disqualified?: boolean;
  reason?: string;
  [k: string]: unknown;
}

// Mutable agent configuration (exposed by GET/PATCH /config on the backend).
// All fields optional — the Settings UI falls back to the riskConfig mirror.
export interface AgentConfig {
  minNetEdge?: number;
  maxSinglePct?: number;
  maxCategoryPct?: number;
  maxCorrelatedPct?: number;
  maxPortfolioPct?: number;
  maxConcurrent?: number;
  reserveFraction?: number;
  minLiquidity?: number;
  minHoursToResolution?: number;
  paperMode?: boolean;
  scanCron?: string;
  monitorCron?: string;
  [k: string]: unknown;
}
