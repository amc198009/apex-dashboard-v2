# APEX — Platform Roadmap

> **APEX** (Autonomous Polymarket Edge eXecution) — autonomous prediction-market
> trading agent with one-click approval and automated lifecycle management.
>
> This document tracks the evolution of the platform beyond the current
> approval-dashboard. It spans two repos:
> - **`apex-dashboard-v2`** (this repo) — Next.js frontend on Vercel
> - **`apex-agent-v2`** — Node/Express agent + 7-layer evaluator on Railway
>
> Legend: ✅ done · 🟡 in progress · 🔜 frontend-ready (ships here) · 🧩 needs backend (`apex-agent-v2`)

---

## Vision

**Today:** a *monitoring + approval* dashboard for a single autonomous agent.

**Next:** a *trading operating system* — real-time, persistent, multi-strategy,
explainable, and safe to run with real money unattended.

---

## Phase 0 — Shipped

- ✅ Multi-view dashboard (Overview / Positions / Markets / Analytics)
- ✅ One-click approve / cancel, manual scan trigger
- ✅ Live risk monitor vs. hard constraints (with wallet-balance fallback)
- ✅ Analytics: equity curve, P&L, calibration scatter, tier/edge distributions
- ✅ Modern fintech design system
- ✅ Mobile-responsive (bottom tab bar)
- ✅ Security baseline (`next@15.5.x`, 0 npm-audit vulnerabilities)

---

## Phase 1 — Foundation (trust it unattended)

| Item | Where | Status |
|------|-------|--------|
| Real-time push (SSE/WebSocket) instead of 8s polling | both | 🔜 client ready (env-gated) · 🧩 server stream |
| Persist `tradeQueue` + `sessionState` to Postgres/Supabase | agent | 🧩 |
| API auth (key/JWT) on backend routes | both | 🔜 client header ready · 🧩 server |
| Lock `DASHBOARD_ORIGIN` (CORS) to the Vercel domain | agent | 🧩 |
| Fix `getWalletBalance()` returning null | agent | 🧩 |
| Alerts on FAILED / drawdown / low-wallet (Telegram/email/push) | agent | 🧩 (prefs UI 🔜) |
| Daily Brier-score report | agent | 🧩 |
| PWA install + push-ready manifest | this | ✅ |

## Phase 2 — Informed decisions & safe tuning

| Item | Where | Status |
|------|-------|--------|
| Reasoning drawer — full 7-layer breakdown + web-search citations per trade | this (+ agent payload) | 🟡 (breakdown shipped; citations need backend) |
| Live position marks → real-time unrealized P&L | both | 🔜 UI ready (`currentPrice`) · 🧩 price feed |
| Strategy controls from the UI (edge, Kelly, caps, `MIN_LIQUIDITY`) | both | 🔜 UI ready · 🧩 `GET/PATCH /config` |
| Paper-trading mode (simulated wallet, full pipeline) | both | 🔜 toggle ready · 🧩 engine |
| Order-depth / slippage preview before approving | both | 🧩 |
| Manual trade entry | both | 🧩 endpoint |
| Backtesting / replay over resolved markets | agent | 🧩 |

## Phase 3 — Automation & scale

| Item | Where | Status |
|------|-------|--------|
| Rule-based auto-approve (guardrailed) + hard kill switch | both | 🔜 UI · 🧩 engine |
| Scheduling: quiet hours, max trades/day, auto-pause < 20% bankroll | agent | 🧩 |
| Multi-strategy / multi-agent | both | 🧩 |
| Multi-venue (Kalshi, etc.) | agent | 🧩 |
| Immutable audit log of approvals/executions | both | 🧩 store |
| Command palette (⌘K) navigation + actions | this | ✅ |

---

## Backend work order (`apex-agent-v2`)

When a session is scoped to the agent repo, tackle in this order:

1. **`getWalletBalance()`** in `clobExecutor.js` — proxy-wallet / auth-header fix.
2. **Scan filter** — make `MIN_LIQUIDITY` env-overridable in `riskConfig.js`
   (`Number(process.env.MIN_LIQUIDITY) || 10000`) **and** audit `marketFilter.js`
   (Layer 4) for field-parsing bugs — Polymarket liquidity often returns as a
   string, so numeric comparisons can silently reject every market.
3. **Persistence** — swap in-memory Maps for Supabase/Postgres.
4. **Real-time** — add an SSE `/stream` endpoint emitting queue/position/health
   deltas (the dashboard already consumes it when `NEXT_PUBLIC_APEX_SSE=1`).
5. **`GET`/`PATCH /config`** — expose & mutate risk constants for the Settings UI.
6. **Auth + `DASHBOARD_ORIGIN`** — API key on routes, CORS locked to the domain.
7. **Alerts + daily report** — Telegram/email on FAILED/drawdown; daily Brier.

---

## Frontend contracts already in place for the backend to fulfil

- **Real-time:** dashboard opens `EventSource(`${API}/stream`)` when
  `NEXT_PUBLIC_APEX_SSE` is truthy; any event triggers a refresh. Falls back to
  8s polling otherwise. No client change needed when the endpoint lands.
- **Config:** Settings page calls `GET /config` and `PATCH /config`; degrades to
  read-only defaults (from `riskConfig` mirror) if the endpoint 404s.
- **Live P&L:** `Trade.currentPrice` is already consumed for unrealized P&L —
  just populate it.
- **Auth:** the API client forwards `NEXT_PUBLIC_APEX_KEY` as a bearer token when set.
