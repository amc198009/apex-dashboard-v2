'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApex } from '../../lib/store';
import { TopBar } from '../../components/TopBar';
import { Card, SectionTitle, StatTile, EmptyState, Badge, Button, Spinner } from '../../components/ui';
import { api, type ScanPreview, type ScanCandidate } from '../../lib/api';
import { RISK } from '../../lib/risk';
import { usd, num, cents, durationUntil } from '../../lib/format';
import clsx from 'clsx';

export default function MarketsPage() {
  const { triggerScan, scanning } = useApex();

  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await api.scanPreview();
      setPreview(p);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'scan preview unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTriggerScan = useCallback(async () => {
    await triggerScan();
    setTimeout(() => {
      load();
    }, 3500);
  }, [triggerScan, load]);

  const scanned = preview?.scanned;
  const qualified = preview?.qualified;
  const disqualified = preview?.disqualified;

  const qualifyRate =
    typeof scanned === 'number' &&
    typeof qualified === 'number' &&
    scanned > 0
      ? ((qualified / scanned) * 100).toFixed(1) + '%'
      : '—';

  const candidates: ScanCandidate[] = Array.isArray(preview?.candidates)
    ? preview!.candidates!
    : [];

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <TopBar
        title="MARKETS"
        subtitle="Polymarket scan funnel & candidate evaluation"
      />

      <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-6">

        {/* Funnel StatTiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            label="SCANNED"
            value={num(scanned)}
          />
          <StatTile
            label="QUALIFIED"
            value={num(qualified)}
            accent="green"
          />
          <StatTile
            label="DISQUALIFIED"
            value={num(disqualified)}
            accent="red"
          />
          <StatTile
            label="QUALIFY RATE"
            value={qualifyRate}
          />
        </div>

        {/* Filter Criteria Card */}
        <Card className="p-5">
          <div className="mb-3">
            <span className="text-[9px] tracking-[0.15em] text-white/30 uppercase">
              Hard Filter Criteria
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[11px] text-white/60">Min Liquidity</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {usd(RISK.minLiquidity, 0)}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[11px] text-white/60">Min Time to Resolution</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {RISK.minHoursToResolution}h
              </Badge>
            </div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] text-white/60">Min Net Edge</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {(RISK.minNetEdge * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-white/30 leading-relaxed">
            A 100% disqualification rate usually points at the liquidity floor or a field-parsing
            issue in the backend market filter (Layer 4).
          </p>
        </Card>

        {/* Scan Candidates Section */}
        <div>
          <SectionTitle
            right={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={load}
                  disabled={loading}
                >
                  {loading ? <Spinner className="w-3 h-3" /> : 'REFRESH'}
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleTriggerScan}
                  disabled={scanning || loading}
                >
                  {scanning ? <Spinner className="w-3 h-3" /> : 'TRIGGER FULL SCAN'}
                </Button>
              </div>
            }
          >
            Scan Candidates
          </SectionTitle>

          {/* Loading state — no data yet */}
          {loading && preview === null && (
            <div className="flex items-center justify-center gap-2 py-12 text-white/40 text-[11px]">
              <Spinner className="w-4 h-4" />
              <span>loading…</span>
            </div>
          )}

          {/* Error state */}
          {!loading && err !== null && (
            <EmptyState>
              <div className="space-y-1">
                <div className="text-apex-red">{err}</div>
                <div className="text-white/30 text-[10px]">
                  The backend <code className="text-white/50">/scan</code> endpoint may be
                  unavailable. This is expected if{' '}
                  <code className="text-white/50">NEXT_PUBLIC_APEX_API</code> is not set or the
                  endpoint path differs.
                </div>
              </div>
            </EmptyState>
          )}

          {/* Candidates table */}
          {!loading && err === null && candidates.length > 0 && (
            <div className="overflow-x-auto border border-white/8 rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-2.5 px-2 text-[9px] tracking-[0.15em] text-white/30 uppercase font-normal">
                      Market
                    </th>
                    <th className="text-left py-2.5 px-2 text-[9px] tracking-[0.15em] text-white/30 uppercase font-normal">
                      Category
                    </th>
                    <th className="text-right py-2.5 px-2 text-[9px] tracking-[0.15em] text-white/30 uppercase font-normal">
                      Liquidity
                    </th>
                    <th className="text-right py-2.5 px-2 text-[9px] tracking-[0.15em] text-white/30 uppercase font-normal">
                      Yes / No
                    </th>
                    <th className="text-right py-2.5 px-2 text-[9px] tracking-[0.15em] text-white/30 uppercase font-normal">
                      Resolves
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const marketKey = c.marketId ?? String(i);
                    const label = c.question ?? c.marketId ?? '—';
                    const isLowLiquidity =
                      typeof c.liquidity === 'number' && c.liquidity < RISK.minLiquidity;

                    return (
                      <tr
                        key={marketKey}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Market question */}
                        <td className="py-2.5 px-2 text-[11px] max-w-[320px]">
                          <span
                            className="block truncate text-white/80"
                            title={label !== '—' ? label : undefined}
                          >
                            {label}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-2 text-[11px] text-white/50">
                          {c.category ?? '—'}
                        </td>

                        {/* Liquidity */}
                        <td
                          className={clsx(
                            'py-2.5 px-2 text-[11px] text-right tabular-nums',
                            isLowLiquidity ? 'text-apex-red' : 'text-white/80'
                          )}
                        >
                          {typeof c.liquidity === 'number' ? usd(c.liquidity, 0) : '—'}
                        </td>

                        {/* Yes / No prices */}
                        <td className="py-2.5 px-2 text-[11px] text-right tabular-nums text-white/70">
                          <span className="text-apex-green">
                            {typeof c.yesPrice === 'number' ? cents(c.yesPrice) : '—'}
                          </span>
                          <span className="text-white/30 mx-1">/</span>
                          <span className="text-apex-red">
                            {typeof c.noPrice === 'number' ? cents(c.noPrice) : '—'}
                          </span>
                        </td>

                        {/* Resolves */}
                        <td className="py-2.5 px-2 text-[11px] text-right tabular-nums text-white/50">
                          {c.endDate != null ? durationUntil(c.endDate) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* No candidates */}
          {!loading && err === null && candidates.length === 0 && preview !== null && (
            <EmptyState>
              No candidates returned — trigger a scan, or the backend may only expose counts.
              With 0 qualified, check the $10K liquidity filter.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
