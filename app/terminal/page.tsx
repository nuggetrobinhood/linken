"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { TerminalHeader } from "@/components/TerminalHeader";
import { EmptyState } from "@/components/EmptyState";
import { PositionCardLive } from "@/components/PositionCardLive";
import { WalletButton } from "@/components/WalletButton";
import { SiteFooter } from "@/components/SiteFooter";
import { getPositions, summarize, liveMeta } from "@/lib/positions";
import { shortAddress } from "@/lib/format";
import type { EnrichedPosition } from "@/lib/enrich";

const usd = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isAddr = (a: string | null): a is string => !!a && /^0x[a-fA-F0-9]{40}$/.test(a);

function TerminalInner() {
  const { address, isConnected } = useAccount();
  const params = useSearchParams();
  const peek = params.get("wallet");
  const isPeek = isAddr(peek);
  const target = isPeek ? peek : isConnected && address ? address : null;

  const [positions, setPositions] = useState<EnrichedPosition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = liveMeta();

  useEffect(() => {
    if (!target) {
      setPositions(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPositions(target)
      .then((p) => !cancelled && setPositions(p))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <TerminalHeader meta={meta} />
        <div style={{ padding: 16 }}>
          {isPeek && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--m)", fontSize: 12, color: "var(--fg2)", background: "var(--ink2)", border: "0.5px solid var(--line)", borderRadius: 8, padding: "10px 13px", marginBottom: 16 }}>
              <span style={{ color: "var(--brand)" }}>◉</span> Viewing {shortAddress(peek)} — read-only peek
            </div>
          )}
          {!target ? (
            <Connect />
          ) : loading || (positions === null && !error) ? (
            <Info>Reading positions…</Info>
          ) : error ? (
            <Info tone="neg">{error}</Info>
          ) : positions && positions.length === 0 ? (
            <EmptyState />
          ) : positions ? (
            <Positions positions={positions} />
          ) : null}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={null}>
      <TerminalInner />
    </Suspense>
  );
}

function Positions({ positions }: { positions: EnrichedPosition[] }) {
  const s = summarize(positions);
  const outOfRange = positions.filter((p) => p.status === "out-of-range").length;
  const attention = s.nearExit + outOfRange;
  const banner =
    outOfRange > 0
      ? `${outOfRange} position${outOfRange > 1 ? "s" : ""} out of range — not earning fees.`
      : s.nearExit > 0
      ? `${s.nearExit} position${s.nearExit > 1 ? "s" : ""} near exit (within 2% of a bound).`
      : null;

  return (
    <div>
      {banner && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(237,186,70,0.08)", border: "0.5px solid rgba(237,186,70,0.35)", borderRadius: 9, padding: "12px 14px", marginBottom: 16, fontSize: 12.5 }}>
          <span style={{ color: "var(--warn)" }}>⚠</span>
          <span>{banner}</span>
        </div>
      )}

      <div style={{ fontFamily: "var(--m)", fontSize: 11, color: "var(--fg2)", letterSpacing: 1, marginBottom: 10 }}>PORTFOLIO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
        <Stat label="Total value" value={usd(s.totalValueQuote)} />
        <Stat label="Net carry" value={s.netCarryQuote === null ? "—" : usd(s.netCarryQuote)} tone={s.netCarryQuote === null ? undefined : s.netCarryQuote >= 0 ? "pos" : "neg"} />
        <Stat label="In range" value={`${s.rangeUtilizationPct}%`} />
        <Stat label="Needs attention" value={String(attention)} tone={attention > 0 ? "warn" : undefined} />
      </div>

      <div style={{ fontFamily: "var(--m)", fontSize: 11, color: "var(--fg2)", letterSpacing: 1, marginBottom: 10 }}>
        ACTIVE POSITIONS ({positions.length})
      </div>
      {positions.map((p) => (
        <PositionCardLive key={p.tokenId} p={p} />
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "warn" }) {
  const color = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : tone === "warn" ? "var(--warn)" : "var(--fg)";
  return (
    <div style={{ background: "var(--ink2)", borderRadius: 8, padding: 13 }}>
      <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--m)", fontSize: 20, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

function Connect() {
  return (
    <div style={{ textAlign: "center", padding: "72px 20px", border: "0.5px solid var(--line)", borderRadius: 12, background: "var(--ink2)" }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Connect a wallet to begin</div>
      <div style={{ fontSize: 13, color: "var(--fg2)", maxWidth: "42ch", margin: "0 auto 22px", lineHeight: 1.6 }}>
        LINKEN reads your concentrated-liquidity positions on Robinhood Chain and shows the net carry on each. Read-only — it never moves your funds.
      </div>
      <WalletButton />
    </div>
  );
}

function Info({ children, tone }: { children: React.ReactNode; tone?: "neg" }) {
  return (
    <div style={{ textAlign: "center", padding: "72px 20px", fontFamily: "var(--m)", fontSize: 13, color: tone === "neg" ? "var(--neg)" : "var(--fg3)" }}>
      {children}
    </div>
  );
}
