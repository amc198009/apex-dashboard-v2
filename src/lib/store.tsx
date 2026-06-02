'use client';

// APEX v2 — global live-data store. Polls the backend every 8s and shares
// state across all platform views via context, so navigating between pages
// never drops the live feed.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, type Trade, type HealthResponse, type CalibrationSummary, type BankrollStats, type QueueSummary } from './api';

const POLL_MS = 8000;
const EMPTY_SUMMARY: QueueSummary = { pending: 0, open: 0, closed: 0, failed: 0 };

interface ApexState {
  health: HealthResponse | null;
  trades: Trade[];
  summary: QueueSummary;
  calibration: CalibrationSummary | null;
  bankroll: BankrollStats | null;
  connected: boolean;
  lastRefresh: Date | null;
  error: string | null;
  // actions
  approve: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  triggerScan: () => Promise<void>;
  refresh: () => Promise<void>;
  scanning: boolean;
  busyId: string | null;
}

const Ctx = createContext<ApexState | null>(null);

export function ApexProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY);
  const [calibration, setCalibration] = useState<CalibrationSummary | null>(null);
  const [bankroll, setBankroll] = useState<BankrollStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [queueRes, healthRes] = await Promise.all([api.queue(), api.health()]);
      setTrades(queueRes.trades ?? []);
      setSummary(queueRes.summary ?? EMPTY_SUMMARY);
      setHealth(healthRes);
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'connection failed');
    }
    // secondary feeds — best effort, never block the primary view
    api.calibration().then(setCalibration).catch(() => {});
    api.bankroll().then(setBankroll).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [refresh]);

  const approve = useCallback(async (id: string) => {
    setBusyId(id);
    try { await api.approve(id); await refresh(); }
    finally { setBusyId(null); }
  }, [refresh]);

  const cancel = useCallback(async (id: string) => {
    setBusyId(id);
    try { await api.cancel(id); await refresh(); }
    finally { setBusyId(null); }
  }, [refresh]);

  const triggerScan = useCallback(async () => {
    setScanning(true);
    try { await api.scanTrigger(); } catch { /* surfaced via banner */ }
    setTimeout(() => { setScanning(false); refresh(); }, 3000);
  }, [refresh]);

  const value = useMemo<ApexState>(() => ({
    health, trades, summary, calibration, bankroll, connected, lastRefresh, error,
    approve, cancel, triggerScan, refresh, scanning, busyId,
  }), [health, trades, summary, calibration, bankroll, connected, lastRefresh, error, approve, cancel, triggerScan, refresh, scanning, busyId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApex(): ApexState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApex must be used within <ApexProvider>');
  return ctx;
}
