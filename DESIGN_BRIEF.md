# APEX — Design Brief / Master Prompt for Claude Design

> A self-contained brief to drive a high-fidelity UI/UX upgrade of the APEX
> dashboard. Paste the prompt block below into Claude Design. It encodes the real
> domain model, the existing design tokens, every screen and state, and the
> implementation constraints so the output is buildable in this codebase
> (Next.js 15 · React 19 · Tailwind · Recharts).
>
> Companion docs: [`ROADMAP.md`](./ROADMAP.md) (product roadmap).

---

## How to use

1. Copy the **Master Prompt** block below into Claude Design.
2. Pick a direction (see _Variants_ at the bottom) and tweak the
   "CURRENT DESIGN SYSTEM" section accordingly.
3. If Claude Design can emit code, request deliverable #6 (React + Tailwind) so
   the components drop straight into `src/components`.

---

## Master Prompt

```
ROLE
You are a senior product designer specializing in financial / trading interfaces.
Design a comprehensive UI/UX upgrade for "APEX", an autonomous prediction-market
trading dashboard. Produce high-fidelity, implementation-ready designs that a
Next.js + Tailwind engineer can build directly.

PRODUCT
APEX (Autonomous Polymarket Edge eXecution) is a dashboard for an AI agent that
autonomously scans Polymarket prediction markets, evaluates them through a
7-layer pipeline (signal classification -> Bayesian probability -> Kelly sizing ->
market filter -> resolution-risk -> monitor -> calibration), and queues trades for
one-click human approval. The operator reviews the agent's reasoning, approves
or rejects, and monitors open positions and performance. Real money is at stake,
so the UI must convey trust, precision, and risk awareness -- calm, not casino.

USERS & JOBS
- A solo operator (often on mobile) who needs to: glance at portfolio health,
  approve/reject pending trades with confidence, monitor open positions and
  live P&L, watch risk exposure vs. hard limits, and review calibration over time.
- Core emotional goals: "Can I trust this?", "What's my risk right now?",
  "Why did the agent pick this?", "Am I winning?"

TECH CONSTRAINTS (designs must be buildable in these)
- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts.
- Dark theme only. Fully responsive: desktop (left sidebar) and mobile
  (bottom tab bar). PWA / installable.
- Implementable with Tailwind utilities -- avoid effects that require heavy
  custom canvas/WebGL.

CURRENT DESIGN SYSTEM (evolve and elevate this -- do not discard the identity)
- Aesthetic: modern fintech, dark, "Linear meets Robinhood meets a trading desk."
- Surfaces: app bg #0B0D12 (with subtle radial-gradient glow), card #14161D,
  elevated #1B1E27, hairline borders rgba(255,255,255,0.07).
- Accents: brand red #F2555A; positive/green #22C55E; negative/red #F2555A;
  warning/amber #F59E0B; info/blue #5B9DFF.
- Type: Inter for UI; JetBrains Mono (tabular) for all numbers/prices/percentages.
- Shape & depth: rounded-2xl cards, soft shadows, generous whitespace, pill badges.
- Keep the APEX wordmark + "A" monogram brand mark (red on dark).

I want you to PUSH THIS FURTHER: stronger visual hierarchy, better data density
without clutter, more refined typography scale, purposeful color (semantic, not
decorative), tasteful motion, and a premium, trustworthy feel. Propose a refined
token set (colors, type scale, spacing, radii, shadows, elevation) as part of the
work.

DOMAIN MODEL (use real labels, states, and numbers)
- A Trade has: question, category, direction (YES/NO), entry price (shown in
  cents, e.g. 62c), model probability (%), net edge (% -- hard minimum 7%),
  Kelly fraction label, signal tier (T1 highest -> T4), allocation ($ and % of
  bankroll), resolution date/countdown, strongest counter-argument, and a status.
- Status lifecycle: PENDING_APPROVAL -> APPROVED -> EXECUTING -> OPEN ->
  CLOSED (with realized P&L + close reason) | FAILED (reason) | CANCELLED.
- Bankroll: live compounding value, starting/peak/current, growth %, drawdown
  from peak, 20% liquid reserve.
- Calibration: Brier score, calibration grade, per-category drift (predicted vs.
  actual), resolved count, session loss count.
- Hard risk constraints (surface these as live gauges vs. caps): min edge 7%,
  max single position 5%, max category 15%, max correlated cluster 20%, max
  portfolio 25%, max 8 concurrent positions, 20% bankroll reserve, min $10K
  market liquidity, no trade <48h to resolution, drawdown protocol (3 losses or
  8% session loss -> Kelly halved).

SCREENS TO DESIGN (desktop + mobile for each)
1. Overview -- portfolio health at a glance: KPI tiles (bankroll, exposure,
   session P&L, win rate, Brier), equity curve, the pending-approval queue
   (the hero -- make approving fast and confident), open positions snapshot,
   live risk monitor, session stats.
2. Positions -- open positions table with live unrealized P&L, category-exposure
   chart vs. caps, position-limit gauges, and closed-trade history.
3. Markets -- the scan funnel (scanned -> qualified vs. disqualified), the hard
   filter criteria, and a browsable candidate list.
4. Analytics -- equity curve, per-trade P&L, calibration scatter (predicted vs.
   actual with a diagonal ideal line), signal-tier & edge distributions,
   category-drift table.
5. Settings -- strategy/risk controls (editable knobs), paper-trading toggle,
   notification preferences, connection/status panel.

GLOBAL / CROSS-CUTTING COMPONENTS
- Navigation: desktop left sidebar (Overview/Positions/Markets/Analytics/
  Settings + bankroll + agent-online status); mobile bottom tab bar + slim top bar.
- Sticky TopBar per screen: title + live KPI strip + "Trigger scan" + "Evaluate"
  actions + drawdown/connection banners.
- The Trade Card -- the most important component. Design its states: collapsed
  (question, direction, tier, category, entry, prob, edge, Kelly, size, status,
  approve/reject) and expanded "reasoning drawer" (decision breakdown: edge vs.
  7% floor meter, model prob, entry, allocation, tier, Kelly; market/order IDs;
  and the strongest counter-argument). Make the reasoning legible and trustworthy.
- Toast notifications (info/success/warn/error) for fills, closes (with P&L),
  failures, drawdown, low wallet, reconnect.
- Command palette (Cmd+K) and a "Evaluate a market" modal (input -> result card).
- Risk monitor with gauges that clearly show safe / warning / breach.

REQUIRED STATES (design these explicitly, not just the happy path)
- Empty (no pending trades / no positions / no history -- agent scanning).
- Loading / skeletons. Disconnected ("backend unreachable") banner.
- Drawdown-active alert state. Indeterminate state when bankroll denominator is
  unknown (show absolute exposure, not a false "safe 0%").
- Dense (many trades) vs. sparse -- both should feel intentional.

UX PRINCIPLES (apply throughout)
- Trust & safety first: make risk, exposure, and the agent's confidence
  unmistakable. Destructive/irreversible actions (approve = real order) need
  clear affordance and a moment of friction without being annoying.
- Numbers are the content: tabular alignment, consistent precision, color only
  for meaning (green up / red down / amber caution).
- Scannability: strong hierarchy, the pending queue and risk state should read
  in <2 seconds. Progressive disclosure for depth (reasoning on demand).
- Mobile is a first-class citizen, not a squeeze.
- Motion with restraint: subtle entrances, state transitions, live "pulse" for
  online/streaming -- never distracting.

ACCESSIBILITY
- WCAG AA contrast on the dark theme. Don't rely on color alone for status
  (pair with icon/label). Visible focus states. Respect prefers-reduced-motion.
  Hit targets >=44px on mobile.

DELIVERABLES
1. A refined design-token spec (color roles, type scale, spacing, radii,
   shadows/elevation, motion) -- presented as a usable system.
2. High-fidelity designs for all 5 screens, in BOTH desktop and mobile, plus the
   key empty/loading/error states.
3. A component sheet: Trade Card (collapsed + expanded), KPI tile, risk gauge,
   status badges, buttons, tabs, table rows, toast, command palette, modal,
   charts styling.
4. 2-3 hero "wow" moments that elevate perceived quality (e.g., the approval
   flow, the equity curve, the risk monitor).
5. Brief rationale notes on key decisions (hierarchy, color semantics, density).
6. (If you can output code) production-ready React + Tailwind for the components,
   matching the token system, so it drops into the existing codebase.

QUALITY BAR
Reference the polish of Linear, Stripe Dashboard, Robinhood, and a Bloomberg
terminal's data density -- but with a calm, premium, trustworthy tone suited to
putting real money at risk. Surprise me with craft, but keep every pixel
functional and implementable.
```

---

## Variants (swap into the prompt to steer direction)

- **Evolve current look (default):** keep the "CURRENT DESIGN SYSTEM" section as-is.
- **Fresh reimagining:** replace that section's first line with
  _"Here is the current look for reference only — feel free to reimagine the
  visual language from scratch while preserving the APEX name and the dark theme."_
- **Denser pro-trader:** add to UX PRINCIPLES — _"Maximize information density;
  favor compact multi-panel layouts, inline sparklines, and a persistent ticker;
  minimize chrome."_
- **Calmer consumer-fintech:** add — _"Favor whitespace, large friendly numbers,
  fewer elements per view, and a reassuring, approachable tone."_

## Implementation notes (for whoever wires the output back in)

- Component code lives in `src/components`; design tokens in `tailwind.config.mjs`
  and `src/app/globals.css`. Numbers use the `.tnum` class (JetBrains Mono,
  tabular). Charts are Recharts (see `src/components/charts.tsx`).
- Keep component prop APIs stable where possible so views inherit restyles for free
  (see `src/components/ui.tsx`).
