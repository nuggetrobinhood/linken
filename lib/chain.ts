import { defineChain } from "viem";

// Robinhood Chain — Ethereum L2 on Arbitrum Orbit stack. Chain ID 4663.
// RPC comes from env so you can swap the public endpoint for a provider later
// without touching anything else.

// Official public RPC (verified). Override with NEXT_PUBLIC_RHC_RPC_URL to point
// at a provider (Alchemy/Ankr/etc) once the public endpoint starts throttling.
export const RHC_RPC_URL =
  process.env.NEXT_PUBLIC_RHC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RHC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
  testnet: false,
});
