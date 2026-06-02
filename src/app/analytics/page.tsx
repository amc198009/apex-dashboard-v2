'use client';

import { useApex } from '../../lib/store';
import { TopBar } from '../../components/TopBar';
import { EquityCurve, PnlBars, CalibrationChart, TierChart, EdgeChart } from '../../components/charts';
import { Card, SectionTitle, StatTile, Badge, EmptyState, pnlColor } from '../../components/ui';
import { winStats } from '../../lib/analytics';
import { usd, signedUsd, pct, num } from '../../lib/format';
import clsx from 'clsx';

export default function AnalyticsPage() {
  const { trades, calibration, bankroll } = useApex();
  const s = winStats(trades);

  // Category drift entries — derived once
  const driftEntries = calibration?.categoryDrift
    ? Object.entries(calibration.categoryDrift)
    : [];

  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <TopBar title="ANALYTICS" subtitle="Performance, calibration & edge distribution" />

      <div className="px-6 py-6 max-w-[1400px] mx-auto space-y-6">

        {/* ── KPI row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile
            label="WIN RATE"
            value={pct(s.winRate, 0)}
            sub={`${s.wins}W / ${s.losses}L`}
            accent={s.winRate >= 0.5 ? 'text-apex-green' : 'text-apex-amber'}
          />
          <StatTile
            label="PROFIT FACTOR"
            value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}
          />
          <StatTile
            label="TOTAL P&L"
            value={signedUsd(s.totalPnl)}
            accent={pnlColor(s.totalPnl)}
          />
          <StatTile
            label="RESOLVED"
            value={num(s.resolved)}
          />
          <StatTile
            label="AVG WIN"
            value={signedUsd(s.avgWin)}
            accent="text-apex-green"
          />
          <StatTile
            label="AVG LOSS"
            value={usd(s.avgLoss)}
            accent="text-apex-red"
          />
        </div>

        {/* ── Chart grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Equity Curve */}
          <Card className="p-5">
            <SectionTitle>Equity Curve</SectionTitle>
            <EquityCurve trades={trades} starting={bankroll?.starting ?? 0} />
          </Card>

          {/* Realized P&L per Trade */}
          <Card className="p-5">
            <SectionTitle>Realized P&amp;L per Trade</SectionTitle>
            <PnlBars trades={trades} />
          </Card>

          {/* Calibration */}
          <Card className="p-5">
            <SectionTitle
              right={
                calibration ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      className={clsx(
                        'border',
                        calibration.calibrationGrade === 'Excellent' || calibration.calibrationGrade === 'Good'
                          ? 'text-apex-green border-apex-green/40 bg-apex-green/10'
                          : 'text-apex-amber border-apex-amber/40 bg-apex-amber/10',
                      )}
                    >
                      {calibration.calibrationGrade}
                    </Badge>
                    <span className="text-[9px] text-white/35 tracking-wide">
                      Brier {calibration.avgBrierScore.toFixed(3)}
                    </span>
                  </div>
                ) : undefined
              }
            >
              Calibration (predicted vs actual)
            </SectionTitle>
            <CalibrationChart calibration={calibration} />
          </Card>

          {/* Signal Tier Distribution */}
          <Card className="p-5">
            <SectionTitle>Signal Tier Distribution</SectionTitle>
            <TierChart trades={trades} />
          </Card>

          {/* Edge Distribution */}
          <Card className="p-5">
            <SectionTitle>Edge Distribution</SectionTitle>
            <EdgeChart trades={trades} />
          </Card>

        </div>

        {/* ── Category Drift table ───────────────────────────────────── */}
        <Card className="p-5">
          <SectionTitle>Category Drift</SectionTitle>

          {driftEntries.length === 0 ? (
            <EmptyState>
              No resolved trades yet — calibration metrics populate as positions resolve
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left text-[9px] tracking-[0.15em] text-white/30 uppercase py-2 px-2">
                      Category
                    </th>
                    <th className="text-right text-[9px] tracking-[0.15em] text-white/30 uppercase py-2 px-2">
                      Predicted
                    </th>
                    <th className="text-right text-[9px] tracking-[0.15em] text-white/30 uppercase py-2 px-2">
                      Actual
                    </th>
                    <th className="text-right text-[9px] tracking-[0.15em] text-white/30 uppercase py-2 px-2">
                      Bias
                    </th>
                    <th className="text-right text-[9px] tracking-[0.15em] text-white/30 uppercase py-2 px-2">
                      N
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {driftEntries.map(([category, d]) => {
                    const absBias = Math.abs(d.bias);
                    const biasColor =
                      absBias < 0.05
                        ? 'text-apex-green'
                        : absBias < 0.12
                          ? 'text-apex-amber'
                          : 'text-apex-red';
                    return (
                      <tr key={category} className="border-b border-white/5">
                        <td className="py-2.5 px-2 text-[11px] text-white/70">
                          {category}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-right tabular-nums text-white/60">
                          {pct(d.avgPredicted, 1)}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-right tabular-nums text-white/60">
                          {pct(d.avgActual, 1)}
                        </td>
                        <td className={clsx('py-2.5 px-2 text-[11px] text-right tabular-nums', biasColor)}>
                          {pct(d.bias, 1)}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-right tabular-nums text-white/50">
                          {d.count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
