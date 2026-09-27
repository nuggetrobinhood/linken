import { createPublicClient, http, getAddress, type Address, type Hex } from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V3, NFPM_ABI, ERC20_ABI } from "./uniswap";
import { getRawV4Positions } from "./v4";

export interface RawPosition {
  protocol: "v3" | "v4";
  tokenId: string;
  token0: Address;
  token1: Address;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
  hooks?: Address;
  tickSpacing?: number;
  poolId?: Hex;
}

const MAX_POSITIONS = 50;

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

export async function getRawPositions(owner: string): Promise<RawPosition[]> {
  const [v3, v4] = await Promise.all([
    getRawV3Positions(owner),
    getRawV4Positions(owner),
  ]);
  return [...v3, ...v4];
}

export async function getRawV3Positions(owner: string): Promise<RawPosition[]> {
  const account = getAddress(owner);
  const nfpm = getAddress(UNISWAP_V3.nfpm);

  const balance = (await client.readContract({
    address: nfpm,
    abi: NFPM_ABI,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;

  const count = Math.min(Number(balance), MAX_POSITIONS);
  if (count === 0) return [];

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

  const tokenSet = new Set<string>();
  for (const p of rawPositions) {
    tokenSet.add(getAddress(p[2] as string));
    tokenSet.add(getAddress(p[3] as string));
  }
  const meta = await readTokenMeta([...tokenSet] as Address[]);

  return rawPositions
    .map((p, i) => {
      const token0 = getAddress(p[2] as string);
      const token1 = getAddress(p[3] as string);
      return {
        protocol: "v3" as const,
        tokenId: tokenIds[i].toString(),
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
    })
    .filter((p) => p.liquidity !== "0");
}

async function readTokenMeta(tokens: Address[]) {
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
  return Object.fromEntries(entries) as Record<string, { symbol: string; decimals: number }>;
}
