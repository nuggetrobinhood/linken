import { createPublicClient, http, getAddress, formatUnits, type Address } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, FACTORY_ABI, POOL_ABI } from "./uniswap";
import { getRawPositions, type RawPosition } from "./parser";

// SLICE 2 + 3a: turn raw ticks into price + range status, and read live
// uncollected fees. Prices are token1-per-token0.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

// NonfungiblePositionManager.collect — non-view. We eth_call (simulate) it with
// max amounts and the owner as sender to read live uncollected fees without
// actually collecting. collect() pokes the pool first, so this returns fees
// brought fully up to date.
const NFPM_COLLECT_ABI = [
  {
    type: "function",
    name: "collect",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" },
        ],
      },
    ],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
] as const;

const MAX_U128 = (1n << 128n) - 1n;

export interface EnrichedPosition extends RawPosition {
  pool: Address | null;
  currentTick: number | null;
  status: "in-range" | "out-of-range" | "unknown";
  priceCurrent: number | null; // token1 per token0
  priceLower: number;
  priceUpper: number;
  distToUpperPct: number | null;
  distToLowerPct: number | null;
  // Slice 3a — live uncollected fees
  fees0: string; // raw token0
  fees1: string; // raw token1
  fees0Human: number;
  fees1Human: number;
  feesQuote: number | null; // total fees valued in token1 units (fees1 + fees0*price)
}

function tickToPrice(tick: number, dec0: number, dec1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, dec0 - dec1);
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const ZERO = "0x0000000000000000000000000000000000000000";

export async function getEnrichedPositions(owner: string): Promise<EnrichedPosition[]> {
  const account = getAddress(owner);
  const factory = getAddress(UNISWAP_V3.factory);
  const nfpm = getAddress(UNISWAP_V3.nfpm);
  const raw = await getRawPositions(owner);

  return Promise.all(
    raw.map(async (p): Promise<EnrichedPosition> => {
      const priceLower = tickToPrice(p.tickLower, p.token0Decimals, p.token1Decimals);
      const priceUpper = tickToPrice(p.tickUpper, p.token0Decimals, p.token1Decimals);
      const fees = await readFees(nfpm, account, p);

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
        ...fees,
        feesQuote: null,
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
        const feesQuote = fees.fees1Human + fees.fees0Human * priceCurrent;

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
          feesQuote: round(feesQuote, 4),
        };
      } catch {
        return base;
      }
    })
  );
}

// Live uncollected fees via a simulated collect() from the owner.
async function readFees(
  nfpm: Address,
  account: Address,
  p: RawPosition
): Promise<{ fees0: string; fees1: string; fees0Human: number; fees1Human: number }> {
  try {
    const sim = await client.simulateContract({
      address: nfpm,
      abi: NFPM_COLLECT_ABI,
      functionName: "collect",
      args: [
        {
          tokenId: BigInt(p.tokenId),
          recipient: account,
          amount0Max: MAX_U128,
          amount1Max: MAX_U128,
        },
      ],
      account,
    });
    const [a0, a1] = sim.result as [bigint, bigint];
    return {
      fees0: a0.toString(),
      fees1: a1.toString(),
      fees0Human: parseFloat(formatUnits(a0, p.token0Decimals)),
      fees1Human: parseFloat(formatUnits(a1, p.token1Decimals)),
    };
  } catch {
    return { fees0: "0", fees1: "0", fees0Human: 0, fees1Human: 0 };
  }
}
