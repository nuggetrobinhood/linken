import type { Position, PortfolioSummary, DataMeta } from "./types";

// ============================================================================
// THE DATA SEAM
// ----------------------------------------------------------------------------
// This is the ONLY place that needs to change to go from Layer 0 (shell) to
// Layer 1 (live data). The terminal UI calls getPositions() and renders whatever
// comes back — empty array => empty state, non-empty => position cards.
//
// LAYER 0 (now): returns [] for every wallet. The UI shows the empty state with
//   the demo position + CTA. Zero infra required.
//
// LAYER 1 (next): implement parseWalletPositions() below — read the wallet's
//   Uniswap v3/v4 (fork) NFT positions on Robinhood Chain via RPC, compute tick
//   math, fee accrual, IL and real gas, and return Position[] in the SAME shape.
//   Nothing downstream changes.
//
// Keep it on-demand per wallet (no chain-wide pool scanning) — that's what keeps
// LINKEN's RPC load light and avoids the ingest blow-up that killed TACO.
// ============================================================================

export async function getPositions(address: `0x${string}`): Promise<Position[]> {
  // --- Layer 1 goes here ---
  // return parseWalletPositions(address);
  void address;
  return [];
}

// Placeholder for the Layer 1 implementation. Left unexported and unused on
// purpose — this is the function to build next.
//
// async function parseWalletPositions(address: `0x${string}`): Promise<Position[]> {
//   const client = createPublicClient({ chain: robinhoodChain, transport: http() });
//   1. enumerate NFT position ids owned by `address` on each known NFPM (v3/v4 forks)
//   2. read position + pool slot0/ticks
//   3. compute range health, fee accrual, IL, gas
//   4. map into Position[]
// }

export function summarize(positions: Position[]): PortfolioSummary {
  const active = positions.filter((p) => !p.isDemo);
  const totalActiveLpUsd = active.reduce((s, p) => s + p.valueUsd, 0);
  const netCarry7dUsd = active.reduce((s, p) => s + p.netCarry.net, 0);
  const inRange = active.filter((p) => p.range.status === "in-range").length;
  const rangeUtilizationPct = active.length
    ? Math.round((inRange / active.length) * 100)
    : 0;
  const apy = totalActiveLpUsd
    ? (netCarry7dUsd / totalActiveLpUsd) * (365 / 7) * 100
    : 0;

  return {
    totalActiveLpUsd,
    netCarry7dUsd,
    netCarry7dApyPct: Math.round(apy * 10) / 10,
    rangeUtilizationPct,
  };
}

export function liveMeta(): DataMeta {
  // Layer 0: nothing is cached, so data is as-fresh-as-the-read. Layer 2 (if you
  // add Supabase caching) sets this from the cache timestamp.
  return { lastUpdated: Date.now(), freshness: "fresh", delaySeconds: 0 };
}
