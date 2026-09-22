import { createPublicClient, http, getAddress } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { POOL_ABI } from "./uniswap";

// SLICE 3b (gas). Gas is paid in ETH regardless of the position's tokens, so to
// value it in USD we read an ETH/USD reference from the WETH/USDG 0.05% pool
// (token0=WETH 18dec, token1=USDG 6dec → slot0 price = USDG per WETH = ETH/USD).
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

const ETH_USD_POOL = "0x69BfaF19C9f377BB306a89aEd9F6B07e2c1a8d9a";

function tickToPrice(tick: number, dec0: number, dec1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, dec0 - dec1);
}

export async function getEthUsd(): Promise<number | null> {
  try {
    const slot0 = (await client.readContract({
      address: getAddress(ETH_USD_POOL),
      abi: POOL_ABI,
      functionName: "slot0",
    })) as readonly unknown[];
    return tickToPrice(Number(slot0[1]), 18, 6);
  } catch {
    return null;
  }
}

export interface GasResult {
  gasEth: number; // total ETH spent across the position's liquidity txs
  txCount: number;
  ok: boolean; // false if a receipt read failed
}

// Sum gasUsed * effectiveGasPrice across every tx that touched the position.
// (Arbitrum Orbit prices the L1 data component into L2 gas, so this is close to
// the real ETH paid; refine later if needed.)
export async function getGas(txHashes: string[]): Promise<GasResult> {
  if (txHashes.length === 0) return { gasEth: 0, txCount: 0, ok: true };
  try {
    const receipts = await Promise.all(
      txHashes.map((h) => client.getTransactionReceipt({ hash: h as `0x${string}` }))
    );
    let wei = 0n;
    for (const r of receipts) wei += r.gasUsed * r.effectiveGasPrice;
    return { gasEth: Number(wei) / 1e18, txCount: txHashes.length, ok: true };
  } catch {
    return { gasEth: 0, txCount: 0, ok: false };
  }
}
