import type { Position } from "@/lib/types";
import { usd, pct, exitBand } from "@/lib/format";
import { RangeBand } from "./RangeBand";
import { StressTest } from "./StressTest";

// A single position, four layers: header, net-carry breakdown, range health
// (with the band), pool health (position-bound), and the stress test.
export function PositionCard({ position }: { position: Position }) {
  const { netCarry: nc, range, pool } = position;
  const inRange = range.status === "in-range";

  return (
    <div
      style={{
        border: "0.5px solid var(--line2)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 18,
      }}
    >
      {/* header */}
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
          {position.token0} <span style={{ color: "var(--fg3)" }}>/</span> {position.token1}
          <span style={{ color: "var(--fg3)", fontWeight: 400, marginLeft: 8 }}>
            · {position.dex}
          </span>
          {position.isRwaPair && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "var(--m)",
                fontSize: 10,
                color: "var(--warn)",
                border: "0.5px solid rgba(237,186,70,0.4)",
                padding: "2px 6px",
                borderRadius: 5,
                letterSpacing: 0.5,
              }}
            >
              RWA
            </span>
          )}
        </div>
        <Badge kind={inRange ? "pos" : "warn"}>
          {inRange ? "IN RANGE" : "OUT OF RANGE"}
        </Badge>
      </div>

      {/* net carry breakdown */}
      <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
        <Between>
          <span style={{ color: "var(--fg2)", fontSize: 13 }}>Net carry · 7d</span>
          <span
            style={{
              fontFamily: "var(--m)",
              fontSize: 18,
              fontWeight: 600,
              color: nc.net >= 0 ? "var(--pos)" : "var(--neg)",
            }}
          >
            {usd(nc.net, { sign: true })}
            <span style={{ fontSize: 12, color: "var(--fg3)", marginLeft: 8 }}>
              {pct(nc.apyPct, { sign: true })} APY
            </span>
          </span>
        </Between>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 18px",
            marginTop: 12,
            fontSize: 12.5,
          }}
        >
          <Line label="Fees + rewards" value={usd(nc.feesEarned, { sign: true })} tone="pos" />
          <Line label="Gas (real)" value={usd(nc.gasCost)} tone="neg" />
          <Line label="Impermanent loss" value={usd(nc.impermanentLoss)} tone="neg" />
          <Line label="Position value" value={usd(position.valueUsd)} />
        </div>
      </div>

      {/* range health */}
      <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
        <div style={{ marginBottom: 14 }}>
          <RangeBand lower={range.lower} upper={range.upper} current={range.current} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
          <span style={{ color: "var(--fg2)" }}>
            {pct(range.distToUpperPct, { sign: true })} to upper ·{" "}
            {pct(range.distToLowerPct, { sign: true })} to lower
          </span>
          <span style={{ color: "var(--fg2)" }}>
            exits in <span style={{ color: "var(--fg)" }}>{exitBand(range.timeToExitDays)}</span>
          </span>
        </div>
      </div>

      {/* pool health — position-bound context, never a leaderboard */}
      <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
        <div
          style={{
            fontFamily: "var(--m)",
            fontSize: 10,
            color: "var(--fg3)",
            letterSpacing: 1,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          POOL HEALTH
          {pool.thinDepth && (
            <span style={{ color: "var(--warn)", letterSpacing: 0 }}>· thin depth</span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Metric label="TVL" value={usd(pool.tvlUsd)} />
          <Metric label="Volume 24h" value={usd(pool.volume24hUsd)} />
          <Metric label="Fees 24h" value={usd(pool.fees24hUsd)} />
        </div>
      </div>

      {/* stress test */}
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
        <StressTest position={position} />
      </div>
    </div>
  );
}

function Badge({ kind, children }: { kind: "pos" | "warn"; children: React.ReactNode }) {
  const c =
    kind === "pos"
      ? { fg: "var(--pos)", br: "rgba(116,233,172,0.45)", bg: "rgba(116,233,172,0.10)" }
      : { fg: "var(--warn)", br: "rgba(237,186,70,0.45)", bg: "rgba(237,186,70,0.10)" };
  return (
    <span
      style={{
        fontFamily: "var(--m)",
        fontSize: 11,
        color: c.fg,
        border: `0.5px solid ${c.br}`,
        background: c.bg,
        padding: "3px 9px",
        borderRadius: 6,
        letterSpacing: 1,
      }}
    >
      {children}
    </span>
  );
}

function Between({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      {children}
    </div>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--fg)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--fg2)" }}>{label}</span>
      <span style={{ fontFamily: "var(--m)", color }}>{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--fg3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "var(--m)", fontSize: 13, color: "var(--fg)" }}>{value}</div>
    </div>
  );
}
