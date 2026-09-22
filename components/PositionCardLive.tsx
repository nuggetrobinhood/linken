import type { EnrichedPosition } from "@/lib/enrich";
import { pct } from "@/lib/format";
import { RangeBand } from "./RangeBand";

const STABLES = ["USDG", "USDC", "USDT", "DAI", "USDbC"];
const EXPLORER = "https://robinhoodchain.blockscout.com";

function quote(n: number | null, sym: string): string {
  if (n === null) return "—";
  const v = Math.round(n * 100) / 100;
  const body = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = v < 0 ? "-" : "";
  return STABLES.includes(sym) ? `${sign}$${body}` : `${sign}${body} ${sym}`;
}
function signed(n: number | null, sym: string): string {
  if (n === null) return "—";
  return (n > 0 ? "+" : "") + quote(n, sym);
}

export function PositionCardLive({ p }: { p: EnrichedPosition }) {
  const inRange = p.status === "in-range";
  const q = p.token1Symbol;
  const net = p.netCarryQuote;
  const nearExit =
    inRange &&
    p.distToUpperPct !== null &&
    p.distToLowerPct !== null &&
    (Math.abs(p.distToUpperPct) <= 2 || Math.abs(p.distToLowerPct) <= 2);

  return (
    <div style={{ border: "0.5px solid var(--line2)", borderRadius: 10, overflow: "hidden", marginBottom: 14, background: "var(--ink2)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", background: "var(--panel)", borderBottom: "0.5px solid var(--line)", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "var(--m)", fontSize: 14, fontWeight: 600 }}>
          {p.token0Symbol} <span style={{ color: "var(--fg3)" }}>/</span> {p.token1Symbol}
          <span style={{ color: "var(--fg3)", fontWeight: 400, marginLeft: 8 }}>· v3 · {(p.fee / 10000).toFixed(2)}%</span>
        </div>
        <span style={{ fontFamily: "var(--m)", fontSize: 11, letterSpacing: 1, padding: "3px 9px", borderRadius: 6,
          color: inRange ? "var(--pos)" : "var(--warn)",
          border: `0.5px solid ${inRange ? "rgba(116,233,172,0.45)" : "rgba(237,186,70,0.45)"}`,
          background: inRange ? "rgba(116,233,172,0.10)" : "rgba(237,186,70,0.10)" }}>
          {inRange ? "IN RANGE" : "OUT OF RANGE"}
        </span>
      </div>

      <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "var(--fg2)" }}>Net carry</span>
          <span style={{ fontFamily: "var(--m)", fontSize: 22, fontWeight: 600, color: net === null ? "var(--fg3)" : net >= 0 ? "var(--pos)" : "var(--neg)" }}>
            {signed(net, q)}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px", fontSize: 12.5 }}>
          <Row k="Fees + rewards" v={signed(p.feesQuote, q)} tone="pos" />
          <Row k="Gas" v={p.gasUsd === null ? "—" : signed(-p.gasUsd, q)} tone="neg" />
          <Row k="Impermanent loss" v={signed(p.ilQuote, q)} tone="neg" />
          <Row k="Position value" v={quote(p.valueQuote, q)} />
        </div>
        {!p.historyOk && (
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--warn)" }}>
            History unavailable for this position — IL and net carry can&apos;t be computed yet.
          </div>
        )}
      </div>

      {p.priceCurrent !== null && (
        <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
          <div style={{ marginBottom: 14 }}>
            <RangeBand lower={p.priceLower} upper={p.priceUpper} current={p.priceCurrent} />
          </div>
          {inRange ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
              <span style={{ color: nearExit ? "var(--warn)" : "var(--fg2)" }}>
                {nearExit ? "⚠ " : ""}{pct(p.distToUpperPct ?? 0, { sign: true })} to upper
              </span>
              <span style={{ color: "var(--fg2)" }}>{pct(p.distToLowerPct ?? 0, { sign: true })} to lower</span>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--warn)" }}>
              {p.priceCurrent >= p.priceUpper
                ? `⚠ Above range — position is 100% ${p.token1Symbol}, earning no fees`
                : `⚠ Below range — position is 100% ${p.token0Symbol}, earning no fees`}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: 14, borderBottom: "0.5px dashed var(--line)" }}>
        <div style={{ fontFamily: "var(--m)", fontSize: 10, color: "var(--fg3)", letterSpacing: 1 }}>
          POOL HEALTH <span style={{ color: "var(--warn)", marginLeft: 8 }}>soon</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, padding: "11px 14px", fontSize: 11.5, flexWrap: "wrap", fontFamily: "var(--m)" }}>
        {p.pool && <a href={`${EXPLORER}/address/${p.pool}`} target="_blank" rel="noreferrer" style={{ color: "var(--fg2)" }}>Pool ↗</a>}
        <a href={`${EXPLORER}/token/0x73991a25c818bf1f1128deaab1492d45638de0d3/instance/${p.tokenId}`} target="_blank" rel="noreferrer" style={{ color: "var(--fg2)" }}>Position #{p.tokenId} ↗</a>
        <a href="https://app.uniswap.org" target="_blank" rel="noreferrer" style={{ color: "var(--fg2)", marginLeft: "auto" }}>Manage ↗</a>
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--fg)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--fg2)" }}>{k}</span>
      <span style={{ fontFamily: "var(--m)", color }}>{v}</span>
    </div>
  );
}
