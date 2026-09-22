"use client";

import { useEffect, useRef, useState } from "react";
import { usd } from "@/lib/format";

interface RangeBandProps {
  lower: number;
  upper: number;
  current: number;
  animate?: boolean; // slide the marker in on mount (hero flourish)
}

// The concentrated-liquidity range band: lower bound, active zone, current price
// marker. LINKEN's signature visual.
export function RangeBand({ lower, upper, current, animate = false }: RangeBandProps) {
  // Position the current-price marker within a padded view so the zone reads
  // clearly even when price sits near a bound.
  const span = upper - lower;
  const pad = span * 0.55;
  const viewLo = lower - pad;
  const viewHi = upper + pad;
  const toPct = (v: number) => ((v - viewLo) / (viewHi - viewLo)) * 100;

  const zoneLeft = toPct(lower);
  const zoneRight = 100 - toPct(upper);
  const markTarget = toPct(current);

  const [markLeft, setMarkLeft] = useState(animate ? zoneLeft : markTarget);
  const started = useRef(false);

  useEffect(() => {
    if (!animate || started.current) return;
    started.current = true;
    const id = requestAnimationFrame(() =>
      setTimeout(() => setMarkLeft(markTarget), 120)
    );
    return () => cancelAnimationFrame(id);
  }, [animate, markTarget]);

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: 8,
          background: "#050b09",
          borderRadius: 4,
          margin: "0 4px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${zoneLeft}%`,
            right: `${zoneRight}%`,
            background:
              "linear-gradient(90deg, rgba(62,208,184,0.16), rgba(62,208,184,0.34), rgba(62,208,184,0.16))",
            borderLeft: "1.5px solid var(--brand)",
            borderRight: "1.5px solid var(--brand)",
            borderRadius: 2,
          }}
        />
        <div
          className="rb-mark"
          style={{
            position: "absolute",
            top: -9,
            bottom: -9,
            left: `${markLeft}%`,
            width: 2,
            background: "var(--fg)",
            transition: "left 1.1s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "14px 4px 0",
          fontFamily: "var(--m)",
          fontSize: 11,
          color: "var(--fg2)",
        }}
      >
        <span>{usd(lower)} lower</span>
        <span style={{ color: "var(--fg)" }}>{usd(current)} · now</span>
        <span>{usd(upper)} upper</span>
      </div>
      <style>{`
        .rb-mark::after{content:"";position:absolute;top:-4px;left:-4px;width:10px;height:10px;border-radius:50%;background:var(--fg);animation:rbp 2s infinite;}
        @keyframes rbp{0%{box-shadow:0 0 0 0 rgba(228,238,233,0.45);}70%{box-shadow:0 0 0 8px rgba(228,238,233,0);}100%{box-shadow:0 0 0 0 rgba(228,238,233,0);}}
      `}</style>
    </div>
  );
}
