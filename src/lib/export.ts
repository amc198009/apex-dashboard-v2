import type { Trade } from './api';

const COLS: { key: keyof Trade; label: string }[] = [
  { key: 'id', label: 'id' },
  { key: 'question', label: 'question' },
  { key: 'category', label: 'category' },
  { key: 'direction', label: 'direction' },
  { key: 'status', label: 'status' },
  { key: 'signalTier', label: 'tier' },
  { key: 'entryPrice', label: 'entry' },
  { key: 'estimatedProbability', label: 'model_prob' },
  { key: 'netEdge', label: 'edge' },
  { key: 'allocationUsdc', label: 'size_usdc' },
  { key: 'allocationPct', label: 'size_pct' },
  { key: 'exitPrice', label: 'exit' },
  { key: 'pnl', label: 'pnl' },
  { key: 'closeReason', label: 'close_reason' },
  { key: 'queuedAt', label: 'queued_at' },
  { key: 'closedAt', label: 'closed_at' },
];

function cell(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function tradesToCsv(trades: Trade[]): string {
  const header = COLS.map(c => c.label).join(',');
  const rows = trades.map(t => COLS.map(c => cell(t[c.key])).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCsv(trades: Trade[], filename = `apex-trades-${new Date().toISOString().slice(0, 10)}.csv`) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([tradesToCsv(trades)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
