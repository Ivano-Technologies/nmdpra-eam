/**
 * Deterministic, illustrative week-over-week deltas for KPI cards.
 * Not backed by historical API data — replaces with real deltas when available.
 */
export function illustrativeKpiTrend(
  label: string,
  value: number
): { text: string; positive: boolean } {
  let h = 0;
  const s = `${label}:${Number.isFinite(value) ? value : 0}`;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
  }
  const pct = 2 + (Math.abs(h) % 14);
  const rawIncrease = (h >>> 0) % 2 === 0;
  const lowerIsBetter = /expired|critical|expiring soon|warning \(31/i.test(label);
  const higherIsBetter = /active %|^safe/i.test(label);
  let favorable: boolean;
  if (lowerIsBetter) {
    favorable = !rawIncrease;
  } else if (higherIsBetter) {
    favorable = rawIncrease;
  } else {
    favorable = rawIncrease;
  }
  const text = `${rawIncrease ? "+" : "−"}${pct}% vs last week`;
  return { text, positive: favorable };
}
