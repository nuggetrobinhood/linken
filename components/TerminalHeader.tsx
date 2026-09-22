"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DataMeta } from "@/lib/types";
import { usEquitiesState, type MarketState } from "@/lib/market";
import { WalletButton } from "./WalletButton";
import { LogoMark } from "./Logo";

const DOT: Record<DataMeta["freshness"], string> = {
  fresh: "var(--pos)",
  stale: "var(--warn)",
  cold: "var(--neg)",
};

export function TerminalHeader({ meta }: { meta: DataMeta }) {
  const [mkt, setMkt] = useState<MarketState | null>(null);
  useEffect(() => {
    const upd = () => setMkt(usEquitiesState());
    upd();
    const id = setInterval(upd, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderBottom: "0.5px solid var(--line2)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--m)", fontSize: 13, fontWeight: 600, letterSpacing: 2 }}>
          <LogoMark size={20} /> LINKEN <span style={{ color: "var(--fg3)", letterSpacing: 0 }}>// terminal</span>
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          <Link href="/terminal" style={{ fontSize: 12, color: "var(--fg)", background: "var(--ink2)", padding: "6px 11px", borderRadius: 7 }}>Terminal</Link>
          <Link href="/methodology" style={{ fontSize: 12, color: "var(--fg2)", padding: "6px 11px", borderRadius: 7 }}>Methodology</Link>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {mkt && (
          <span title="US equities regular session, 9:30–16:00 ET" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--m)", fontSize: 11, color: mkt.isOpen ? "var(--pos)" : "var(--warn)", border: `0.5px solid ${mkt.isOpen ? "rgba(116,233,172,0.3)" : "rgba(237,186,70,0.3)"}`, background: mkt.isOpen ? "rgba(116,233,172,0.06)" : "rgba(237,186,70,0.06)", padding: "5px 10px", borderRadius: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: mkt.isOpen ? "var(--pos)" : "var(--warn)", display: "inline-block" }} />
            {mkt.label}
          </span>
        )}
        <span title={`Data ${meta.freshness}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--m)", fontSize: 11, color: "var(--fg2)", border: "0.5px solid var(--line)", padding: "5px 9px", borderRadius: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: DOT[meta.freshness], display: "inline-block" }} />
          Robinhood Chain
        </span>
        <WalletButton compact />
      </div>
    </div>
  );
}
