export const normalizeVendorKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const DAY_MS = 86_400_000;

export const computeDaysToExpiry = (expiryDateIso: string, now: Date = new Date()): number => {
  const e = new Date(`${expiryDateIso}T00:00:00.000Z`);
  const utcE = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  const utcT = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((utcE - utcT) / DAY_MS);
};

export type ExpiryBand = "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE";

export const computeExpiryBand = (daysToExpiry: number): ExpiryBand => {
  if (daysToExpiry < 0) return "EXPIRED";
  if (daysToExpiry <= 30) return "CRITICAL";
  if (daysToExpiry <= 60) return "WARNING";
  return "SAFE";
};

export const computeRiskScore = (daysToExpiry: number): number => {
  if (daysToExpiry < 0) return 100;
  return Math.max(0, Math.min(100, 100 - daysToExpiry));
};
