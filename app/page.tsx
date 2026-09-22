import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { HeroInstrument } from "@/components/HeroInstrument";

const IN = { maxWidth: 760, margin: "0 auto" } as const;

export default function LandingPage() {
  return (
    <main className="grid-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SiteNav />

        {/* HERO */}
        <section style={{ padding: "52px 22px 40px", ...IN }}>
          <h1
            style={{
              fontSize: "clamp(28px,5.4vw,42px)",
              fontWeight: 640,
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              maxWidth: "16ch",
              margin: "0 0 18px",
            }}
          >
            The only LP number that matters is what you keep.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--fg2)",
              lineHeight: 1.6,
              maxWidth: "52ch",
              margin: "0 0 26px",
            }}
          >
            Net carry — fees earned, minus impermanent loss, minus real
            third-party gas. Per position, for concentrated liquidity on Robinhood
            Chain.
          </p>
          <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
            <Link
              href="/terminal"
              style={{
                fontFamily: "var(--m)",
                fontSize: 13,
                color: "#06110e",
                background: "var(--brand)",
                padding: "12px 22px",
                borderRadius: 9,
                fontWeight: 600,
              }}
            >
              Launch terminal
            </Link>
            <Link
              href="/methodology"
              style={{
                fontFamily: "var(--m)",
                fontSize: 13,
                color: "var(--fg)",
                padding: "12px 22px",
                borderRadius: 9,
                border: "0.5px solid var(--line2)",
              }}
            >
              Read the methodology
            </Link>
          </div>
          <HeroInstrument />
        </section>

        {/* PROBLEM */}
        <section style={{ padding: "44px 22px", borderTop: "0.5px solid var(--line)", ...IN }}>
          <p style={kick}>The failure modes</p>
          <h2 style={sech}>Three ways a position quietly stops paying you</h2>
          <div style={{ borderTop: "0.5px solid var(--line)" }}>
            <ProblemRow
              title="It drifts out of range"
              body="Price leaves your tick band and the position earns nothing — capital parked, doing zero work, and nothing tells you."
            />
            <ProblemRow
              title="The open gaps against you"
              body="A tokenized stock reprices the moment its market opens. Impermanent loss lands while you sleep, not while you watch."
            />
            <ProblemRow
              title="Carry you can't actually see"
              body="Do your fees really cover the IL and the gas? Nobody does that math for you. You've been guessing."
            />
          </div>
        </section>

        {/* PILLARS */}
        <section
          style={{
            padding: "44px 22px",
            borderTop: "0.5px solid var(--line)",
            background: "rgba(16,36,32,0.4)",
            ...IN,
          }}
        >
          <p style={kick}>What LINKEN does</p>
          <h2 style={sech}>A truth layer for your liquidity</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 20,
            }}
          >
            <Pillar
              title="Net carry truth"
              body="Fees and rewards, minus impermanent loss, minus real gas. One honest figure per position."
            />
            <Pillar
              title="Range health"
              body="Distance to each tick bound, plus an honest band for when you'll get pushed out."
            />
            <Pillar
              title="Market-hours stress test"
              body="Simulate a tokenized-stock price shock before it actually happens to your capital."
            />
          </div>
        </section>

        {/* HOW */}
        <section style={{ padding: "44px 22px", borderTop: "0.5px solid var(--line)", ...IN }}>
          <p style={kick}>From connect to clarity</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontFamily: "var(--m)" }}>
            <Step n="01" text="Connect your wallet." />
            <Step n="02" text="LINKEN reads your CL positions automatically." />
            <Step n="03" text="Watch them, and stress-test them." />
          </div>
        </section>

        {/* WEDGE */}
        <section
          style={{
            padding: "56px 22px",
            borderTop: "0.5px solid var(--line)",
            background:
              "radial-gradient(120% 100% at 80% 0%, rgba(237,186,70,0.10), transparent 55%)",
          }}
        >
          <div style={IN}>
            <h3
              style={{
                fontSize: "clamp(22px,4vw,30px)",
                fontWeight: 660,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                margin: "0 0 14px",
                maxWidth: "16ch",
              }}
            >
              Tokenized stocks don&apos;t sleep. The market does.
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "var(--fg2)",
                lineHeight: 1.65,
                maxWidth: "52ch",
                margin: "0 0 28px",
              }}
            >
              AAPL-T trades 24/7, but the real Apple only moves when its exchange
              is open. That gap is where liquidity positions break — and no other
              LP tool measures it. LINKEN was built for exactly this seam.
            </p>
            <GapChart />
          </div>
        </section>

        {/* TRUST */}
        <section style={{ padding: "40px 22px", borderTop: "0.5px solid var(--line)", ...IN }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr",
              gap: 14,
              maxWidth: 600,
            }}
          >
            <span style={{ fontSize: 22, color: "var(--brand)" }} aria-hidden>
              ◎
            </span>
            <div>
              <h4 style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 620 }}>
                Every number shows its work
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg2)", lineHeight: 1.6 }}>
                The net carry formula, the data sources, the refresh delay, and a
                flag when a pool&apos;s depth is thin — all open on the methodology
                page. You shouldn&apos;t trust a figure you can&apos;t check.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL */}
        <section
          style={{
            padding: "56px 22px",
            textAlign: "center",
            borderTop: "0.5px solid var(--line)",
          }}
        >
          <h3
            style={{
              fontSize: "clamp(22px,4vw,28px)",
              fontWeight: 640,
              margin: "0 0 22px",
              letterSpacing: "-0.01em",
            }}
          >
            See what your positions are really doing.
          </h3>
          <Link
            href="/terminal"
            style={{
              fontFamily: "var(--m)",
              fontSize: 13,
              color: "#06110e",
              background: "var(--brand)",
              padding: "12px 26px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Launch terminal
          </Link>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            padding: 22,
            borderTop: "0.5px solid var(--line)",
            fontFamily: "var(--m)",
            fontSize: 12,
            color: "var(--fg2)",
          }}
        >
          <span style={{ letterSpacing: 3, color: "var(--fg)", fontWeight: 600 }}>
            LINKEN
          </span>
          <span style={{ display: "flex", gap: 20 }}>
            <Link href="/methodology">Methodology</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer">
              X
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}

