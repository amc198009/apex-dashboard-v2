// APEX v2 — hard risk constraints (mirror of backend riskConfig.js).
// Used by the dashboard to render exposure gauges and constraint checks.

export const RISK = {
  minNetEdge: 0.07,          // 7% minimum net edge
  maxSinglePct: 0.05,        // 5% of bankroll, single position
  maxCategoryPct: 0.15,      // 15% per category
  maxCorrelatedPct: 0.2,     // 20% per correlated cluster
  maxPortfolioPct: 0.25,     // 25% total portfolio exposure
  maxConcurrent: 8,          // max concurrent open positions
  reserveFraction: 0.2,      // 20% bankroll kept liquid
  minLiquidity: 10000,       // $10K minimum market liquidity
  minHoursToResolution: 48,  // no trade < 48h before resolution
  drawdownLossCount: 3,      // 3 losses → drawdown protocol
  drawdownSessionLossPct: 0.08, // or 8% session loss → Kelly halved
} as const;

export type RiskKey = keyof typeof RISK;

// returns a 0..1 utilization ratio against a cap, clamped for display
export const utilization = (value: number, cap: number): number =>
  cap <= 0 ? 0 : Math.min(value / cap, 1.5);

// status tier for a utilization ratio
export const utilStatus = (ratio: number): 'safe' | 'warn' | 'breach' => {
  if (ratio >= 1) return 'breach';
  if (ratio >= 0.8) return 'warn';
  return 'safe';
};
