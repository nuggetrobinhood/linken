import Link from "next/link";
import { WalletButton } from "./WalletButton";
import { LogoMark } from "./Logo";

export function SiteNav() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "0.5px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--m)", fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>
          <LogoMark size={22} /> LINKEN
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          <Link href="/terminal" style={{ fontSize: 12, color: "var(--fg2)", padding: "6px 11px", borderRadius: 7 }}>Terminal</Link>
          <Link href="/methodology" style={{ fontSize: 12, color: "var(--fg2)", padding: "6px 11px", borderRadius: 7 }}>Methodology</Link>
        </div>
      </div>
      <WalletButton compact />
    </div>
  );
}
