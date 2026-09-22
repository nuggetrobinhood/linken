// Display helpers. Every number that reaches the screen goes through one of
// these so we never leak float artifacts.

export function usd(n: number, opts: { sign?: boolean } = {}): string {
  const rounded = Math.round(n * 100) / 100;
  const sign = opts.sign && rounded > 0 ? "+" : "";
  const body = Math.abs(rounded).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${rounded < 0 ? "-" : ""}$${body}`;
}

export function pct(n: number, opts: { sign?: boolean; dp?: number } = {}): string {
  const dp = opts.dp ?? 1;
  const rounded = Number(n.toFixed(dp));
  const sign = opts.sign && rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(dp)}%`;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// Honest exit-time band. Never a false-precision decimal like "4.2 days".
export function exitBand(band: { min: number; max: number } | null): string {
  if (!band) return "—";
  if (band.min === band.max) return `~${band.min} days`;
  return `~${band.min}–${band.max} days`;
}
