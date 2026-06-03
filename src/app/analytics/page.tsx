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
    <div className="min-h-screen bg-[#080808] font-sans text-white">
      <TopBar title="Analytics" subtitle="Performance, calibration & edge distribution" />

      <div className="px-4 py-6 md:px-8 md:py-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8">

        {/* ── KPI row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatTile
            label="Win rate"
            value={pct(s.winRate, 0)}
            sub={`${s.wins}W / ${s.losses}L`}
            accent={s.winRate >= 0.5 ? 'text-apex-green' : 'text-apex-amber'}
          />
          <StatTile
            label="Profit factor"
            value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}
          />
          <StatTile
            label="Total P&L"
            value={signedUsd(s.totalPnl)}
            accent={pnlColor(s.totalPnl)}
          />
          <StatTile
            label="Resolved"
            value={num(s.resolved)}
          />
          <StatTile
            label="Avg win"
            value={signedUsd(s.avgWin)}
            accent="text-apex-green"
          />
          <StatTile
            label="Avg loss"
            value={usd(s.avgLoss)}
            accent="text-apex-red"
          />
        </div>

        {/* ── Chart grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Equity Curve */}
          <Card className="p-5">
            <SectionTitle>Equity curve</SectionTitle>
            <EquityCurve trades={trades} starting={bankroll?.starting ?? 0} />
          </Card>

          {/* Realized P&L per Trade */}
          <Card className="p-5">
            <SectionTitle>Realized P&amp;L per trade</SectionTitle>
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
                    <span className="text-[11px] text-white/40">
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
            <SectionTitle>Signal tier distribution</SectionTitle>
            <TierChart trades={trades} />
          </Card>

          {/* Edge Distribution */}
          <Card className="p-5">
            <SectionTitle>Edge distribution</SectionTitle>
            <EdgeChart trades={trades} />
          </Card>

        </div>

        {/* ── Category Drift table ───────────────────────────────────── */}
        <Card className="p-5">
          <SectionTitle>Category drift</SectionTitle>

          {driftEntries.length === 0 ? (
            <EmptyState>
              No resolved trades yet — calibration metrics populate as positions resolve
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-white/40 border-b border-white/[0.06]">
                    <th className="px-4 py-3 font-medium text-left">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Predicted
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actual
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Bias
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
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
                      <tr key={category} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[13px] text-white/70">
                          {category}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right tnum text-white/60">
                          {pct(d.avgPredicted, 1)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right tnum text-white/60">
                          {pct(d.avgActual, 1)}
                        </td>
                        <td className={clsx('px-4 py-3 text-[13px] text-right tnum', biasColor)}>
                          {pct(d.bias, 1)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right tnum text-white/50">
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
