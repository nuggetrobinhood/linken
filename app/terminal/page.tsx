"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TerminalHeader } from "@/components/TerminalHeader";
import { EmptyState } from "@/components/EmptyState";
import { PositionCard } from "@/components/PositionCard";
import { PortfolioSummaryBar } from "@/components/PortfolioSummaryBar";
import { WalletButton } from "@/components/WalletButton";
import { getPositions, summarize, liveMeta } from "@/lib/positions";
import type { Position } from "@/lib/types";

export default function TerminalPage() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading] = useState(false);
  const meta = liveMeta();

  useEffect(() => {
    if (!isConnected || !address) {
      setPositions(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // The data seam. Layer 0 resolves to [] -> empty state. Layer 1 fills this.
    getPositions(address)
      .then((p) => {
        if (!cancelled) setPositions(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <TerminalHeader meta={meta} />
        <div style={{ padding: 16 }}>
          {!isConnected ? (
            <Connect />
          ) : loading || positions === null ? (
            <Loading />
          ) : positions.length === 0 ? (
            <EmptyState />
          ) : (
            <Positions positions={positions} />
          )}
        </div>
      </div>
    </main>
  );
}

function Connect() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "72px 20px",
        border: "0.5px solid var(--line)",
        borderRadius: 12,
        background: "var(--ink2)",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
        Connect a wallet to begin
      </div>
      <div style={{ fontSize: 13, color: "var(--fg2)", maxWidth: "42ch", margin: "0 auto 22px", lineHeight: 1.6 }}>
        LINKEN reads your concentrated-liquidity positions on Robinhood Chain and
        shows the net carry on each. Read-only — it never moves your funds.
      </div>
      <WalletButton />
    </div>
  );
}

function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "72px 20px", color: "var(--fg3)", fontFamily: "var(--m)", fontSize: 13 }}>
      Reading positions…
    </div>
  );
}

function Positions({ positions }: { positions: Position[] }) {
  const summary = summarize(positions);
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--m)",
          fontSize: 11,
          color: "var(--fg2)",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        PORTFOLIO
      </div>
      <PortfolioSummaryBar summary={summary} />
      <div
        style={{
          fontFamily: "var(--m)",
          fontSize: 11,
          color: "var(--fg2)",
          letterSpacing: 1,
          margin: "4px 0 10px",
        }}
      >
        ACTIVE POSITIONS ({positions.length})
      </div>
      {positions.map((p) => (
        <PositionCard key={p.id} position={p} />
      ))}
    </div>
  );
}
