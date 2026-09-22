import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "0.5px solid var(--line)", marginTop: 26, padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontFamily: "var(--m)", fontSize: 12, color: "var(--fg2)" }}>
          <span style={{ letterSpacing: 2, color: "var(--fg)", fontWeight: 600 }}>LINKEN</span>
          <span style={{ display: "flex", gap: 18 }}>
            <Link href="/methodology">Methodology</Link>
            <a href="https://github.com/nuggetrobinhood/linken" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
          </span>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "var(--fg3)", lineHeight: 1.6, fontFamily: "var(--f)" }}>
          Reads live from Robinhood Chain (chain 4663) · net carry = fees − impermanent loss − real gas · not financial advice.
        </div>
      </div>
    </footer>
  );
}
