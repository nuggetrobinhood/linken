"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/lib/types";
import { simulateShock } from "@/lib/stress";
import { usd } from "@/lib/format";

// Market-hours "what-if" simulator. Pure UI over simulateShock() — swap the model
// in lib/stress.ts and this component keeps working unchanged.
export function StressTest({ position }: { position: Position }) {
  const [shock, setShock] = useState(-10);
  const result = useMemo(() => simulateShock(position, shock), [position, shock]);
  const outOfRange = result.status === "out-of-range";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <label
          htmlFor={`shock-${position.id}`}
          style={{ fontSize: 12, color: "var(--fg2)", whiteSpace: "nowrap" }}
        >
          Price shock
        </label>
        <input
          id={`shock-${position.id}`}
          type="range"
          min={-30}
          max={30}
          step={1}
          value={shock}
          onChange={(e) => setShock(parseInt(e.target.value, 10))}
          style={{ flex: 1 }}
        />
        <span
          style={{
            fontFamily: "var(--m)",
            fontSize: 13,
            fontWeight: 500,
            minWidth: 44,
            textAlign: "right",
            color: shock < 0 ? "var(--neg)" : shock > 0 ? "var(--pos)" : "var(--fg2)",
          }}
        >
          {shock > 0 ? "+" : ""}
          {shock}%
        </span>
      </div>

      <div style={{ fontSize: 13, lineHeight: 2 }}>
        <Row label="Range status">
          {outOfRange ? (
            <span style={{ color: "var(--warn)" }}>
              ⚠ Out of range{" "}
              <span style={{ color: "var(--fg3)" }}>
                (100% {result.collapsedInto})
              </span>
            </span>
          ) : (
            <span style={{ color: "var(--pos)" }}>In range</span>
          )}
        </Row>
        <Row label="Est. impermanent loss">
          <span style={{ color: "var(--neg)" }}>{usd(result.estIlUsd)}</span>
        </Row>
        <Row label="Remaining LP value">
          <span>{usd(result.remainingLpUsd)}</span>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--fg2)" }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}
