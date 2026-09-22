import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodChain, RHC_RPC_URL } from "./chain";

// Injected connector (MetaMask, Rabby, and other browser EVM wallets) — the
// wallets LINKEN's target LP-degen users actually run. WalletConnect can be
// added here later behind NEXT_PUBLIC_WALLETCONNECT_ID.
export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(RHC_RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
