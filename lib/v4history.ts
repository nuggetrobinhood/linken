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

function saltOf(tokenId: string): Hex {
  return `0x${BigInt(tokenId).toString(16).padStart(64, "0")}` as Hex;
}

function amountsAtTick(L: number, tickCur: number, tickLo: number, tickHi: number) {
  const sp = Math.pow(1.0001, tickCur / 2);
  const sa = Math.pow(1.0001, tickLo / 2);
  const sb = Math.pow(1.0001, tickHi / 2);
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

export async function getNetDepositsV4(
  tokenId: string,
  tickLower: number,
  tickUpper: number
): Promise<Deposits> {
  const posm = getAddress(UNISWAP_V4.positionManager);
  const pm = getAddress(UNISWAP_V4.poolManager);
  const id = BigInt(tokenId);
  const salt = saltOf(tokenId);

  try {
    const transfers = await client.getLogs({
      address: posm,
      event: TRANSFER,
      args: { tokenId: id },
      fromBlock: 0n,
      toBlock: "latest",
    });
    if (transfers.length === 0) {
      return { dep0: 0n, dep1: 0n, txHashes: [], ok: false };
    }

    const hashes = [...new Set(transfers.map((l) => l.transactionHash))];
    let dep0 = 0;
    let dep1 = 0;

    for (const hash of hashes) {
      const receipt = await client.getTransactionReceipt({ hash });
      const logs = await client.getLogs({
        address: pm,
        event: MODIFY,
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      const mine = logs.filter(
        (l) =>
          l.transactionHash === hash &&
          String(l.args.salt).toLowerCase() === salt.toLowerCase()
      );
      if (mine.length === 0) continue;

      let tick = tickLower;
      try {
        const slot = (await client.readContract({
          address: getAddress(UNISWAP_V4.stateView),
          abi: SLOT0_ABI,
          functionName: "getSlot0",
          args: [mine[0].args.id as Hex],
          blockNumber: receipt.blockNumber,
        })) as readonly unknown[];
        tick = Number(slot[1]);
      } catch {
        /* current-range fallback */
      }

      for (const l of mine) {
        const dL = Number(l.args.liquidityDelta ?? 0n);
        const { a0, a1 } = amountsAtTick(dL, tick, tickLower, tickUpper);
        dep0 += a0;
        dep1 += a1;
      }
    }

    return {
      dep0: BigInt(Math.max(0, Math.round(dep0))),
      dep1: BigInt(Math.max(0, Math.round(dep1))),
      txHashes: hashes,
      ok: true,
    };
  } catch {
    return { dep0: 0n, dep1: 0n, txHashes: [], ok: false };
  }
}
