'use client';

import { useEffect, useRef } from 'react';
import { useApex } from '../lib/store';
import { useToast } from './Toast';
import { useLocalStorage } from '../lib/useLocalStorage';
import { signedUsd } from '../lib/format';
import type { TradeStatus } from '../lib/api';

interface NotifPrefs { failedTrades: boolean; drawdown: boolean; lowWallet: boolean; dailyReport: boolean; telegramChatId: string; }
const DEFAULT_PREFS: NotifPrefs = { failedTrades: true, drawdown: true, lowWallet: true, dailyReport: false, telegramChatId: '' };

// Observes the live store and raises toast alerts on meaningful transitions.
// Renders nothing. Baseline is captured on first load so existing state is not
// re-announced.
export function AlertsWatcher() {
  const { trades, health, bankroll, connected } = useApex();
  const { push } = useToast();
  const [prefs] = useLocalStorage<NotifPrefs>('apex.notifications', DEFAULT_PREFS);

  const ready = useRef(false);
  const prevStatus = useRef<Map<string, TradeStatus>>(new Map());
  const prevDrawdown = useRef<boolean>(false);
  const prevConnected = useRef<boolean>(true);
  const lowWalletFired = useRef(false);

  useEffect(() => {
    const cur = new Map(trades.map(t => [t.id, t.status] as const));

    if (!ready.current) {
      prevStatus.current = cur;
      prevDrawdown.current = !!health?.drawdownActive;
      prevConnected.current = connected;
      ready.current = true;
      return;
    }

    for (const t of trades) {
      const prev = prevStatus.current.get(t.id);
      if (prev === t.status) continue;
      const q = t.question;
      if (prev === undefined && t.status === 'PENDING_APPROVAL') {
        push({ kind: 'info', title: 'New trade pending approval', msg: q });
      } else if (t.status === 'OPEN' && prev !== 'OPEN') {
        push({ kind: 'success', title: 'Position opened', msg: q });
      } else if (t.status === 'CLOSED' && prev !== 'CLOSED') {
        push({ kind: t.pnl != null && t.pnl >= 0 ? 'success' : 'info', title: `Position closed${t.pnl != null ? ` · ${signedUsd(t.pnl)}` : ''}`, msg: q });
      } else if (t.status === 'FAILED' && prev !== 'FAILED' && prefs.failedTrades) {
        push({ kind: 'error', title: 'Trade failed', msg: t.failureReason ?? q });
      }
    }
    prevStatus.current = cur;

    // Drawdown protocol transitions
    const dd = !!health?.drawdownActive;
    if (dd !== prevDrawdown.current) {
      if (dd && prefs.drawdown) push({ kind: 'warn', title: 'Drawdown protocol active', msg: 'Kelly fractions halved' });
      if (!dd) push({ kind: 'success', title: 'Drawdown protocol cleared' });
      prevDrawdown.current = dd;
    }

    // Low wallet vs. bankroll (once until it recovers)
    if (prefs.lowWallet && health?.walletBalance != null && bankroll?.current) {
      const low = health.walletBalance < 0.2 * bankroll.current;
      if (low && !lowWalletFired.current) {
        push({ kind: 'warn', title: 'Wallet balance low', msg: 'Below 20% of bankroll' });
        lowWalletFired.current = true;
      } else if (!low) {
        lowWalletFired.current = false;
      }
    }

    // Reconnect
    if (connected !== prevConnected.current) {
      if (connected) push({ kind: 'success', title: 'Reconnected to agent' });
      prevConnected.current = connected;
    }
  }, [trades, health, bankroll, connected, prefs, push]);

  return null;
}
