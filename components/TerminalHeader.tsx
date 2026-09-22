import Link from "next/link";
import type { DataMeta } from "@/lib/types";
import { WalletButton } from "./WalletButton";

const DOT: Record<DataMeta["freshness"], string> = {
  fresh: "var(--pos)",
  stale: "var(--warn)",
  cold: "var(--neg)",
};

export function TerminalHeader({ meta }: { meta: DataMeta }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "0.5px solid var(--line2)",
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--m)",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 2,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            background: "var(--brand)",
            borderRadius: 2,
            transform: "rotate(45deg)",
            display: "inline-block",
          }}
        />
        LINKEN <span style={{ color: "var(--fg3)", letterSpacing: 0 }}>// terminal</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          title={`Data ${meta.freshness} · ${meta.delaySeconds}s behind head`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--m)",
            fontSize: 11,
            color: "var(--fg2)",
            border: "0.5px solid var(--line)",
            padding: "5px 9px",
            borderRadius: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: DOT[meta.freshness],
              display: "inline-block",
            }}
          />
          Robinhood Chain
        </span>
        <WalletButton compact />
      </div>
    </div>
  );
}
