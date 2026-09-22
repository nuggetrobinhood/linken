"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";

// Slice 1 test harness. Point it at ANY wallet (?wallet=0x… or the input) and it
// dumps the raw Uniswap v3 positions read straight from NonfungiblePositionManager
// on Robinhood Chain. Use it to verify enumeration + positions() against the block
// explorer before building derived math (range, net carry) on top.
//
// Not linked from the product UI — it's a dev/verification surface.

interface RawPosition {
  tokenId: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
}

function InspectInner() {
  const params = useSearchParams();
  const [address, setAddress] = useState(params.get("wallet") ?? "");
  const [state, setState] = useState
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; positions: RawPosition[] }
  >({ status: "idle" });

  const run = useCallback(async (addr: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr.trim())) {
      setState({ status: "error", message: "Enter a valid 0x… address (40 hex chars)." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/positions?address=${addr.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Request failed." });
        return;
      }
      setState({ status: "ok", positions: data.positions });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Network error." });
    }
  }, []);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 22px", fontFamily: "var(--m)" }}>
      <div style={{ fontSize: 12, color: "var(--fg3)", letterSpacing: 1, marginBottom: 6 }}>
        SLICE 1 · RAW POSITION READ
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px", fontFamily: "var(--f)" }}>
        Inspect wallet positions
      </h1>
      <p style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.6, margin: "0 0 20px", fontFamily: "var(--f)" }}>
        Reads Uniswap v3 positions straight from NonfungiblePositionManager on
        Robinhood Chain. Cross-check against the explorer before trusting anything
        derived.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(address);
        }}
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x… wallet address"
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 240,
            background: "var(--ink2)",
            border: "0.5px solid var(--line2)",
            borderRadius: 8,
            color: "var(--fg)",
            fontFamily: "var(--m)",
            fontSize: 13,
            padding: "10px 12px",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--brand)",
            color: "#06110e",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            padding: "10px 18px",
          }}
        >
          Inspect
        </button>
      </form>

      {state.status === "loading" && (
        <div style={{ color: "var(--fg3)", fontSize: 13 }}>Reading chain…</div>
      )}
      {state.status === "error" && (
        <div style={{ color: "var(--neg)", fontSize: 13 }}>{state.message}</div>
      )}
      {state.status === "ok" && <Results positions={state.positions} />}
    </div>
  );
}

function Results({ positions }: { positions: RawPosition[] }) {
  if (positions.length === 0) {
    return (
      <div style={{ color: "var(--fg2)", fontSize: 13, fontFamily: "var(--f)" }}>
        No Uniswap v3 positions found for this wallet.
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 12 }}>
        {positions.length} position{positions.length > 1 ? "s" : ""}
      </div>
      {positions.map((p) => (
        <div
          key={p.tokenId}
          style={{
            border: "0.5px solid var(--line2)",
            borderRadius: 10,
            padding: 14,
            marginBottom: 12,
            fontSize: 12.5,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            #{p.tokenId} · {p.token0Symbol} / {p.token1Symbol}{" "}
            <span style={{ color: "var(--fg3)", fontWeight: 400 }}>· fee {p.fee}</span>
          </div>
          <Row k="token0" v={`${p.token0Symbol} (${p.token0Decimals}) ${p.token0}`} />
          <Row k="token1" v={`${p.token1Symbol} (${p.token1Decimals}) ${p.token1}`} />
          <Row k="tickLower" v={String(p.tickLower)} />
          <Row k="tickUpper" v={String(p.tickUpper)} />
          <Row k="liquidity" v={p.liquidity} />
          <Row k="tokensOwed0" v={p.tokensOwed0} />
          <Row k="tokensOwed1" v={p.tokensOwed1} />
        </div>
      ))}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "3px 0", wordBreak: "break-all" }}>
      <span style={{ color: "var(--fg3)", minWidth: 96 }}>{k}</span>
      <span style={{ color: "var(--fg)" }}>{v}</span>
    </div>
  );
}

export default function InspectPage() {
  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <SiteNav />
        <Suspense fallback={null}>
          <InspectInner />
        </Suspense>
      </div>
    </main>
  );
}
