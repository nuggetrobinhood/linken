import type { Position } from "./types";

// The demo position shown in the empty state so a user who hasn't opened any LP
// yet can still see — and play with — what LINKEN does. Clearly flagged isDemo
// so it's never mistaken for real data.
export const DEMO_POSITION: Position = {
  id: "demo-aapl-usdc",
  dex: "Uniswap v3",
  token0: "AAPL-T",
  token1: "USDC",
  isRwaPair: true,
  valueUsd: 14250,
  netCarry: {
    feesEarned: 88.2,
    impermanentLoss: -12.4,
    gasCost: -1.5,
    net: 74.3,
    apyPct: 11.4,
  },
  range: {
    lower: 175,
    upper: 210,
    current: 192.4,
    status: "in-range",
    distToUpperPct: 9.1,
    distToLowerPct: -9.0,
    timeToExitDays: { min: 4, max: 6 },
  },
  pool: {
    tvlUsd: 3300000,
    volume24hUsd: 1250000,
    fees24hUsd: 940,
    concentrationNearPrice: 0.62,
    thinDepth: false,
  },
  isDemo: true,
};
