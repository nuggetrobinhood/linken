export interface MarketState {
  isOpen: boolean;
  label: string;
}

// US equities regular session: 9:30–16:00 ET, Mon–Fri. (Holidays ignored for
// now — refine later.) This is the market-hours signal behind LINKEN's wedge:
// tokenized stocks trade 24/7 but their underlying only moves while this is open.
export function usEquitiesState(now: Date = new Date()): MarketState {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";

  const wd = get("weekday");
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const min = parseInt(get("minute"), 10);
  const mins = hour * 60 + min;

  const weekday = !["Sat", "Sun"].includes(wd);
  const isOpen = weekday && mins >= 570 && mins < 960;
  return { isOpen, label: isOpen ? "US equities · OPEN" : "US equities · CLOSED" };
}
