// LINKEN mark: an L-bracket (the frame) with a green node on a stem — the same
// lollipop as the range-band marker. Vector so it stays crisp and transparent.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M8 6 V20 H20" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="12.5" x2="14.5" y2="12.5" stroke="#A0D636" strokeWidth="2" />
      <rect x="14" y="9" width="8" height="7.5" rx="2.2" fill="#A0D636" />
    </svg>
  );
}

export function Wordmark({ mark = 20 }: { mark?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--m)", fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>
      <LogoMark size={mark} /> LINKEN
    </span>
  );
}
