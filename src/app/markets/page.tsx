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
    <div className="min-h-screen bg-black text-white">
      <TopBar
        title="Markets"
        subtitle="Polymarket scan funnel & candidate evaluation"
      />

      <div className="px-4 py-6 md:px-8 md:py-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8">

        {/* Funnel StatTiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            label="Scanned"
            value={num(scanned)}
          />
          <StatTile
            label="Qualified"
            value={num(qualified)}
            accent="text-apex-green"
          />
          <StatTile
            label="Disqualified"
            value={num(disqualified)}
            accent="text-apex-red"
          />
          <StatTile
            label="Qualify rate"
            value={qualifyRate}
          />
        </div>

        {/* Scan funnel — proportional bars (renders once a scan returns counts) */}
        {typeof scanned === 'number' && scanned > 0 && (
          <Card className="p-5">
            <SectionTitle>Scan funnel</SectionTitle>
            <div className="space-y-3">
              {[
                { label: 'Scanned', n: scanned, color: 'bg-apex-blue/60' },
                { label: 'Qualified', n: qualified ?? 0, color: 'bg-apex-green' },
                { label: 'Disqualified', n: disqualified ?? 0, color: 'bg-apex-red/80' },
              ].map(r => (
                <div key={r.label} className="grid grid-cols-[110px_1fr_56px] items-center gap-3">
                  <span className="text-[12px] text-white/55">{r.label}</span>
                  <div className="h-6 rounded-lg bg-apex-bg-2 ring-1 ring-white/[0.06] overflow-hidden">
                    <div className={`h-full rounded-lg transition-all duration-500 ${r.color}`}
                      style={{ width: `${Math.min((r.n / scanned) * 100, 100)}%` }} />
                  </div>
                  <span className="text-right text-[12px] font-medium tnum text-white/80">{num(r.n)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filter Criteria Card */}
        <Card className="p-5">
          <div className="mb-3">
            <span className="text-[11px] text-white/40 font-medium">
              Hard filter criteria
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">Min liquidity</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {usd(RISK.minLiquidity, 0)}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">Min time to resolution</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {RISK.minHoursToResolution}h
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">Min net edge</span>
              <Badge className="text-apex-amber border-apex-amber/30 bg-apex-amber/10">
                {(RISK.minNetEdge * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          <p className="text-[12px] text-white/40 leading-relaxed mt-2">
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
                  {loading ? <Spinner className="w-3 h-3" /> : 'Refresh'}
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleTriggerScan}
                  disabled={scanning || loading}
                >
                  {scanning ? <Spinner className="w-3 h-3" /> : 'Trigger full scan'}
                </Button>
              </div>
            }
          >
            Scan candidates
          </SectionTitle>

          {/* Loading state — no data yet */}
          {loading && preview === null && (
            <div className="flex items-center justify-center gap-2 py-20 text-white/40 text-[13px]">
              <Spinner className="w-4 h-4" />
              <span>Loading…</span>
            </div>
          )}

          {/* Error state */}
          {!loading && err !== null && (
            <EmptyState>
              <div className="space-y-1">
                <div className="text-apex-red">{err}</div>
                <div className="text-white/40 text-[12px]">
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
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-white/40 border-b border-white/[0.06]">
                    <th className="px-4 py-3 font-medium">
                      Market
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Liquidity
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Yes / No
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
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
                        className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Market question */}
                        <td className="px-4 py-3.5 text-[13px] max-w-[320px]">
                          <span
                            className="block truncate text-white/80"
                            title={label !== '—' ? label : undefined}
                          >
                            {label}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 text-[13px] text-white/50">
                          {c.category ?? '—'}
                        </td>

                        {/* Liquidity */}
                        <td
                          className={clsx(
                            'px-4 py-3.5 text-[13px] tnum text-right',
                            isLowLiquidity ? 'text-apex-red' : 'text-white/80'
                          )}
                        >
                          {typeof c.liquidity === 'number' ? usd(c.liquidity, 0) : '—'}
                        </td>

                        {/* Yes / No prices */}
                        <td className="px-4 py-3.5 text-[13px] tnum text-right text-white/70">
                          <span className="text-apex-green">
                            {typeof c.yesPrice === 'number' ? cents(c.yesPrice) : '—'}
                          </span>
                          <span className="text-white/30 mx-1">/</span>
                          <span className="text-apex-red">
                            {typeof c.noPrice === 'number' ? cents(c.noPrice) : '—'}
                          </span>
                        </td>

                        {/* Resolves */}
                        <td className="px-4 py-3.5 text-[13px] tnum text-right text-white/50">
                          {c.endDate != null ? durationUntil(c.endDate) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
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
