'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useApex } from '../lib/store';
import { ConnectionDot } from './ui';
import { usd, signedPct } from '../lib/format';

const LINKS = [
  { href: '/',          label: 'OVERVIEW',  glyph: '▣' },
  { href: '/positions', label: 'POSITIONS', glyph: '◆' },
  { href: '/markets',   label: 'MARKETS',   glyph: '⊞' },
  { href: '/analytics', label: 'ANALYTICS', glyph: '∿' },
];

export function Nav() {
  const pathname = usePathname();
  const { connected, bankroll, summary } = useApex();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[200px] flex-col border-r border-white/8 bg-[#0a0a0a]">
      <div className="px-5 py-5 border-b border-white/8">
        <div className="text-apex-red text-lg font-semibold tracking-[0.22em] leading-none">APEX</div>
        <div className="text-white/25 text-[8px] tracking-[0.18em] mt-1">AUTONOMOUS EDGE v2.0</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {LINKS.map(l => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex items-center gap-3 rounded px-3 py-2.5 text-[11px] tracking-[0.15em] transition-all',
                active
                  ? 'bg-white/8 text-white/90 border border-white/10'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03] border border-transparent',
              )}
            >
              <span className={clsx('text-sm', active ? 'text-apex-red' : 'text-white/30')}>{l.glyph}</span>
              {l.label}
              {l.href === '/' && summary.pending > 0 && (
                <span className="ml-auto bg-apex-amber text-black text-[9px] px-1.5 rounded-full font-semibold">{summary.pending}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 px-5 py-4 space-y-3">
        {bankroll && (
          <div>
            <div className="text-[8px] text-white/25 tracking-[0.18em]">BANKROLL</div>
            <div className="text-sm font-semibold text-white/85">{usd(bankroll.current)}</div>
            <div className={clsx('text-[9px]', bankroll.totalGrowthPct >= 0 ? 'text-apex-green' : 'text-apex-red')}>
              {signedPct(bankroll.totalGrowthPct / 100)} growth
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ConnectionDot online={connected} />
          <span className="text-[9px] tracking-[0.18em] text-white/40">{connected ? 'AGENT ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>
    </aside>
  );
}
