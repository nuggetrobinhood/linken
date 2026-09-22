"use client";

import { useEffect, useState } from "react";
import { RangeBand } from "./RangeBand";
import { DEMO_POSITION } from "@/lib/demo";
import { usd } from "@/lib/format";

// The hero's live instrument panel: a real position readout with the net carry
// counting up and the range band sliding into place on load. One orchestrated
// motion moment, not scattered effects.
export function HeroInstrument() {
  const target = DEMO_POSITION.netCarry.net;
  const [carry, setCarry] = useState(0);

  useEffect(() => {
    let cur = 0;
    const step = target / 40;
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) {
        cur = target;
        clearInterval(id);
      }
      setCarry(cur);
    }, 28);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div
      style={{
        margin: "36px 0 0",
        background: "linear-gradient(180deg, var(--ink2), var(--panel))",
        border: "0.5px solid var(--line2)",
        borderRadius: 12,
        padding: "20px 22px 26px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 26,
        }}
      >
        <div style={{ fontFamily: "var(--m)", fontSize: 14, fontWeight: 600 }}>
          {DEMO_POSITION.token0} <span style={{ color: "var(--fg3)" }}>/</span>{" "}
          {DEMO_POSITION.token1}
        </div>
        <div
          style={{
            fontFamily: "var(--m)",
            fontSize: 11,
            color: "var(--pos)",
            border: "0.5px solid rgba(116,233,172,0.45)",
            background: "rgba(116,233,172,0.10)",
            padding: "4px 10px",
            borderRadius: 6,
            letterSpacing: 1,
          }}
        >
          IN RANGE
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontFamily: "var(--m)",
              fontSize: 10,
              color: "var(--fg3)",
              letterSpacing: 1.5,
              display: "block",
              marginBottom: 3,
            }}
          >
            NET CARRY · 7D
          </span>
          <span
            style={{
              fontFamily: "var(--m)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--pos)",
            }}
          >
            {usd(carry, { sign: true })}
          </span>
        </div>
      </div>
      <RangeBand
        lower={DEMO_POSITION.range.lower}
        upper={DEMO_POSITION.range.upper}
        current={DEMO_POSITION.range.current}
        animate
      />
    </div>
  );
}
