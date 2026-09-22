import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

const IN = { maxWidth: 680, margin: "0 auto", padding: "44px 22px" } as const;

// Trust layer. A stub for now — the formulas and sources are stated so users can
// check every number. Fill in exact constants once Layer 1 is wired.
export default function MethodologyPage() {
  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SiteNav />
        <div style={IN}>
          <h1 style={{ fontSize: 28, fontWeight: 640, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
            Methodology
          </h1>
          <p style={{ color: "var(--fg2)", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
            Every figure LINKEN shows, and how it&apos;s computed. If you can&apos;t
            check a number, you shouldn&apos;t trust it.
          </p>

          <Block title="Net carry">
            <code style={code}>net carry = fees + rewards − impermanent loss − gas</code>
            <p style={p}>
              Gas is the <b>real third-party cost</b> paid from an EVM wallet — not
              the subsidized figure Robinhood Wallet users saw during the launch
              promotion. That keeps net carry honest for how LINKEN&apos;s users
              actually transact.
            </p>
          </Block>

          <Block title="Range health & time to exit">
            <p style={p}>
              Distance to each tick bound is the percentage move from the current
              pool price to the range edge. Time to exit is shown as an{" "}
              <b>honest band</b> (e.g. &ldquo;~4–6 days&rdquo;) derived from recent
              volatility — never a false-precision decimal, because the underlying
              estimate is noisy.
            </p>
          </Block>

          <Block title="Pool health">
            <p style={p}>
              TVL, 24h volume, and 24h fees are shown for the pool a position sits
              in — as context for that position&apos;s risk, never as a ranked list
              of pools to chase. A thin-depth flag appears when a pool&apos;s
              liquidity is low enough that IL and slippage bite harder.
            </p>
          </Block>

          <Block title="Data sources & delay">
            <p style={p}>
              Positions are read on demand from Robinhood Chain when you connect.
              The header dot shows data freshness. Refresh delay and exact sources
              are listed here once live data is wired.
            </p>
          </Block>

          <p style={{ marginTop: 40 }}>
            <Link href="/" style={{ color: "var(--brand)", fontFamily: "var(--m)", fontSize: 13 }}>
              ← back
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const p: React.CSSProperties = { color: "var(--fg2)", fontSize: 13.5, lineHeight: 1.65, margin: "10px 0 0" };
const code: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--m)",
  fontSize: 13,
  color: "var(--fg)",
  background: "var(--ink2)",
  border: "0.5px solid var(--line)",
  borderRadius: 8,
  padding: "12px 14px",
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "0.5px solid var(--line)" }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 10px" }}>{title}</h2>
      {children}
    </div>
  );
}
