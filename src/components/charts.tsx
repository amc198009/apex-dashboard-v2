'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ZAxis,
} from 'recharts';
import type { Trade, CalibrationSummary } from '../lib/api';
import {
  cumulativePnl, tierDistribution, edgeBuckets, calibrationScatter, exposureByCategory,
} from '../lib/analytics';
import { usd, signedUsd } from '../lib/format';

// Tuned to match the oklch design tokens (loss red distinct from brand coral).
const GREEN = '#2FC56E';
const RED = '#F0454B';
const AMBER = '#F5A524';
const GRID = 'rgba(255,255,255,0.05)';
const AXIS = 'rgba(255,255,255,0.35)';

// Recharts measures the DOM, so only render after mount to avoid SSR width=0.
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ChartFrame({ height = 220, mounted, children }: { height?: number; mounted: boolean; children: React.ReactElement }) {
  if (!mounted) return <div style={{ height }} className="grid place-items-center text-white/15 text-[10px] tracking-widest">RENDERING…</div>;
  return <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>;
}

const tipStyle = {
  background: '#1B1E27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  boxShadow: '0 12px 32px -12px rgba(0,0,0,0.8)', padding: '8px 12px',
  fontSize: 12, fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.9)',
};

function EmptyChart({ height = 220, label }: { height?: number; label: string }) {
  return <div style={{ height }} className="grid place-items-center text-white/20 text-[11px] tracking-wider">{label}</div>;
}

// ── Equity / cumulative P&L curve ─────────────────────────────────────────────
export function EquityCurve({ trades, starting = 0, height = 240 }: { trades: Trade[]; starting?: number; height?: number }) {
  const mounted = useMounted();
  const series = cumulativePnl(trades).map(p => ({ ...p, equity: Number((starting + p.cumulative).toFixed(2)) }));
  if (!series.length) return <EmptyChart height={height} label="No closed trades yet — equity curve builds as positions resolve" />;
  const up = series[series.length - 1].cumulative >= 0;
  return (
    <ChartFrame height={height} mounted={mounted}>
      <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? GREEN : RED} stopOpacity={0.35} />
            <stop offset="100%" stopColor={up ? GREEN : RED} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={48}
          tickFormatter={(v: number) => (starting ? usd(v, 0) : signedUsd(v, 0))} />
        <Tooltip contentStyle={tipStyle} formatter={(v: number) => [starting ? usd(v) : signedUsd(v), starting ? 'equity' : 'cum P&L']} />
        {starting > 0 && <ReferenceLine y={starting} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />}
        <Area type="monotone" dataKey={starting ? 'equity' : 'cumulative'} stroke={up ? GREEN : RED} strokeWidth={2} fill="url(#eq)" />
      </AreaChart>
    </ChartFrame>
  );
}

// ── Per-trade realized P&L bars ───────────────────────────────────────────────
export function PnlBars({ trades, height = 220 }: { trades: Trade[]; height?: number }) {
  const mounted = useMounted();
  const data = cumulativePnl(trades);
  if (!data.length) return <EmptyChart height={height} label="No realized P&L yet" />;
  return (
    <ChartFrame height={height} mounted={mounted}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => signedUsd(v, 0)} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: number) => [signedUsd(v), 'P&L']} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
        <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />)}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

// ── Exposure by category vs portfolio cap ─────────────────────────────────────
export function ExposureChart({ trades, bankroll, categoryCap, height = 220 }: {
  trades: Trade[]; bankroll: number; categoryCap: number; height?: number;
}) {
  const mounted = useMounted();
  const data = exposureByCategory(trades, bankroll).map(r => ({ ...r, pctNum: Number((r.pct * 100).toFixed(2)) }));
  if (!data.length) return <EmptyChart height={height} label="No open positions" />;
  const cap = categoryCap * 100;
  return (
    <ChartFrame height={height} mounted={mounted}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
        <YAxis type="category" dataKey="category" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          formatter={(v: number, _n, p) => [`${v}% · ${usd((p?.payload as { usdc: number }).usdc)}`, 'exposure']} />
        <ReferenceLine x={cap} stroke={RED} strokeDasharray="4 3" label={{ value: `cap ${cap}%`, fill: RED, fontSize: 9, position: 'top' }} />
        <Bar dataKey="pctNum" radius={[0, 2, 2, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.pctNum >= cap ? RED : d.pctNum >= cap * 0.8 ? AMBER : GREEN} />)}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

// ── Signal tier distribution ──────────────────────────────────────────────────
export function TierChart({ trades, height = 200 }: { trades: Trade[]; height?: number }) {
  const mounted = useMounted();
  const data = tierDistribution(trades);
  const hasAny = data.some(d => d.count > 0);
  if (!hasAny) return <EmptyChart height={height} label="No trades to classify" />;
  const colors = [GREEN, '#7fb52e', AMBER, RED];
  return (
    <ChartFrame height={height} mounted={mounted}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="tier" tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: number) => [v, 'trades']} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

// ── Edge distribution ─────────────────────────────────────────────────────────
export function EdgeChart({ trades, height = 200 }: { trades: Trade[]; height?: number }) {
  const mounted = useMounted();
  const data = edgeBuckets(trades);
  const hasAny = data.some(d => d.count > 0);
  if (!hasAny) return <EmptyChart height={height} label="No edge data" />;
  return (
    <ChartFrame height={height} mounted={mounted}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="range" tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: number) => [v, 'trades']} />
        <Bar dataKey="count" fill={GREEN} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

// ── Calibration scatter (predicted vs actual) ─────────────────────────────────
export function CalibrationChart({ calibration, height = 260 }: { calibration: CalibrationSummary | null; height?: number }) {
  const mounted = useMounted();
  const points = calibrationScatter(calibration).map(p => ({ ...p, x: Number((p.predicted * 100).toFixed(1)), y: Number((p.actual * 100).toFixed(1)) }));
  if (!points.length) return <EmptyChart height={height} label="No resolved trades — calibration builds over time" />;
  return (
    <ChartFrame height={height} mounted={mounted}>
      <ScatterChart margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis type="number" dataKey="x" name="predicted" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `${v}%`} label={{ value: 'PREDICTED', fill: AXIS, fontSize: 9, position: 'insideBottom', offset: -2 }} />
        <YAxis type="number" dataKey="y" name="actual" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 9 }} axisLine={false} tickLine={false} width={36}
          tickFormatter={(v: number) => `${v}%`} />
        <ZAxis type="number" dataKey="count" range={[40, 300]} name="count" />
        <Tooltip contentStyle={tipStyle} cursor={{ strokeDasharray: '3 3', stroke: GRID }}
          formatter={(v: number, n: string) => [`${v}%`, n]} />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
        <Scatter data={points}>
          {points.map((p, i) => <Cell key={i} fill={Math.abs(p.bias) < 0.05 ? GREEN : Math.abs(p.bias) < 0.12 ? AMBER : RED} />)}
        </Scatter>
      </ScatterChart>
    </ChartFrame>
  );
}
