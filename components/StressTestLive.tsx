"use client";

import { useMemo, useState } from "react";
import type { EnrichedPosition } from "@/lib/enrich";

const STABLES = ["USDG", "USDC", "USDT", "DAI", "USDbC"];
function quote(n: number, sym: string): string {
  const v = Math.round(n * 100) / 100;
  const body = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = v < 0 ? "-" : "";
  return STABLES.includes(sym) ? `${sign}$${body}` : `${sign}${body} ${sym}`;
}

// Raw token amounts at a given tick — same model as the backend (lib/enrich).
function amountsAtTick(L: number, tickCur: number, tickLo: number, tickHi: number) {
  const sp = Math.pow(1.0001, tickCur / 2);
  const sa = Math.pow(1.0001, tickLo / 2);
  const sb = Math.pow(1.0001, tickHi / 2);
  let a0 = 0;
  let a1 = 0;
  if (tickCur < tickLo) a0 = L * (1 / sa - 1 / sb);
  else if (tickCur >= tickHi) a1 = L * (sb - sa);
  else {
    a0 = L * (1 / sp - 1 / sb);
    a1 = L * (sp - sa);
  }
  return { a0, a1 };
}

// Live "what-if": shock the price, recompute value + IL exactly like the backend.
export function StressTestLive({ p }: { p: EnrichedPosition }) {
  const [shock, setShock] = useState(0);

  const sim = useMemo(() => {
    if (p.priceCurrent === null) return null;
    const d0 = p.token0Decimals;
    const d1 = p.token1Decimals;
    const price = p.priceCurrent * (1 + shock / 100);
    const tick = Math.log(price / Math.pow(10, d0 - d1)) / Math.log(1.0001);
    const { a0, a1 } = amountsAtTick(Number(p.liquidity), tick, p.tickLower, p.tickUpper);
    const value = (a0 / 10 ** d0) * price + a1 / 10 ** d1;
    const outOfRange = tick < p.tickLower || tick >= p.tickUpper;
    const collapsed = outOfRange ? (tick >= p.tickUpper ? p.token1Symbol : p.token0Symbol) : null;
    const il = p.historyOk ? value - (p.dep0Human * price + p.dep1Human) : null;
    return { value, il, outOfRange, collapsed };
  }, [p, shock]);

  if (!sim) return null;
  const q = p.token1Symbol;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "var(--fg2)", whiteSpace: "nowrap" }}>Price shock</label>
        <input type="range" min={-30} max={30} step={1} value={shock} onChange={(e) => setShock(parseInt(e.target.value, 10))} style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--m)", fontSize: 13, fontWeight: 500, minWidth: 44, textAlign: "right", color: shock < 0 ? "var(--neg)" : shock > 0 ? "var(--pos)" : "var(--fg2)" }}>
          {shock > 0 ? "+" : ""}{shock}%
        </span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 2 }}>
        <Row k="Range status">
          {sim.outOfRange ? (
            <span style={{ color: "var(--warn)" }}>⚠ Out of range <span style={{ color: "var(--fg3)" }}>(100% {sim.collapsed})</span></span>
          ) : (
            <span style={{ color: "var(--pos)" }}>In range</span>
          )}
        </Row>
        {sim.il !== null && (
          <Row k="Est. impermanent loss"><span style={{ color: "var(--neg)" }}>{quote(sim.il, q)}</span></Row>
        )}
        <Row k="Est. position value"><span>{quote(sim.value, q)}</span></Row>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--fg2)" }}>{k}</span>
      <span style={{ fontFamily: "var(--m)" }}>{children}</span>
    </div>
  );
}
