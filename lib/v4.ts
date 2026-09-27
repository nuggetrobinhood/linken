import {
  createPublicClient,
  http,
  getAddress,
  encodeAbiParameters,
  keccak256,
  parseAbiItem,
  type Address,
  type Hex,
} from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { ERC20_ABI } from "./uniswap";
import type { RawPosition } from "./parser";

export const UNISWAP_V4 = {
  poolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
  positionManager: "0x58daec3116aae6D93017bAAea7749052E8a04fA7",
  stateView: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
} as const;

const NATIVE = "0x0000000000000000000000000000000000000000" as Address;
const MAX_POSITIONS = 50;
const BLOCKSCOUT = "https://robinhoodchain.blockscout.com";
const POSM_FROM_BLOCK = 9000n;
const LOG_SPAN = 200_000n;

export const POSM_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "getPoolAndPositionInfo",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "info", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getPositionLiquidity",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "liquidity", type: "uint128" }],
  },
] as const;

export const STATE_VIEW_ABI = [
  {
    type: "function",
    name: "getSlot0",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
  },
] as const;

export type PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

export function toPoolId(key: PoolKey): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint24" },
        { type: "int24" },
        { type: "address" },
      ],
      [key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks]
    )
  );
}

function signed24(n: number) {
  return n >= 0x800000 ? n - 0x1000000 : n;
}

export function decodePositionInfo(info: bigint) {
  const tickLower = signed24(Number((info >> 8n) & 0xffffffn));
  const tickUpper = signed24(Number((info >> 32n) & 0xffffffn));
  return { tickLower, tickUpper };
}

const TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

async function tokenIdsFromBlockscout(owner: Address): Promise<bigint[]> {
  const ids = new Set<string>();
  const posm = UNISWAP_V4.positionManager;
  let url: string | null =
    `${BLOCKSCOUT}/api/v2/tokens/${posm}/instances?holder_address_hash=${owner}`;

  for (let i = 0; i < 8 && url; i++) {
    const res: Response = await fetch (url);
    if (!res.ok) throw new Error(`blockscout ${res.status}`);
    const json = await res.json();
    const items = (json.items ?? []) as Array<{ id?: string }>;
    for (const it of items) {
      if (it.id) ids.add(it.id);
    }
    const next = json.next_page_params;
    url = next
      ? `${BLOCKSCOUT}/api/v2/tokens/${posm}/instances?holder_address_hash=${owner}&` +
        new URLSearchParams(next as Record<string, string>).toString()
      : null;
  }
  return [...ids].map((x) => BigInt(x));
}

async function tokenIdsFromLogs(owner: Address): Promise<bigint[]> {
  const posm = getAddress(UNISWAP_V4.positionManager);
  const head = await client.getBlockNumber();
  const ids = new Set<bigint>();
  let from = POSM_FROM_BLOCK;
  while (from <= head) {
    const to = from + LOG_SPAN > head ? head : from + LOG_SPAN;
    try {
      const logs = await client.getLogs({
        address: posm,
        event: TRANSFER,
        args: { to: owner },
        fromBlock: from,
        toBlock: to,
      });
      for (const l of logs) {
        if (l.args.tokenId !== undefined) ids.add(l.args.tokenId);
      }
    } catch {
      // skip chunk
    }
    from = to + 1n;
  }
  return [...ids];
}

async function readTokenMeta(tokens: Address[]) {
  const entries = await Promise.all(
    tokens.map(async (addr) => {
      if (addr.toLowerCase() === NATIVE) {
        return [addr, { symbol: "ETH", decimals: 18 }] as const;
      }
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

export async function getRawV4Positions(owner: string): Promise<RawPosition[]> {
  const account = getAddress(owner);
  const posm = getAddress(UNISWAP_V4.positionManager);

  const ids = await tokenIdsFromBlockscout(account);
  if (ids.length === 0) return [];

  const owned: bigint[] = [];
  for (const id of ids) {
    try {
      const o = (await client.readContract({
        address: posm,
        abi: POSM_ABI,
        functionName: "ownerOf",
        args: [id],
      })) as Address;
      if (getAddress(o) === account) owned.push(id);
    } catch {
      // burned
    }
  }
  const capped = owned.slice(0, MAX_POSITIONS);
  const rows = await Promise.all(
    capped.map(async (id) => {
      const [infoRes, liq] = await Promise.all([
        client.readContract({
          address: posm,
          abi: POSM_ABI,
          functionName: "getPoolAndPositionInfo",
          args: [id],
        }),
        client.readContract({
          address: posm,
          abi: POSM_ABI,
          functionName: "getPositionLiquidity",
          args: [id],
        }),
      ]);
      const [poolKey, packed] = infoRes as [PoolKey, bigint];
      const { tickLower, tickUpper } = decodePositionInfo(packed);
      return {
        id,
        poolKey: {
          currency0: getAddress(poolKey.currency0),
          currency1: getAddress(poolKey.currency1),
          fee: Number(poolKey.fee),
          tickSpacing: Number(poolKey.tickSpacing),
          hooks: getAddress(poolKey.hooks),
        },
        tickLower,
        tickUpper,
        liquidity: liq as bigint,
      };
    })
  );

  const live = rows.filter((r) => r.liquidity > 0n);
  if (live.length === 0) return [];

  const tokenSet = new Set<Address>();
  for (const r of live) {
    tokenSet.add(r.poolKey.currency0);
    tokenSet.add(r.poolKey.currency1);
  }
  const meta = await readTokenMeta([...tokenSet]);

  return live.map((r) => {
    const t0 = r.poolKey.currency0;
    const t1 = r.poolKey.currency1;
    return {
      protocol: "v4" as const,
      tokenId: r.id.toString(),
      token0: t0,
      token1: t1,
      token0Symbol: meta[t0]?.symbol ?? "?",
      token1Symbol: meta[t1]?.symbol ?? "?",
      token0Decimals: meta[t0]?.decimals ?? 18,
      token1Decimals: meta[t1]?.decimals ?? 18,
      fee: r.poolKey.fee,
      tickLower: r.tickLower,
      tickUpper: r.tickUpper,
      liquidity: r.liquidity.toString(),
      tokensOwed0: "0",
      tokensOwed1: "0",
      hooks: r.poolKey.hooks,
      tickSpacing: r.poolKey.tickSpacing,
      poolId: toPoolId(r.poolKey),
    };
  });
}

export async function readV4Slot0(poolId: Hex) {
  const res = (await client.readContract({
    address: getAddress(UNISWAP_V4.stateView),
    abi: STATE_VIEW_ABI,
    functionName: "getSlot0",
    args: [poolId],
  })) as readonly [bigint, number, number, number];
  return { sqrtPriceX96: res[0], tick: Number(res[1]), lpFee: Number(res[3]) };
}