const kick: React.CSSProperties = {
  fontSize: 13,
  color: "var(--brand)",
  fontWeight: 600,
  margin: "0 0 6px",
};
const sech: React.CSSProperties = {
  fontSize: "clamp(20px,3.6vw,26px)",
  fontWeight: 620,
  letterSpacing: "-0.01em",
  margin: "0 0 26px",
  maxWidth: "20ch",
};

function ProblemRow({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "26px 1fr",
        gap: 14,
        padding: "18px 2px",
        borderBottom: "0.5px solid var(--line)",
      }}
    >
      <span style={{ fontSize: 19, color: "var(--warn)", marginTop: 1 }} aria-hidden>
        ▹
      </span>
      <div>
        <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{title}</h4>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg2)", lineHeight: 1.55, maxWidth: "60ch" }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "2px 20px 2px 18px", borderLeft: "2px solid var(--brand)" }}>
      <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 620 }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg2)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        background: "var(--ink2)",
        border: "0.5px solid var(--line)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <b style={{ fontSize: 12, color: "var(--brand)" }}>{n}</b>
      <div style={{ fontFamily: "var(--f)", fontSize: 13.5, color: "var(--fg)", marginTop: 8, lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  );
}

function GapChart() {
  return (
    <div
      style={{
        background: "var(--ink2)",
        border: "0.5px solid var(--line2)",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <svg
        viewBox="0 0 640 150"
        style={{ width: "100%", height: "auto", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="0" y="0" width="392" height="150" fill="rgba(120,168,152,0.05)" />
        <line x1="0" y1="44" x2="640" y2="44" stroke="#F57866" strokeWidth="1" strokeDasharray="4 5" />
        <text x="8" y="38" fontFamily="monospace" fontSize="10" fill="#F57866">
          upper bound $210.00
        </text>
        <path
          d="M0,96 L60,94 L120,99 L180,93 L240,97 L300,92 L360,98 L392,95"
          fill="none"
          stroke="#A2B4AB"
          strokeWidth="2"
        />
        <path
          d="M392,95 L440,30 L500,34 L560,26 L620,30 L640,29"
          fill="none"
          stroke="#EDBA46"
          strokeWidth="2.5"
        />
        <circle cx="392" cy="95" r="3.5" fill="#E4EEE9" />
        <circle cx="440" cy="30" r="4" fill="#EDBA46" />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--m)",
          fontSize: 10.5,
          color: "var(--fg2)",
          letterSpacing: 1,
          marginTop: 10,
        }}
      >
        <span>MARKET CLOSED · price drifts</span>
        <span style={{ color: "#EDBA46" }}>OPEN · gap punches through</span>
      </div>
    </div>
  );
}
