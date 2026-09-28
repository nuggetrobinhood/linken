import { createPublicClient, http, getAddress, formatUnits, type Address } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, FACTORY_ABI, POOL_ABI } from "./uniswap";
import { getRawPositions, type RawPosition } from "./parser";
import { getNetDeposits } from "./history";
import { getNetDepositsV4 } from "./v4history";
import { readV4Slot0, readV4Fees, UNISWAP_V4 } from "./v4";
import { getGas, getEthUsd } from "./gas";

// SLICE 2 + 3a + 3b: price/range status, live uncollected fees, current position
// value, impermanent loss, and gas — the full net carry. Every value is in token1
// (quote) units so nothing gets mixed across currencies; gas is valued via an
// ETH/USD reference.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

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
  priceCurrent: number | null;
  priceLower: number;
  priceUpper: number;
  distToUpperPct: number | null;
  distToLowerPct: number | null;
  // 3a — fees
  fees0: string;
  fees1: string;
  fees0Human: number;
  fees1Human: number;
  feesQuote: number | null;
  // 3b — value + IL
  amt0Human: number | null;
  amt1Human: number | null;
  valueQuote: number | null;
  dep0Human: number;
  dep1Human: number;
  ilQuote: number | null;
  historyOk: boolean;
  netCarryExGasQuote: number | null; // fees + IL
  // 3b — gas + full net carry
  gasEth: number;
  gasUsd: number | null;
  gasTxCount: number;
  netCarryQuote: number | null; // fees + IL − gas (the whole point)
}

function tickToPrice(tick: number, dec0: number, dec1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, dec0 - dec1);
}

const USDG = "0x5fC5360D0400A0Fd4F2af552ADD042d716f1d168".toLowerCase();

function toUsdg(
  amt0: number,
  amt1: number,
  priceT1perT0: number,
  token0: string,
  token1: string
): number | null {
  const a = token0.toLowerCase();
  const b = token1.toLowerCase();
  if (b === USDG) return amt0 * priceT1perT0 + amt1;
  if (a === USDG) {
    if (priceT1perT0 === 0) return amt0;
    return amt0 + amt1 / priceT1perT0;
  }
  return null;
}

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
  return { a0, a1 };
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const ZERO = "0x0000000000000000000000000000000000000000";

export async function getEnrichedPositions(owner: string): Promise<EnrichedPosition[]> {
  const account = getAddress(owner);
  const factory = getAddress(UNISWAP_V3.factory);
  const nfpm = getAddress(UNISWAP_V3.nfpm);
  const [raw, ethUsd] = await Promise.all([getRawPositions(owner), getEthUsd()]);

  return Promise.all(
    raw.map(async (p): Promise<EnrichedPosition> => {
      const priceLower = tickToPrice(p.tickLower, p.token0Decimals, p.token1Decimals);
      const priceUpper = tickToPrice(p.tickUpper, p.token0Decimals, p.token1Decimals);

            const isV4 = p.protocol === "v4";

            const [fees, deposits] = await Promise.all([
        isV4
          ? p.poolId
            ? readV4Fees(
                p.poolId,
                p.tokenId,
                p.tickLower,
                p.tickUpper,
                p.token0Decimals,
                p.token1Decimals
              ).catch(() => ({
                fees0: "0",
                fees1: "0",
                fees0Human: 0,
                fees1Human: 0,
              }))
            : Promise.resolve({
                fees0: "0",
                fees1: "0",
                fees0Human: 0,
                fees1Human: 0,
              })
          : readFees(nfpm, account, p),
          isV4
          ? getNetDepositsV4(p.tokenId, p.tickLower, p.tickUpper).catch(() => ({
              dep0: 0n,
              dep1: 0n,
              txHashes: [] as string[],
              ok: false,
            }))
          : getNetDeposits(p.tokenId),
      ]);
      const gas = await getGas(deposits.txHashes);
      const gasUsd = ethUsd === null ? null : round(gas.gasEth * ethUsd, 4);

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
        gasEth: round(gas.gasEth, 8),
        gasUsd,
        gasTxCount: gas.txCount,
        netCarryQuote: null,
      };

      try {
                   let currentTick: number;
        let pool: Address | null = null;

        if (isV4) {
          if (!p.poolId) return base;
          const s = await readV4Slot0(p.poolId);
          currentTick = s.tick;
          pool = getAddress(UNISWAP_V4.poolManager);
        } else {
          const poolAddr = (await client.readContract({
            address: factory,
            abi: FACTORY_ABI,
            functionName: "getPool",
            args: [p.token0, p.token1, p.fee],
          })) as string;
          if (!poolAddr || poolAddr.toLowerCase() === ZERO) return base;
          pool = getAddress(poolAddr);
          const slot0 = (await client.readContract({
            address: pool,
            abi: POOL_ABI,
            functionName: "slot0",
          })) as readonly unknown[];
          currentTick = Number(slot0[1]);
        }

        const priceCurrent = tickToPrice(currentTick, p.token0Decimals, p.token1Decimals);

        const { a0, a1 } = positionAmounts(
          Number(p.liquidity),
          currentTick,
          p.tickLower,
          p.tickUpper
        );
        const amt0Human = a0 / 10 ** p.token0Decimals;
        const amt1Human = a1 / 10 ** p.token1Decimals;
                const valueInT1 = amt0Human * priceCurrent + amt1Human;
        const feesInT1 = fees.fees1Human + fees.fees0Human * priceCurrent;
        const valueUsdg = toUsdg(amt0Human, amt1Human, priceCurrent, p.token0, p.token1);
        const feesUsdg = toUsdg(
          fees.fees0Human,
          fees.fees1Human,
          priceCurrent,
          p.token0,
          p.token1
        );
        const valueQuote = valueUsdg ?? valueInT1;
        const feesQuote = feesUsdg ?? feesInT1;

        let ilQuote: number | null = null;
        let netCarryExGasQuote: number | null = null;
        let netCarryQuote: number | null = null;
        if (deposits.ok && valueQuote > 0) {
          const holdQuote =
            toUsdg(dep0Human, dep1Human, priceCurrent, p.token0, p.token1) ??
            dep0Human * priceCurrent + dep1Human;
          ilQuote = valueQuote - holdQuote;
          netCarryExGasQuote = round(feesQuote + ilQuote, 4);
          if (gasUsd !== null) netCarryQuote = round(feesQuote + ilQuote - gasUsd, 4);
        }
        let dispNow = priceCurrent;
        let dispLo = priceLower;
        let dispHi = priceUpper;
        if (p.token0.toLowerCase() === USDG && priceCurrent !== 0) {
          dispNow = 1 / priceCurrent;
          dispLo = 1 / priceUpper;
          dispHi = 1 / priceLower;
        }
        return {
          ...base,
          pool,
          currentTick,
          status:
            currentTick >= p.tickLower && currentTick < p.tickUpper
              ? "in-range"
              : "out-of-range",
          priceCurrent: round(dispNow, 6),
          priceLower: round(dispLo, 6),
          priceUpper: round(dispHi, 6),
          distToUpperPct: round(((dispHi - dispNow) / dispNow) * 100, 2),
          distToLowerPct: round(((dispLo - dispNow) / dispNow) * 100, 2),
          feesQuote: round(feesQuote, 4),
          amt0Human: round(amt0Human, 6),
          amt1Human: round(amt1Human, 6),
          valueQuote: round(valueQuote, 2),
          ilQuote: ilQuote === null ? null : round(ilQuote, 4),
          netCarryExGasQuote,
          netCarryQuote,
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
