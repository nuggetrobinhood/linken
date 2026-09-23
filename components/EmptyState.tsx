"use client";

import { DEMO_POSITION } from "@/lib/demo";
import { usd, pct, exitBand } from "@/lib/format";
import { RangeBand } from "./RangeBand";
import { StressTest } from "./StressTest";

// Shown when a connected wallet has no active LP positions. Not a dead end: a
// clear notice, a playable DEMO position so the value is visible before the user
// has one of their own, a CTA to open a position, and a peek-another-wallet link.
export function EmptyState() {
  const d = DEMO_POSITION;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          background: "var(--ink2)",
          border: "0.5px solid var(--line)",
          borderRadius: 8,
          padding: "14px 16px",
          marginBottom: 18,
        }}
      >
        <span style={{ color: "var(--fg3)", fontSize: 16, marginTop: 1 }} aria-hidden>
          ○
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
            No active LP positions
          </div>
          <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.6 }}>
            This wallet has no concentrated liquidity on Robinhood Chain yet. Below
            is a live example of what LINKEN watches — drag the stress-test slider
            to see how it works.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--m)",
            fontSize: 11,
            color: "var(--fg2)",
            letterSpacing: 1,
          }}
        >
          EXAMPLE POSITION
        </span>
        <span
          style={{
            fontFamily: "var(--m)",
            fontSize: 10,
            color: "var(--warn)",
            background: "rgba(237,186,70,0.12)",
            padding: "2px 7px",
            borderRadius: 5,
            letterSpacing: 0.5,
          }}
        >
          DEMO — NOT YOUR DATA
        </span>
      </div>

      <div
        style={{
          border: "0.5px solid var(--line2)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "12px 14px",
            background: "var(--ink2)",
            borderBottom: "0.5px solid var(--line)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontFamily: "var(--m)", fontSize: 14, fontWeight: 600 }}>
            {d.token0} <span style={{ color: "var(--fg3)" }}>/</span> {d.token1}
            <span style={{ color: "var(--fg3)", fontWeight: 400, marginLeft: 8 }}>· {d.dex}</span>
          </div>
          <span
            style={{
              fontFamily: "var(--m)",
              fontSize: 11,
              color: "var(--pos)",
              border: "0.5px solid rgba(116,233,172,0.45)",
              background: "rgba(116,233,172,0.10)",
              padding: "3px 9px",
              borderRadius: 6,
              letterSpacing: 1,
            }}
          >
            IN RANGE
          </span>
        </div>

        <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <span style={{ color: "var(--fg2)", fontSize: 13 }}>Net carry · 7d</span>
            <span style={{ fontFamily: "var(--m)", fontSize: 18, fontWeight: 600, color: "var(--pos)" }}>
              {usd(d.netCarry.net, { sign: true })}
              <span style={{ fontSize: 12, color: "var(--fg3)", marginLeft: 8 }}>
                {pct(d.netCarry.apyPct, { sign: true })} APY
              </span>
            </span>
          </div>
          <RangeBand lower={d.range.lower} upper={d.range.upper} current={d.range.current} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 12.5,
              marginTop: 12,
            }}
          >
            <span style={{ color: "var(--fg2)" }}>
              {pct(d.range.distToUpperPct, { sign: true })} to upper ·{" "}
              {pct(d.range.distToLowerPct, { sign: true })} to lower
            </span>
            <span style={{ color: "var(--fg2)" }}>
              exits in <span style={{ color: "var(--fg)" }}>{exitBand(d.range.timeToExitDays)}</span>
            </span>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <div
            style={{
              fontFamily: "var(--m)",
              fontSize: 10,
              color: "var(--fg3)",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            MARKET-HOURS STRESS TEST
          </div>
          <StressTest position={d} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "rgba(62,208,184,0.08)",
          border: "0.5px solid var(--line2)",
          borderRadius: 8,
          padding: "14px 16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>No position yet?</div>
          <div style={{ fontSize: 12, color: "var(--fg2)" }}>
            Open an LP on a Robinhood Chain DEX, then come back to watch it.
          </div>
        </div>
        <a
          href="https://app.uniswap.org"
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "var(--m)",
            fontSize: 12,
            color: "#06110e",
            background: "var(--brand)",
            padding: "9px 15px",
            borderRadius: 7,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Open a position ↗
        </a>
      </div>

      <div style={{ margin: "18px auto 0", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 8 }}>
          or peek at another wallet&apos;s positions
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && peek()}
            placeholder="0x…"
            spellCheck={false}
            style={{
              flex: 1,
              background: "var(--ink)",
              border: "0.5px solid var(--line2)",
              borderRadius: 8,
              color: "var(--fg)",
              fontFamily: "var(--m)",
              fontSize: 12,
              padding: "10px 12px",
            }}
          />
          <button
            onClick={peek}
            style={{
              background: "transparent",
              border: "0.5px solid var(--line2)",
              color: "var(--fg)",
              fontFamily: "var(--m)",
              fontSize: 12,
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Peek
          </button>
        </div>
      </div>
    </div>
  );
}
