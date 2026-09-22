import { createPublicClient, http, getAddress, formatUnits, type Address } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, FACTORY_ABI, POOL_ABI } from "./uniswap";
import { getRawPositions, type RawPosition } from "./parser";
import { getNetDeposits } from "./history";

// SLICE 2 + 3a + 3b: price/range status, live uncollected fees, current position
// value, and impermanent loss. Every value is expressed in token1 (quote) units
// so nothing gets mixed across currencies.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

// NonfungiblePositionManager.collect, simulated (eth_call) from the owner with
// max amounts to read live uncollected fees.
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
  // 3a — live uncollected fees
  fees0: string;
  fees1: string;
  fees0Human: number;
  fees1Human: number;
  feesQuote: number | null; // fees valued in token1 units
  // 3b — current composition, value, IL (all token1 units where noted)
  amt0Human: number | null; // current token0 in the position
  amt1Human: number | null; // current token1 in the position
  valueQuote: number | null; // position value in token1 units (needs price only)
  dep0Human: number; // net token0 deposited
  dep1Human: number; // net token1 deposited
  ilQuote: number | null; // impermanent loss in token1 units (needs deposit history)
  historyOk: boolean; // false => getLogs failed, IL not trustworthy
  netCarryExGasQuote: number | null; // feesQuote + ilQuote (gas still to come)
}

function tickToPrice(tick: number, dec0: number, dec1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, dec0 - dec1);
}

// Raw token amounts held by a position, from liquidity L and the tick bounds.
function positionAmounts(L: number, tickCur: number, tickLo: number, tickHi: number) {
  const sp = Math.pow(1.0001, tickCur / 2);
  const sa = Math.pow(1.0001, tickLo / 2);
  const sb = Math.pow(1.0001, tickHi / 2);
  let a0 = 0;
  let a1 = 0;
  if (tickCur < tickLo) {
    a0 = L * (1 / sa - 1 / sb);
  } else if (tickCur >= tickHi) {
    a1 = L * (sb - sa);
  } else {
    a0 = L * (1 / sp - 1 / sb);
    a1 = L * (sp - sa);
  }
  return { a0, a1 }; // raw (wei-like) units
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

      const [fees, deposits] = await Promise.all([
        readFees(nfpm, account, p),
        getNetDeposits(p.tokenId),
      ]);
      const dep0Human = Number(deposits.dep0) / 10 ** p.token0Decimals;
      const dep1Human = Number(deposits.dep1) / 10 ** p.token1Decimals;

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
        amt0Human: null,
        amt1Human: null,
        valueQuote: null,
        dep0Human: round(dep0Human, 6),
        dep1Human: round(dep1Human, 6),
        ilQuote: null,
        historyOk: deposits.ok,
        netCarryExGasQuote: null,
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

        // current composition + value (needs only price, not history)
        const { a0, a1 } = positionAmounts(
          Number(p.liquidity),
          currentTick,
          p.tickLower,
          p.tickUpper
        );
        const amt0Human = a0 / 10 ** p.token0Decimals;
        const amt1Human = a1 / 10 ** p.token1Decimals;
        const valueQuote = amt0Human * priceCurrent + amt1Human;

        // IL (needs deposit history). Hold value = what the deposited tokens are
        // worth now; IL = position value now − hold value (fees excluded).
        let ilQuote: number | null = null;
        let netCarryExGasQuote: number | null = null;
        const feesQuote = fees.fees1Human + fees.fees0Human * priceCurrent;
        if (deposits.ok) {
          const holdQuote = dep0Human * priceCurrent + dep1Human;
          ilQuote = valueQuote - holdQuote;
          netCarryExGasQuote = round(feesQuote + ilQuote, 4);
        }

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
          amt0Human: round(amt0Human, 6),
          amt1Human: round(amt1Human, 6),
          valueQuote: round(valueQuote, 2),
          ilQuote: ilQuote === null ? null : round(ilQuote, 4),
          netCarryExGasQuote,
        };
      } catch {
        return base;
      }
    })
  );
}

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
