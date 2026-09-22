import { createPublicClient, http, getAddress, parseAbiItem } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3 } from "./uniswap";

// SLICE 3b — position history. Pulls the position's IncreaseLiquidity /
// DecreaseLiquidity events (filtered by tokenId) to reconstruct net deposited
// amounts (cost basis for IL) and the set of tx hashes (for gas later).
//
// This is the make-or-break for a no-indexer approach: if the public RPC caps
// getLogs range, `ok` comes back false and callers fall back gracefully — that's
// the signal we need chunking or an indexer, not a silent wrong number.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

const INCREASE = parseAbiItem(
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
);
const DECREASE = parseAbiItem(
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
);

export interface Deposits {
  dep0: bigint; // net token0 put in (increases − decreases), raw
  dep1: bigint; // net token1 put in, raw
  txHashes: string[]; // every tx that touched this position's liquidity (for gas)
  ok: boolean; // false if the log query failed (RPC range/limit) — IL not trustworthy then
}

export async function getNetDeposits(tokenId: string): Promise<Deposits> {
  const nfpm = getAddress(UNISWAP_V3.nfpm);
  const id = BigInt(tokenId);
  try {
    const [inc, dec] = await Promise.all([
      client.getLogs({ address: nfpm, event: INCREASE, args: { tokenId: id }, fromBlock: 0n, toBlock: "latest" }),
      client.getLogs({ address: nfpm, event: DECREASE, args: { tokenId: id }, fromBlock: 0n, toBlock: "latest" }),
    ]);

    let dep0 = 0n;
    let dep1 = 0n;
    const tx = new Set<string>();

    for (const l of inc) {
      dep0 += l.args.amount0 ?? 0n;
      dep1 += l.args.amount1 ?? 0n;
      tx.add(l.transactionHash);
    }
    for (const l of dec) {
      dep0 -= l.args.amount0 ?? 0n;
      dep1 -= l.args.amount1 ?? 0n;
      tx.add(l.transactionHash);
    }

    return { dep0, dep1, txHashes: [...tx], ok: true };
  } catch {
    return { dep0: 0n, dep1: 0n, txHashes: [], ok: false };
  }
}
