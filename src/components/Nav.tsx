'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useApex } from '../lib/store';
import { ConnectionDot } from './ui';
import { usd, signedPct } from '../lib/format';

const LINKS = [
  { href: '/',          label: 'Overview',  icon: GridIcon },
  { href: '/positions', label: 'Positions', icon: LayersIcon },
  { href: '/markets',   label: 'Markets',   icon: ScanIcon },
  { href: '/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/settings',  label: 'Settings',  icon: GearIcon },
];

const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export function Nav() {
  const pathname = usePathname();
  const { connected, bankroll, summary } = useApex();

  return (
    <>
      {/* ── Desktop: left sidebar (md and up) ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-white/[0.06] bg-[#0c0e14]/80 backdrop-blur-xl">
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div>
              <div className="text-white font-semibold tracking-tight leading-none">APEX</div>
              <div className="text-white/35 text-[10px] mt-1">Autonomous Edge v2.0</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {LINKS.map(l => {
            const active = isActive(l.href, pathname);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all',
                  active ? 'bg-white/[0.07] text-white ring-1 ring-white/10' : 'text-white/45 hover:text-white/85 hover:bg-white/[0.04]',
                )}
              >
                <Icon className={clsx('h-[18px] w-[18px] transition-colors', active ? 'text-apex-brand' : 'text-white/40 group-hover:text-white/70')} />
                {l.label}
                {l.href === '/' && summary.pending > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-apex-amber px-1.5 text-[11px] font-semibold text-[#2a1c00]">{summary.pending}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          {bankroll && (
            <div className="mb-3">
              <div className="text-[10px] text-white/35">Bankroll</div>
              <div className="text-lg font-semibold text-white tnum mt-0.5">{usd(bankroll.current)}</div>
              <div className={clsx('text-[11px] mt-0.5', bankroll.totalGrowthPct >= 0 ? 'text-apex-green' : 'text-apex-red')}>
                {signedPct(bankroll.totalGrowthPct / 100)} all-time
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <ConnectionDot online={connected} />
            <span className="text-[11px] font-medium text-white/55">{connected ? 'Agent online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile: top brand bar + bottom tab bar (below md) ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 border-b border-white/[0.06] bg-[#0c0e14]/85 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-white font-semibold tracking-tight">APEX</span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionDot online={connected} />
          <span className="text-[11px] font-medium text-white/55">{connected ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-white/[0.06] bg-[#0c0e14]/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(l => {
          const active = isActive(l.href, pathname);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx('relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors', active ? 'text-white' : 'text-white/45')}
            >
              <Icon className={clsx('h-[20px] w-[20px]', active ? 'text-apex-brand' : 'text-white/45')} />
              {l.label}
              {l.href === '/' && summary.pending > 0 && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 grid h-4 min-w-4 place-items-center rounded-full bg-apex-amber px-1 text-[9px] font-semibold text-[#2a1c00]">{summary.pending}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function BrandMark() {
  return <span className="grid h-8 w-8 place-items-center rounded-xl bg-apex-brand/15 text-apex-brand font-bold text-lg ring-1 ring-apex-brand/25">A</span>;
}

// ── inline icons (stroke, inherit currentColor) ──────────────────────────────
type IconProps = { className?: string };
function GridIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
}
function LayersIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>;
}
function ScanIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>;
}
function ChartIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>;
}
function GearIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.78 1.05 1.51 1.05H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
}
