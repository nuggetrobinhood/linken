import type { EnrichedPosition } from "./enrich";
import type { DataMeta } from "./types";

// ============================================================================
// THE DATA SEAM (now live)
// getPositions() fetches the real /api/positions endpoint, which returns the
// full net-carry data read on-chain. Empty array => empty state.
// ============================================================================

export async function getPositions(address: string): Promise<EnrichedPosition[]> {
  const res = await fetch(`/api/positions?address=${address}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  return (data.positions ?? []) as EnrichedPosition[];
}

export interface PortfolioSummary {
  totalValueQuote: number;
  netCarryQuote: number | null; // null if no position has full history
  rangeUtilizationPct: number;
  nearExit: number;
}

export function summarize(positions: EnrichedPosition[]): PortfolioSummary {
  const totalValueQuote = positions.reduce((s, p) => s + (p.valueQuote ?? 0), 0);
  const netParts = positions
    .map((p) => p.netCarryQuote)
    .filter((x): x is number => x !== null);
  const netCarryQuote = netParts.length
    ? Math.round(netParts.reduce((a, b) => a + b, 0) * 100) / 100
    : null;
  const inRange = positions.filter((p) => p.status === "in-range").length;
  const rangeUtilizationPct = positions.length
    ? Math.round((inRange / positions.length) * 100)
    : 0;
  const nearExit = positions.filter(
    (p) =>
      p.status === "in-range" &&
      p.distToUpperPct !== null &&
      p.distToLowerPct !== null &&
      (Math.abs(p.distToUpperPct) <= 2 || Math.abs(p.distToLowerPct) <= 2)
  ).length;
  return { totalValueQuote, netCarryQuote, rangeUtilizationPct, nearExit };
}

export function liveMeta(): DataMeta {
  return { lastUpdated: Date.now(), freshness: "fresh", delaySeconds: 0 };
}
