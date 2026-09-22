import type { Position } from "./types";

export interface StressResult {
  shockPct: number;
  status: "in-range" | "out-of-range";
  // Which single asset the position collapses into when it exits range.
  collapsedInto: string | null;
  estIlUsd: number; // negative
  remainingLpUsd: number;
}

// Market-hours "what-if": simulate a price shock on the RWA/crypto asset and
// report range status + IL impact.
//
// NOTE (Layer 1): this is a first-pass approximation for the MVP UI. Replace the
// IL model with a proper concentrated-liquidity calc (value of the CL position
// as price crosses ticks, honoring the "100% one asset once out of range"
// boundary). The signature stays the same, so the UI won't change.
export function simulateShock(pos: Position, shockPct: number): StressResult {
  const { lower, upper, current } = pos.range;
  const shocked = current * (1 + shockPct / 100);

  const outOfRange = shocked <= lower || shocked >= upper;
  const collapsedInto = outOfRange
    ? shocked <= lower
      ? pos.token0 // price of token0 (in token1) fell -> position is all token0
      : pos.token1
    : null;

  // Placeholder IL curve: grows with the magnitude of the move, capped.
  const mag = Math.abs(shockPct) / 100;
  const ilFraction = Math.min(mag * 0.9, 0.6);
  const estIlUsd = -(pos.valueUsd * ilFraction * 0.11 + Math.abs(shockPct) * 6);

  // Rough remaining value: base + IL + directional exposure of the position.
  const remainingLpUsd = pos.valueUsd + estIlUsd + pos.valueUsd * (shockPct / 100) * 0.4;

  return {
    shockPct,
    status: outOfRange ? "out-of-range" : "in-range",
    collapsedInto,
    estIlUsd,
    remainingLpUsd,
  };
}
