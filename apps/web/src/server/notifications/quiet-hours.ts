import type { DigestPreferences } from "@/types/user-preferences";

/** Minutes 0–1439 from midnight for the given instant (UTC). */
export function minutesFromMidnightUtc(timestampMs: number): number {
  const d = new Date(timestampMs);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Quiet window spans [start, end) in minutes; if start > end, it crosses midnight.
 */
export function isWithinQuietHoursUtc(
  timestampMs: number,
  startMin: number,
  endMin: number
): boolean {
  if (startMin === endMin) {
    return false;
  }
  const now = minutesFromMidnightUtc(timestampMs);
  if (startMin < endMin) {
    return now >= startMin && now < endMin;
  }
  return now >= startMin || now < endMin;
}

export function resolveQuietWindow(
  d: DigestPreferences | undefined | null
): { start: number; end: number } | null {
  if (!d) {
    return null;
  }
  if (
    d.quietHours &&
    typeof d.quietHours.start === "number" &&
    typeof d.quietHours.end === "number"
  ) {
    return { start: d.quietHours.start, end: d.quietHours.end };
  }
  if (d.quietHoursStart && d.quietHoursEnd) {
    const parse = (s: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
      if (!m) {
        return 0;
      }
      return (
        Math.min(23, Math.max(0, parseInt(m[1]!, 10))) * 60 +
        Math.min(59, Math.max(0, parseInt(m[2]!, 10)))
      );
    };
    return { start: parse(d.quietHoursStart), end: parse(d.quietHoursEnd) };
  }
  return null;
}

export function isInQuietHours(
  digest: DigestPreferences | undefined | null,
  timestampMs: number
): boolean {
  const quiet = resolveQuietWindow(digest ?? undefined);
  if (!quiet) {
    return false;
  }
  return isWithinQuietHoursUtc(timestampMs, quiet.start, quiet.end);
}
