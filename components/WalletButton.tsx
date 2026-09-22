"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { shortAddress } from "@/lib/format";

// Connect / disconnect control. On Layer 0 this connects a real wallet; the
// terminal then reads positions via the data seam (which returns [] until
// Layer 1 lands, so a connected wallet shows the empty state).
export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const base: React.CSSProperties = {
    fontFamily: "var(--m)",
    fontSize: 12,
    padding: compact ? "7px 13px" : "12px 22px",
    borderRadius: 8,
  };

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        title="Disconnect"
        style={{
          ...base,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          color: "var(--fg2)",
          background: "transparent",
          border: "0.5px solid var(--line2)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--pos)",
            display: "inline-block",
          }}
        />
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      style={{
        ...base,
        color: "var(--brand)",
        background: "transparent",
        border: "0.5px solid var(--brand)",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
