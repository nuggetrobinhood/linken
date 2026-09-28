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
  if (!Number.isFinite(x) || x <= 0) return 0n;
  const s = x.toFixed(0);
  if (!/^\d+$/.test(s)) return 0n;
  return BigInt(s);
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

function signed24(n: bigint): number {
  const v = Number(n);
  return v >= 0x800000 ? v - 0x1000000 : v;
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
    const from = head > 2_000_000n ? head - 2_000_000n : 0n;
    const transfers = await client.getLogs({
      address: posm,
      event: TRANSFER,
      args: { tokenId: id },
      fromBlock: from,
      toBlock: head,
    });
    if (transfers.length === 0) {
        return { dep0: 0n, dep1: 0n, txHashes: [], ok: false, matched: 0, pmLogs: 0, debug: null };
    }

    const hashes = [...new Set(transfers.map((l) => l.transactionHash))];
    let dep0 = 0;
    let dep1 = 0;
    let matched = 0;
    let pmLogs = 0;
    let debug: unknown = null;

    for (const hash of hashes) {
      const receipt = await client.getTransactionReceipt({ hash });
      const mine: Array<{ poolId: Hex; dL: number; lo: number; hi: number }> = [];

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== pm.toLowerCase()) continue;
        pmLogs += 1;
        if ((log.topics[0] ?? "").toLowerCase() !== MODIFY_TOPIC) continue;
        const data = log.data as Hex;
        const tickLo = signed24(readWord(data, 0));
        const tickHi = signed24(readWord(data, 1));
        const dL = Number(signed256(readWord(data, 2)));
        const salt = readWord(data, 3);
        if (salt !== id) continue;
        const poolId = (log.topics[1] ?? "0x") as Hex;
        mine.push({ poolId, dL, lo: tickLo, hi: tickHi });
        matched += 1;
        debug = {
          dL,
          lo: tickLo,
          hi: tickHi,
          salt: salt.toString(),
          dataLen: data.length,
        };

      }
      if (mine.length === 0) continue;

      let tick = tickLower;
      try {
        const slot = (await client.readContract({
          address: getAddress(UNISWAP_V4.stateView),
          abi: SLOT0_ABI,
          functionName: "getSlot0",
          args: [mine[0].poolId],
          blockNumber: receipt.blockNumber,
        })) as readonly unknown[];
        tick = Number(slot[1]);
      } catch {
        tick = tickLower;
      }

      for (const m of mine) {
        const { a0, a1 } = amountsAtTick(m.dL, tick, m.lo, m.hi);
        dep0 += a0;
        dep1 += a1;
      }
    }

    return {
      dep0: toRaw(dep0),
      dep1: toRaw(dep1),
      txHashes: hashes,
      ok: true,
      matched,
      pmLogs,
    };
  } catch {
    return { dep0: 0n, dep1: 0n, txHashes: [], ok: false, matched: 0, pmLogs: 0, debug: null };
  }
}
