import {
  createPublicClient,
  http,
  getAddress,
  parseAbiItem,
  type Hex,
} from "viem";
import { robinhoodChain, RHC_RPC_URL } from "./chain";
import { UNISWAP_V4 } from "./v4";
import type { Deposits } from "./history";

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(RHC_RPC_URL),
});

const TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

const MODIFY = parseAbiItem(
  "event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)"
);

const MODIFY_TOPIC =
  "0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec";

const SLOT0_ABI = [
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

const ZERO = "0x0000000000000000000000000000000000000000";
const SPAN = 200_000n;

function sqrtP(tick: number) {
  return Math.exp((tick * Math.log(1.0001)) / 2);
}

function amountsAtTick(L: number, tickCur: number, tickLo: number, tickHi: number) {
  const sp = sqrtP(tickCur);
  const sa = sqrtP(tickLo);
  const sb = sqrtP(tickHi);
  let a0 = 0;
  let a1 = 0;
  if (tickCur < tickLo) a0 = L * (1 / sa - 1 / sb);
  else if (tickCur >= tickHi) a1 = L * (sb - sa);
  else {
    a0 = L * (1 / sp - 1 / sb);
    a1 = L * (sp - sa);
  }
  return { a0, a1 };
}

function toRaw(x: number): bigint {
  if (!Number.isFinite(x) || x === 0) return 0n;
  const sign = x < 0 ? -1n : 1n;
  const s = Math.abs(x).toFixed(0);
  if (!/^\d+$/.test(s)) return 0n;
  return sign * BigInt(s);
}

function readWord(data: Hex, index: number): bigint {
  const hex = data.slice(2);
  const slice = hex.slice(index * 64, index * 64 + 64);
  if (!slice) return 0n;
  return BigInt("0x" + slice);
}

function signed256(n: bigint): bigint {
  const two = 1n << 256n;
  return n >= 1n << 255n ? n - two : n;
}

export async function getNetDepositsV4(
  tokenId: string,
  tickLower: number,
  tickUpper: number
): Promise<Deposits & { matched: number; pmLogs: number; debug: unknown }> {
  const posm = getAddress(UNISWAP_V4.positionManager);
  const pm = getAddress(UNISWAP_V4.poolManager);
  const id = BigInt(tokenId);

  try {
    const head = await client.getBlockNumber();
    const fromLook = head > 2_000_000n ? head - 2_000_000n : 0n;
    const transfers = await client.getLogs({
      address: posm,
      event: TRANSFER,
      args: { tokenId: id },
      fromBlock: fromLook,
      toBlock: head,
    });
    const mint = transfers.find(
      (l) => (l.args.from as string | undefined)?.toLowerCase() === ZERO
    );
    if (!mint) {
      return { dep0: 0n, dep1: 0n, txHashes: [], ok: false, matched: 0, pmLogs: 0, debug: null };
    }

    const mintReceipt = await client.getTransactionReceipt({ hash: mint.transactionHash });
    let poolId: Hex | null = null;
    for (const log of mintReceipt.logs) {
      if (log.address.toLowerCase() !== pm.toLowerCase()) continue;
      if ((log.topics[0] ?? "").toLowerCase() !== MODIFY_TOPIC) continue;
      const salt = readWord(log.data as Hex, 3);
      if (salt !== id) continue;
      poolId = (log.topics[1] ?? "0x") as Hex;
      break;
    }
    if (!poolId) {
      return { dep0: 0n, dep1: 0n, txHashes: [mint.transactionHash], ok: false, matched: 0, pmLogs: 0, debug: "no poolId" };
    }

    const mods = [];
    let cursor = mint.blockNumber ?? fromLook;
    while (cursor <= head) {
      const to = cursor + SPAN > head ? head : cursor + SPAN;
      const chunk = await client.getLogs({
        address: pm,
        event: MODIFY,
        args: { id: poolId },
        fromBlock: cursor,
        toBlock: to,
      });
      mods.push(...chunk);
      cursor = to + 1n;
    }

    const mine = mods.filter((l) => BigInt(l.args.salt as string) === id);
    const hashes = [...new Set(mine.map((l) => l.transactionHash))];

    let dep0 = 0;
    let dep1 = 0;
    let debug: unknown = {
      poolId,
      mintBlock: mint.blockNumber?.toString(),
      poolLogs: mods.length,
      matched: mine.length,
    };

    for (const l of mine) {
      const dL = Number(l.args.liquidityDelta ?? 0n);
      const lo = Number(l.args.tickLower ?? tickLower);
      const hi = Number(l.args.tickUpper ?? tickUpper);
      let tick = tickLower;
      try {
        const slot = (await client.readContract({
          address: getAddress(UNISWAP_V4.stateView),
          abi: SLOT0_ABI,
          functionName: "getSlot0",
          args: [poolId],
          blockNumber: l.blockNumber,
        })) as readonly unknown[];
        tick = Number(slot[1]);
      } catch {
        tick = lo;
      }
      const { a0, a1 } = amountsAtTick(dL, tick, lo, hi);
      dep0 += a0;
      dep1 += a1;
      debug = { ...(debug as object), lastDL: dL, lastTick: tick, a0, a1 };
    }

    return {
      dep0: toRaw(dep0),
      dep1: toRaw(dep1),
      txHashes: hashes,
      ok: mine.length > 0,
      matched: mine.length,
      pmLogs: mods.length,
      debug,
    };
  } catch (e) {
    return {
      dep0: 0n,
      dep1: 0n,
      txHashes: [],
      ok: false,
      matched: 0,
      pmLogs: 0,
      debug: e instanceof Error ? e.message : "fail",
    };
  }
}
