# LINKEN

Position risk & net-carry monitor for concentrated liquidity on **Robinhood Chain**.

Net carry = fees + rewards − impermanent loss − real gas. Per position. Not a
pool leaderboard, not a DEX — a truth layer for LP positions you already hold.

## Stack

- Next.js 14 (App Router) + TypeScript
- wagmi + viem (injected wallet: MetaMask, Rabby, etc.)
- Zero backend for Layer 0. Supabase/GitHub Actions only enter at Layer 2, if ever.

## Run it

```bash
npm install
cp .env.example .env      # set NEXT_PUBLIC_RHC_RPC_URL when you reach Layer 1
npm run dev               # http://localhost:3000
```

`npm run build` for a production build, `npm run typecheck` to check types.

## Pages

- `/` — landing (hero range band, problem, pillars, market-hours wedge, trust)
- `/terminal` — connect wallet → empty state (demo + CTA) → positions
- `/methodology` — trust layer stub (formulas + sources)

## The build ladder

**Layer 0 (this repo).** Full app shell, real wallet connect, real component
tree. `getPositions()` returns `[]`, so a connected wallet shows the empty state
with a playable demo position. No infra required.

**Layer 1 (next).** Implement `parseWalletPositions()` in
[`lib/positions.ts`](lib/positions.ts) — read the wallet's Uniswap v3/v4 (fork)
positions on RHC via RPC, compute tick math, fee accrual, IL and real gas, return
`Position[]` in the same shape. **Nothing else changes.** Keep it on-demand per
wallet (no chain-wide pool scanning) — that's what avoids the RPC/ingest blow-up
that killed TACO.

**Layer 2 (only if needed).** Supabase caching + GitHub Actions for net-carry
history and freshness, wired behind `liveMeta()`.

## The seam

Everything data-related lives in `lib/`:

| File | Role |
|------|------|
| `types.ts` | The contract. UI renders these shapes; Layer 1 fills them. |
| `positions.ts` | `getPositions()` — **the one function to implement for live data.** |
| `stress.ts` | `simulateShock()` — swap in a proper CL IL model, UI unchanged. |
| `demo.ts` | The empty-state demo position. |
| `format.ts` | Display helpers (rounding, exit band, etc.). |

## Notes

- Gas in net carry is **real third-party gas**, not the subsidized Robinhood
  Wallet figure. Keep it that way — that's what makes the number honest for
  wallet-based LPs.
- Time-to-exit is shown as a band (`~4–6 days`), never a false-precision decimal.
- Pool data is always position-bound. No "new pools" / APR leaderboard — that's
  NUGGET's job, deliberately kept out.
