import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function SiteNav() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 22px",
        borderBottom: "0.5px solid var(--line)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          fontFamily: "var(--m)",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 3,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            background: "var(--brand)",
            borderRadius: 2,
            transform: "rotate(45deg)",
            display: "inline-block",
            boxShadow: "0 0 10px var(--brand)",
          }}
        />
        LINKEN
      </Link>
      <WalletButton compact />
    </div>
  );
}
