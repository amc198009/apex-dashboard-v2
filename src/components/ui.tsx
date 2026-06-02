'use client';

// APEX v2 — shared UI primitives. Modern fintech aesthetic: soft elevated
// surfaces, generous spacing, large headline numerals, friendly accents.
// Component APIs are stable so all views inherit the new look automatically.

import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { TradeStatus } from '../lib/api';

export const STATUS_STYLES: Record<TradeStatus, string> = {
  PENDING_APPROVAL: 'text-apex-amber bg-apex-amber/10 ring-1 ring-apex-amber/25',
  APPROVED:         'text-apex-blue bg-apex-blue/10 ring-1 ring-apex-blue/25',
  EXECUTING:        'text-apex-blue bg-apex-blue/10 ring-1 ring-apex-blue/25',
  OPEN:             'text-apex-green bg-apex-green/10 ring-1 ring-apex-green/25',
  CLOSED:           'text-white/55 bg-white/5 ring-1 ring-white/10',
  FAILED:           'text-apex-red bg-apex-red/10 ring-1 ring-apex-red/25',
  CANCELLED:        'text-white/35 bg-white/[0.03] ring-1 ring-white/8',
};

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: 'green' | 'red' | 'amber' | 'none' }) {
  return (
    <div className={clsx(
      'rounded-2xl border border-white/[0.07] bg-apex-surface/80 shadow-card backdrop-blur-sm',
      glow === 'green' && 'shadow-glow-green border-apex-green/20',
      glow === 'red' && 'shadow-glow border-apex-red/20',
      className,
    )}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[13px] font-semibold text-white/80 tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

export function StatTile({ label, value, sub, accent, mono = true }: {
  label: string; value: ReactNode; sub?: ReactNode; accent?: string; mono?: boolean;
}) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-card-hover">
      <div className="text-[11px] font-medium text-white/40 mb-2">{label}</div>
      <div className={clsx('text-[28px] leading-none font-semibold tracking-tight', mono && 'tnum', accent ?? 'text-white')}>{value}</div>
      {sub != null && <div className="text-[11px] text-white/40 mt-2">{sub}</div>}
    </Card>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TradeStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {status === 'EXECUTING' ? '◌ Executing' : title(status)}
    </Badge>
  );
}

function title(s: string) {
  return s.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function Button({ children, onClick, disabled, variant = 'ghost', className, size = 'md' }: {
  children: ReactNode; onClick?: (e: React.MouseEvent) => void; disabled?: boolean;
  variant?: 'ghost' | 'approve' | 'danger' | 'accent'; className?: string; size?: 'sm' | 'md';
}) {
  const variants: Record<string, string> = {
    ghost: 'bg-white/[0.04] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white',
    approve: 'bg-apex-green text-[#062b14] font-semibold hover:bg-apex-green/90 shadow-[0_6px_18px_-8px_rgba(34,197,94,0.6)]',
    danger: 'bg-white/[0.04] text-white/55 ring-1 ring-white/10 hover:bg-apex-red/15 hover:text-apex-red hover:ring-apex-red/30',
    accent: 'bg-apex-red/15 text-apex-red ring-1 ring-apex-red/30 hover:bg-apex-red/25',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        size === 'sm' ? 'text-[12px] px-3.5 py-2' : 'text-[13px] px-5 py-2.5',
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
      {label && <div className="flex justify-between text-[11px] text-white/45 mb-1.5">{label}</div>}
      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
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
    <span className="relative inline-flex h-2 w-2">
      {online && <span className="absolute inline-flex h-full w-full rounded-full bg-apex-green opacity-60 animate-ping" />}
      <span className={clsx('relative inline-flex rounded-full h-2 w-2', online ? 'bg-apex-green' : 'bg-apex-red')} />
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] text-white/40 text-[13px]">
      {children}
    </div>
  );
}

export function pnlColor(n: number | null | undefined): string {
  if (n == null) return 'text-white/55';
  return n > 0 ? 'text-apex-green' : n < 0 ? 'text-apex-red' : 'text-white/60';
}
