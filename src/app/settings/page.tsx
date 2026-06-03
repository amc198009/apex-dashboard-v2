'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '../../components/TopBar';
import { Card, SectionTitle, Button, Badge, Toggle, Field, NumberInput } from '../../components/ui';
import { api, API_BASE, SSE_ENABLED, type AgentConfig } from '../../lib/api';
import { RISK } from '../../lib/risk';
import { useLocalStorage } from '../../lib/useLocalStorage';
import clsx from 'clsx';

// Fraction fields that are stored as 0..1 but displayed as whole-number percentages.
const PERCENT_FIELDS: ReadonlyArray<keyof AgentConfig> = [
  'minNetEdge',
  'maxSinglePct',
  'maxCategoryPct',
  'maxCorrelatedPct',
  'maxPortfolioPct',
  'reserveFraction',
];

function seedForm(source: AgentConfig): Record<string, number> {
  const merged: AgentConfig = { ...RISK, ...source };
  const out: Record<string, number> = {};
  for (const key of PERCENT_FIELDS) {
    const v = merged[key];
    out[key] = typeof v === 'number' ? Math.round(v * 100) : NaN;
  }
  out['minLiquidity'] = typeof merged.minLiquidity === 'number' ? merged.minLiquidity : RISK.minLiquidity;
  out['maxConcurrent'] = typeof merged.maxConcurrent === 'number' ? merged.maxConcurrent : RISK.maxConcurrent;
  out['minHoursToResolution'] = typeof merged.minHoursToResolution === 'number' ? merged.minHoursToResolution : RISK.minHoursToResolution;
  return out;
}

