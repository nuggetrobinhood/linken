import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

const IN = { maxWidth: 680, margin: "0 auto", padding: "44px 22px" } as const;

export default function MethodologyPage() {
  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SiteNav />
        <div style={IN}>
          <h1 style={{ fontSize: 28, fontWeight: 640, letterSpacing: "-0.01em", margin: "0 0 6px" }}>Methodology</h1>
          <p style={{ color: "var(--fg2)", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
            Every figure LINKEN shows and how it&apos;s computed. Everything is read live
            from Robinhood Chain (chain 4663) — nothing is stored or estimated off-chain.
            If you can&apos;t check a number, you shouldn&apos;t trust it.
          </p>

          <Block title="Net carry">
            <code style={code}>net carry = fees + rewards − impermanent loss − gas</code>
            <p style={p}>
              The single number that answers &ldquo;is this position actually making me
              money?&rdquo; Fees can look healthy while IL quietly puts you underwater —
              net carry nets them out. All components are expressed in the position&apos;s
              quote token (token1), so for a stable-quoted pair they read as dollars.
            </p>
          </Block>

          <Block title="Fees">
            <p style={p}>
              Uncollected fees are read by simulating a <code style={inline}>collect()</code>{" "}
              on the position (an <code style={inline}>eth_call</code>, never a real
              transaction) from the owner with max amounts. That call pokes the pool to
              bring fee accounting fully up to date, so the figure is current to the block.
            </p>
          </Block>

          <Block title="Impermanent loss">
            <p style={p}>
              IL = the position&apos;s value now minus what the deposited tokens would be
              worth if you&apos;d simply held them (both at the current price). The deposited
              amounts are reconstructed from the position&apos;s{" "}
              <code style={inline}>IncreaseLiquidity</code> and{" "}
              <code style={inline}>DecreaseLiquidity</code> events. Fees are excluded from
              IL — they&apos;re counted separately in net carry.
            </p>
          </Block>

          <Block title="Gas">
            <p style={p}>
              The real ETH spent across every transaction that changed the position&apos;s
              liquidity (mint, increase, decrease, collect), summed from each receipt&apos;s{" "}
              <code style={inline}>gasUsed × effectiveGasPrice</code>. This is what you
              actually paid from a third-party wallet — not a subsidized figure. It&apos;s
              valued in USD via an on-chain ETH/USD reference. (Arbitrum Orbit prices the L1
              data component into L2 gas, so this closely tracks total ETH paid.)
            </p>
          </Block>

          <Block title="Range health & market hours">
            <p style={p}>
              A position is in range when the pool&apos;s current tick sits between its
              bounds. Distances to each bound are percentage moves in price. For pairs with a
              tokenized real-world asset, LINKEN also flags US-equities market hours
              (9:30–16:00 ET, Mon–Fri) — the window where the underlying can gap and hit
              your position while the token keeps trading.
            </p>
          </Block>

          <Block title="Sources, scope & limits">
            <ul style={{ ...p, paddingLeft: 18 }}>
              <li>Data source: Robinhood Chain public RPC, read on demand when you open a wallet.</li>
              <li>Coverage: Uniswap v3 positions. v4 (the majority of tokenized-stock liquidity) is not parsed yet.</li>
              <li>Market-hours holidays are not yet accounted for.</li>
              <li>Pool health (TVL, 24h volume/fees) is coming.</li>
              <li>Not financial advice.</li>
            </ul>
          </Block>

          <p style={{ marginTop: 40 }}>
            <Link href="/terminal" style={{ color: "var(--brand)", fontFamily: "var(--m)", fontSize: 13 }}>← back to terminal</Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

const p: React.CSSProperties = { color: "var(--fg2)", fontSize: 13.5, lineHeight: 1.65, margin: "10px 0 0" };
const code: React.CSSProperties = { display: "block", fontFamily: "var(--m)", fontSize: 13, color: "var(--fg)", background: "var(--ink2)", border: "0.5px solid var(--line)", borderRadius: 8, padding: "12px 14px" };
const inline: React.CSSProperties = { fontFamily: "var(--m)", fontSize: 12.5, color: "var(--fg)", background: "var(--ink2)", padding: "1px 5px", borderRadius: 4 };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "0.5px solid var(--line)" }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 10px" }}>{title}</h2>
      {children}
    </div>
  );
}
