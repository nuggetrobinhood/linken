import { createPublicClient, http, getAddress, type Address } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, NFPM_ABI, ERC20_ABI } from "./uniswap";

// Server-side RPC client. Reads run on the Next server (via /api/positions), not
// in the browser — no CORS issues, and it keeps RPC usage on-demand per wallet.
const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

// SLICE 1 output: the raw position fields straight from NonfungiblePositionManager,
// before any derived math. Verify these against the block explorer for a known
// wallet before building Slice 2 (pool price / range) on top.
export interface RawPosition {
  tokenId: string;
  token0: Address;
  token1: Address;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number; // 100 / 500 / 3000 / 10000
  tickLower: number;
  tickUpper: number;
  liquidity: string; // uint128 as string
  tokensOwed0: string;
  tokensOwed1: string;
}

const MAX_POSITIONS = 50; // bound RPC work per wallet

// Slice 1: enumerate a wallet's Uniswap v3 position NFTs and read each position's
// raw struct + the two tokens' symbols/decimals.
export async function getRawPositions(owner: string): Promise<RawPosition[]> {
  const account = getAddress(owner); // throws on a malformed address
  const nfpm = getAddress(UNISWAP_V3.nfpm);

  const balance = (await client.readContract({
    address: nfpm,
    abi: NFPM_ABI,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;

  const count = Math.min(Number(balance), MAX_POSITIONS);
  if (count === 0) return [];

  // token id for each owned position
  const tokenIds = (await Promise.all(
    Array.from({ length: count }, (_, i) =>
      client.readContract({
        address: nfpm,
        abi: NFPM_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: [account, BigInt(i)],
      })
    )
  )) as bigint[];

  // read each position struct
  const rawPositions = (await Promise.all(
    tokenIds.map((id) =>
      client.readContract({
        address: nfpm,
        abi: NFPM_ABI,
        functionName: "positions",
        args: [id],
      })
    )
  )) as readonly (readonly unknown[])[];

  // collect distinct token addresses and read symbol + decimals once each
  const tokenSet = new Set<string>();
  for (const p of rawPositions) {
    tokenSet.add(getAddress(p[2] as string));
    tokenSet.add(getAddress(p[3] as string));
  }
  const meta = await readTokenMeta([...tokenSet] as Address[]);

  return rawPositions.map((p, i) => {
    const token0 = getAddress(p[2] as string);
    const token1 = getAddress(p[3] as string);
    return {
      tokenId: (tokenIds[i] as bigint).toString(),
      token0,
      token1,
      token0Symbol: meta[token0]?.symbol ?? "?",
      token1Symbol: meta[token1]?.symbol ?? "?",
      token0Decimals: meta[token0]?.decimals ?? 18,
      token1Decimals: meta[token1]?.decimals ?? 18,
      fee: Number(p[4]),
      tickLower: Number(p[5]),
      tickUpper: Number(p[6]),
      liquidity: (p[7] as bigint).toString(),
      tokensOwed0: (p[10] as bigint).toString(),
      tokensOwed1: (p[11] as bigint).toString(),
    };
  });
}

interface TokenMeta {
  symbol: string;
  decimals: number;
}

async function readTokenMeta(
  tokens: Address[]
): Promise<Record<string, TokenMeta>> {
  const entries = await Promise.all(
    tokens.map(async (addr) => {
      try {
        const [symbol, decimals] = await Promise.all([
          client.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }),
          client.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }),
        ]);
        return [addr, { symbol: symbol as string, decimals: Number(decimals) }] as const;
      } catch {
        return [addr, { symbol: "?", decimals: 18 }] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}
