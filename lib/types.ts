// Domain types for LINKEN. These are the contract between the UI and the data
// source. Layer 0 returns demo/empty data shaped exactly like this; Layer 1
// fills the same shapes from on-chain reads. The UI never changes.

export type RangeStatus = "in-range" | "out-of-range";

export interface NetCarry {
  // All figures in USD, over the trailing window (default 7d).
  feesEarned: number; // swap fees + rewards accrued
  impermanentLoss: number; // negative number
  gasCost: number; // negative number — REAL third-party gas, not subsidized
  net: number; // feesEarned + impermanentLoss + gasCost
  apyPct: number; // net annualized as % of position value
}

export interface RangeHealth {
  lower: number; // lower price bound of the tick range
  upper: number; // upper price bound
  current: number; // current pool price
  status: RangeStatus;
  distToUpperPct: number; // +% headroom to upper bound
  distToLowerPct: number; // -% headroom to lower bound
  // Honest band, not false precision. e.g. { min: 4, max: 6 } => "~4–6 days".
  timeToExitDays: { min: number; max: number } | null;
}

export interface PoolHealth {
  // Pool context, ALWAYS bound to a position the user holds — never a leaderboard.
  tvlUsd: number;
  volume24hUsd: number;
  fees24hUsd: number;
  // Share of nearby liquidity concentrated around current price (0..1).
  // Higher = you get pushed out of range faster on a move.
  concentrationNearPrice: number;
  thinDepth: boolean; // trust flag — surface a warning badge when true
}

export interface Position {
  id: string; // NFT token id / position key
  dex: string; // e.g. "Uniswap v3", "Uniswap v4"
  token0: string; // symbol, e.g. "AAPL-T"
  token1: string; // symbol, e.g. "USDC"
  isRwaPair: boolean; // true when one leg is a tokenized equity (market-hours risk applies)
  valueUsd: number; // current position value
  netCarry: NetCarry;
  range: RangeHealth;
  pool: PoolHealth;
  isDemo?: boolean; // true for the empty-state demo card only
}

export interface PortfolioSummary {
  totalActiveLpUsd: number;
  netCarry7dUsd: number;
  netCarry7dApyPct: number;
  rangeUtilizationPct: number; // % of positions currently in range
}

export interface DataMeta {
  // Freshness signal for the header dot. Layer 0 = live (nothing cached yet).
  lastUpdated: number; // epoch ms
  freshness: "fresh" | "stale" | "cold";
  delaySeconds: number; // how far behind chain head, for the methodology/trust layer
}
