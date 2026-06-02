// APEX v2 — formatting helpers

export const usd = (n: number | null | undefined, dp = 2): string =>
  n == null || Number.isNaN(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const signedUsd = (n: number | null | undefined, dp = 2): string => {
  if (n == null || Number.isNaN(n)) return '—';
  const s = usd(Math.abs(n), dp);
  return n >= 0 ? `+${s}` : `-${s}`;
};

export const pct = (n: number | null | undefined, dp = 1): string =>
  n == null || Number.isNaN(n) ? '—' : `${(n * 100).toFixed(dp)}%`;

export const signedPct = (n: number | null | undefined, dp = 1): string => {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(dp)}%`;
};

// price is a 0..1 probability — render as cents
export const cents = (price: number | null | undefined): string =>
  price == null || Number.isNaN(price) ? '—' : `${(price * 100).toFixed(0)}¢`;

export const num = (n: number | null | undefined, dp = 0): string =>
  n == null || Number.isNaN(n) ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: dp });

export const shortId = (id: string | null | undefined, len = 6): string =>
  !id ? '—' : id.length <= len * 2 ? id : `${id.slice(0, len)}…${id.slice(-4)}`;

export const dateShort = (d: string | number | Date | null | undefined): string => {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const dateTime = (d: string | number | Date | null | undefined): string => {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (d: string | number | Date | null | undefined): string => {
  if (!d) return '—';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 0) return 'in ' + timeAgo(Date.now() - (t - Date.now()));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const hoursUntil = (d: string | number | Date | null | undefined): number | null => {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return (t - Date.now()) / 36e5;
};

export const durationUntil = (d: string | number | Date | null | undefined): string => {
  const h = hoursUntil(d);
  if (h == null) return '—';
  if (h < 0) return 'expired';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
};
