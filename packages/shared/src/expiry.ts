export type ExpiryStatus = "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE";

const DAY_MS = 86_400_000;

export const utcDayStart = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export const computeDaysToExpiry = (expiryDateIso: string, now: Date = new Date()): number => {
  const expiry = utcDayStart(new Date(`${expiryDateIso}T00:00:00.000Z`));
  const today = utcDayStart(now);
  return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
};

export const computeExpiryStatus = (daysToExpiry: number): ExpiryStatus => {
  if (daysToExpiry < 0) return "EXPIRED";
  if (daysToExpiry <= 30) return "CRITICAL";
  if (daysToExpiry <= 60) return "WARNING";
  return "SAFE";
};

/** Higher = more risk (0–100). */
export const computeRiskScore = (daysToExpiry: number): number => {
  if (daysToExpiry < 0) return 100;
  return Math.max(0, Math.min(100, 100 - daysToExpiry));
};

/**
 * Formats a date-only ISO string (YYYY-MM-DD) as en-GB in UTC (avoids timezone drift).
 * Returns the original string if it cannot be parsed as three numeric Y-M-D parts.
 */
export const formatIsoDateEnGb = (isoDate: string): string => {
  const parts = isoDate.trim().split("-");
  if (parts.length !== 3) {
    return isoDate;
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) {
    return isoDate;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", { timeZone: "UTC" });
};