export default function SettingsPage() {
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [backendConfig, setBackendConfig] = useState(false);
  const [form, setForm] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Execution mode
  const [localPaper, setLocalPaper] = useLocalStorage<boolean>('apex.paperMode', false);

  // Notifications
  const [notif, setNotif] = useLocalStorage<{
    failedTrades: boolean;
    drawdown: boolean;
    lowWallet: boolean;
    dailyReport: boolean;
    telegramChatId: string;
  }>('apex.notifications', {
    failedTrades: true,
    drawdown: true,
    lowWallet: true,
    dailyReport: false,
    telegramChatId: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let config: AgentConfig = {};
      try {
        const c = await api.getConfig();
        if (!cancelled) {
          setBackendConfig(true);
          setCfg(c);
          config = c;
        }
      } catch {
        if (!cancelled) {
          setBackendConfig(false);
          setCfg({});
          config = {};
        }
      }
      if (!cancelled) {
        setForm(seedForm(config));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async () => {
    const patch: Partial<AgentConfig> = {};

    for (const key of PERCENT_FIELDS) {
      const v = form[key];
      if (!Number.isNaN(v)) {
        (patch as Record<string, number>)[key] = v / 100;
      }
    }
    const plain: Array<keyof AgentConfig> = ['minLiquidity', 'maxConcurrent', 'minHoursToResolution'];
    for (const key of plain) {
      const v = form[key];
      if (!Number.isNaN(v)) {
        (patch as Record<string, number>)[key] = v;
      }
    }

    setSaving(true);
    try {
      const updated = await api.updateConfig(patch);
      setCfg(updated);
      setBackendConfig(true);
      setSaveMsg({ ok: true, text: 'Saved' });
    } catch {
      setSaveMsg({ ok: false, text: "Couldn't save — backend /config endpoint not available yet" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }, [form]);

  const paperOn = backendConfig ? !!cfg?.paperMode : localPaper;

  const updateField = useCallback((key: string) => (v: number) => {
    setForm(prev => ({ ...prev, [key]: v }));
  }, []);

  return (
    <>
      <TopBar title="Settings" subtitle="Strategy, execution & notifications" />

      <div className="px-4 py-6 md:px-8 md:py-8 max-w-[900px] mx-auto space-y-6">

        {/* Card 1 — Strategy & risk */}
        <Card className="p-5 md:p-6">
          <SectionTitle>Strategy &amp; risk</SectionTitle>

          {!backendConfig && (
            <div className={clsx(
              'text-[12px] text-apex-amber bg-apex-amber/10 ring-1 ring-apex-amber/20',
              'rounded-xl px-3 py-2 mb-4',
            )}>
              Live config endpoint not available yet — showing defaults from riskConfig. Saving will attempt to reach the backend.
            </div>
          )}

          <div className="divide-y divide-white/[0.05]">
            <Field label="Min net edge">
              <NumberInput
                value={form['minNetEdge'] ?? NaN}
                onChange={updateField('minNetEdge')}
                suffix="%"
                step={0.5}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Max single position">
              <NumberInput
                value={form['maxSinglePct'] ?? NaN}
                onChange={updateField('maxSinglePct')}
                suffix="%"
                step={1}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Max category exposure">
              <NumberInput
                value={form['maxCategoryPct'] ?? NaN}
                onChange={updateField('maxCategoryPct')}
                suffix="%"
                step={1}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Max correlated cluster">
              <NumberInput
                value={form['maxCorrelatedPct'] ?? NaN}
                onChange={updateField('maxCorrelatedPct')}
                suffix="%"
                step={1}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Max portfolio exposure">
              <NumberInput
                value={form['maxPortfolioPct'] ?? NaN}
                onChange={updateField('maxPortfolioPct')}
                suffix="%"
                step={1}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Bankroll reserve">
              <NumberInput
                value={form['reserveFraction'] ?? NaN}
                onChange={updateField('reserveFraction')}
                suffix="%"
                step={1}
                min={0}
                max={100}
              />
            </Field>

            <Field label="Min liquidity">
              <NumberInput
                value={form['minLiquidity'] ?? NaN}
                onChange={updateField('minLiquidity')}
                suffix="$"
                step={500}
                min={0}
              />
            </Field>

            <Field label="Max concurrent positions">
              <NumberInput
                value={form['maxConcurrent'] ?? NaN}
                onChange={updateField('maxConcurrent')}
                step={1}
                min={1}
              />
            </Field>

            <Field label="Min hours to resolution">
              <NumberInput
                value={form['minHoursToResolution'] ?? NaN}
                onChange={updateField('minHoursToResolution')}
                suffix="h"
                step={1}
                min={0}
              />
            </Field>
          </div>

          <div className="flex items-center gap-4 pt-4 mt-2 border-t border-white/[0.05]">
            <Button variant="approve" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {saveMsg && (
              <span className={clsx('text-[13px]', saveMsg.ok ? 'text-apex-green' : 'text-apex-red')}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </Card>

        {/* Card 2 — Execution mode */}
        <Card className="p-5 md:p-6">
          <SectionTitle>Execution mode</SectionTitle>

          <div className="divide-y divide-white/[0.05]">
            <Field
              label="Paper trading"
              hint={
                backendConfig
                  ? 'Run the full pipeline against a simulated wallet — no real orders.'
                  : 'Run the full pipeline against a simulated wallet — no real orders. Stored locally until the backend exposes paper mode.'
              }
            >
              <Toggle
                checked={paperOn}
                onChange={async (v: boolean) => {
                  if (backendConfig) {
                    try {
                      const u = await api.updateConfig({ paperMode: v });
                      setCfg(u);
                    } catch {
                      // silently ignore — backend not available
                    }
                  } else {
                    setLocalPaper(v);
                  }
                }}
              />
            </Field>
          </div>
        </Card>

        {/* Card 3 — Notifications */}
        <Card className="p-5 md:p-6">
          <SectionTitle>Notifications</SectionTitle>

          <div className="divide-y divide-white/[0.05]">
            <Field label="Failed trades">
              <Toggle
                checked={notif.failedTrades}
                onChange={(v: boolean) => setNotif(n => ({ ...n, failedTrades: v }))}
              />
            </Field>

            <Field label="Drawdown protocol">
              <Toggle
                checked={notif.drawdown}
                onChange={(v: boolean) => setNotif(n => ({ ...n, drawdown: v }))}
              />
            </Field>

            <Field label="Low wallet balance">
              <Toggle
                checked={notif.lowWallet}
                onChange={(v: boolean) => setNotif(n => ({ ...n, lowWallet: v }))}
              />
            </Field>

            <Field label="Daily Brier report">
              <Toggle
                checked={notif.dailyReport}
                onChange={(v: boolean) => setNotif(n => ({ ...n, dailyReport: v }))}
              />
            </Field>

            <Field label="Telegram chat ID">
              <input
                value={notif.telegramChatId}
                onChange={e => setNotif(n => ({ ...n, telegramChatId: e.target.value }))}
                placeholder="Telegram chat ID"
                className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-3 py-1.5 text-[13px] text-white outline-none focus:ring-white/25 w-48"
              />
            </Field>
          </div>

          <p className="text-[11px] text-white/35 mt-4 pt-2 border-t border-white/[0.05]">
            Stored locally; delivery is wired up backend-side (see ROADMAP).
          </p>
        </Card>

        {/* Card 4 — Connection */}
        <Card className="p-5 md:p-6">
          <SectionTitle>Connection</SectionTitle>

          <div className="divide-y divide-white/[0.05]">
            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">API endpoint</span>
              <span className="tnum text-[12px] text-white/60 truncate max-w-[60%]">{API_BASE}</span>
            </div>

            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">Realtime</span>
              {SSE_ENABLED
                ? (
                  <Badge className="text-apex-green bg-apex-green/10 ring-1 ring-apex-green/25">SSE</Badge>
                )
                : (
                  <Badge className="text-white/55 bg-white/5 ring-1 ring-white/10">Polling · 8s</Badge>
                )}
            </div>

            <div className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-white/55">Config source</span>
              <span className="text-[12px] text-white/60">
                {backendConfig ? 'Live (/config)' : 'Defaults (riskConfig)'}
              </span>
            </div>
          </div>
        </Card>

      </div>
    </>
  );
}
