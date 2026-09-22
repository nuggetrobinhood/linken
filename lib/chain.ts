import { defineChain } from "viem";

// Robinhood Chain — Ethereum L2 on Arbitrum Orbit stack. Chain ID 4663.
// RPC comes from env so you can swap the public endpoint for a provider later
// without touching anything else.
export const RHC_RPC_URL =
  process.env.NEXT_PUBLIC_RHC_RPC_URL || "https://rpc.robinhood.com"; // placeholder — set the real one in .env

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RHC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "RHC Explorer", url: "https://explorer.robinhood.com" }, // placeholder
  },
  testnet: false,
});
