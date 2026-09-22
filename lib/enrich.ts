import { createPublicClient, http, getAddress, type Address } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, FACTORY_ABI, POOL_ABI } from "./uniswap";
import { getRawPositions, type RawPosition } from "./parser";

// SLICE 2: turn raw ticks into price + range status. Finds the pool, reads its
// current tick (slot0), and derives whether the position is in range and how far
// price is from each bound. Prices are token1-per-token0.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

export interface EnrichedPosition extends RawPosition {
  pool: Address | null;
  currentTick: number | null;
  status: "in-range" | "out-of-range" | "unknown";
  priceCurrent: number | null; // token1 per token0
  priceLower: number;
  priceUpper: number;
  distToUpperPct: number | null;
  distToLowerPct: number | null;
}

// Uniswap price from a tick: 1.0001^tick, adjusted for the tokens' decimals.
function tickToPrice(tick: number, dec0: number, dec1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, dec0 - dec1);
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

const ZERO = "0x0000000000000000000000000000000000000000";

export async function getEnrichedPositions(owner: string): Promise<EnrichedPosition[]> {
  const raw = await getRawPositions(owner);
  const factory = getAddress(UNISWAP_V3.factory);

  return Promise.all(
    raw.map(async (p): Promise<EnrichedPosition> => {
      const priceLower = tickToPrice(p.tickLower, p.token0Decimals, p.token1Decimals);
      const priceUpper = tickToPrice(p.tickUpper, p.token0Decimals, p.token1Decimals);

      const base: EnrichedPosition = {
        ...p,
        pool: null,
        currentTick: null,
        status: "unknown",
        priceCurrent: null,
        priceLower: round(priceLower, 6),
        priceUpper: round(priceUpper, 6),
        distToUpperPct: null,
        distToLowerPct: null,
      };

      try {
        const poolAddr = (await client.readContract({
          address: factory,
          abi: FACTORY_ABI,
          functionName: "getPool",
          args: [p.token0, p.token1, p.fee],
        })) as string;

        if (!poolAddr || poolAddr.toLowerCase() === ZERO) return base;
        const pool = getAddress(poolAddr);

        const slot0 = (await client.readContract({
          address: pool,
          abi: POOL_ABI,
          functionName: "slot0",
        })) as readonly unknown[];

        const currentTick = Number(slot0[1]);
        const priceCurrent = tickToPrice(currentTick, p.token0Decimals, p.token1Decimals);

        return {
          ...base,
          pool,
          currentTick,
          status:
            currentTick >= p.tickLower && currentTick < p.tickUpper
              ? "in-range"
              : "out-of-range",
          priceCurrent: round(priceCurrent, 6),
          distToUpperPct: round(((priceUpper - priceCurrent) / priceCurrent) * 100, 2),
          distToLowerPct: round(((priceLower - priceCurrent) / priceCurrent) * 100, 2),
        };
      } catch {
        return base; // pool missing or read failed — keep tick-derived bounds only
      }
    })
  );
}
