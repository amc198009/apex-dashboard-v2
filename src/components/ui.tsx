'use client';

// APEX v2 — shared UI primitives. Terminal/trading-desk aesthetic:
// monospace, dark surfaces, hairline borders, accent-coded status.

import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { TradeStatus } from '../lib/api';

export const STATUS_STYLES: Record<TradeStatus, string> = {
  PENDING_APPROVAL: 'text-apex-amber border-apex-amber/40 bg-apex-amber/10',
  APPROVED:         'text-blue-400 border-blue-400/40 bg-blue-400/10',
  EXECUTING:        'text-blue-300 border-blue-300/40 bg-blue-300/10',
  OPEN:             'text-apex-green border-apex-green/40 bg-apex-green/10',
  CLOSED:           'text-white/50 border-white/20 bg-white/5',
  FAILED:           'text-apex-red border-apex-red/40 bg-apex-red/10',
  CANCELLED:        'text-white/30 border-white/10 bg-transparent',
};

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: 'green' | 'red' | 'amber' | 'none' }) {
  return (
    <div className={clsx(
      'rounded-lg border border-white/8 bg-white/[0.025] backdrop-blur-sm',
      glow === 'green' && 'shadow-[0_0_24px_-12px_rgba(99,153,34,0.5)]',
      glow === 'red' && 'shadow-[0_0_24px_-12px_rgba(226,75,74,0.5)]',
      glow === 'amber' && 'shadow-[0_0_24px_-12px_rgba(186,117,23,0.5)]',
      className,
    )}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[10px] tracking-[0.22em] text-white/40 uppercase">{children}</h2>
      {right}
    </div>
  );
}

export function StatTile({ label, value, sub, accent, mono = true }: {
  label: string; value: ReactNode; sub?: ReactNode; accent?: string; mono?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-[9px] text-white/30 tracking-[0.15em] uppercase mb-1.5">{label}</div>
      <div className={clsx('text-2xl font-semibold leading-none', mono && 'font-mono', accent ?? 'text-white/90')}>{value}</div>
      {sub != null && <div className="text-[10px] text-white/35 mt-1.5">{sub}</div>}
    </Card>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('text-[9px] px-2 py-0.5 border rounded tracking-wider whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TradeStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {status === 'EXECUTING' ? '◌ EXECUTING' : status.replace('_', ' ')}
    </Badge>
  );
}

export function Button({ children, onClick, disabled, variant = 'ghost', className, size = 'md' }: {
  children: ReactNode; onClick?: (e: React.MouseEvent) => void; disabled?: boolean;
  variant?: 'ghost' | 'approve' | 'danger' | 'accent'; className?: string; size?: 'sm' | 'md';
}) {
  const variants: Record<string, string> = {
    ghost: 'border-white/12 text-white/50 hover:border-white/30 hover:text-white/80',
    approve: 'bg-apex-green/20 border-apex-green/50 text-apex-green hover:bg-apex-green/30 font-semibold',
    danger: 'border-white/15 text-white/40 hover:border-apex-red/60 hover:text-apex-red',
    accent: 'border-apex-red/50 text-apex-red hover:bg-apex-red/10',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'tracking-[0.12em] border rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed',
        size === 'sm' ? 'text-[10px] px-3 py-1.5' : 'text-[11px] px-4 py-2',
        variants[variant], className,
      )}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, max, status = 'safe', label }: {
  value: number; max: number; status?: 'safe' | 'warn' | 'breach'; label?: ReactNode;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const over = max > 0 && value / max >= 1;
  const color = status === 'breach' || over ? 'bg-apex-red' : status === 'warn' ? 'bg-apex-amber' : 'bg-apex-green';
  return (
    <div>
      {label && <div className="flex justify-between text-[10px] text-white/40 mb-1">{label}</div>}
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx('inline-block animate-spin', className)}>◌</span>;
}

export function ConnectionDot({ online }: { online: boolean }) {
  return (
    <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', online ? 'bg-apex-green animate-pulse' : 'bg-apex-red')} />
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-16 border border-dashed border-white/8 rounded-lg text-white/25 text-[12px]">
      {children}
    </div>
  );
}

export function pnlColor(n: number | null | undefined): string {
  if (n == null) return 'text-white/50';
  return n > 0 ? 'text-apex-green' : n < 0 ? 'text-apex-red' : 'text-white/60';
}
