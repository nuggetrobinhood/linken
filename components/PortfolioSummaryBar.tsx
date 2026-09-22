import type { PortfolioSummary } from "@/lib/types";
import { usd, pct } from "@/lib/format";

export function PortfolioSummaryBar({ summary }: { summary: PortfolioSummary }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
        gap: 10,
        marginBottom: 20,
      }}
    >
      <Card label="Total active LP" value={usd(summary.totalActiveLpUsd)} />
      <Card
        label="Net carry · 7d"
        value={usd(summary.netCarry7dUsd, { sign: true })}
        sub={`${pct(summary.netCarry7dApyPct, { sign: true })} APY`}
        tone={summary.netCarry7dUsd >= 0 ? "pos" : "neg"}
      />
      <Card label="Range utilization" value={`${summary.rangeUtilizationPct}%`} />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg";
}) {
  const color = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--fg)";
  return (
    <div style={{ background: "var(--ink2)", borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--m)", fontSize: 20, fontWeight: 500, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
