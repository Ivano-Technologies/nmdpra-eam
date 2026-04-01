import type { DigestPreferences } from "@/types/user-preferences";

/**
 * Phase 3+ notification dispatcher will call this — single place for
 * frequency, quiet hours, and email vs in-app. Does not enqueue jobs.
 */

export type NotificationEmailType =
  | "weekly_summary"
  | "scheduled_report"
  | "digest";

export type ShouldSendNotificationInput = {
  /** User digest prefs; omit for org-only flows (e.g. subscription email with no user row). */
  digest?: DigestPreferences | null;
  type: NotificationEmailType;
  /** Event time (Unix ms). Use UTC for cron alignment unless you pass local-adjusted ms. */
  timestampMs: number;
};

export type ShouldSendNotificationResult = {
  allow: boolean;
  reason: string;
};

function resolveFrequency(d: DigestPreferences | null | undefined): {
  freq: "daily" | "weekly" | "off";
} {
  const raw = d?.frequency ?? d?.emailFrequency ?? "weekly";
  if (raw === "daily" || raw === "weekly") {
    return { freq: raw };
  }
  return { freq: "off" };
}

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

function resolveQuietWindow(d: DigestPreferences | undefined | null): {
  start: number;
  end: number;
} | null {
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

function emailSuppressedByInAppOnly(d: DigestPreferences | null | undefined): boolean {
  return d?.inAppOnly === true;
}

/**
 * Core policy: should we send an **email** (Resend, etc.) for this type at this time?
 */
export function shouldSendNotification(
  input: ShouldSendNotificationInput
): ShouldSendNotificationResult {
  const { digest, type, timestampMs } = input;
  const { freq } = resolveFrequency(digest ?? undefined);

  if (emailSuppressedByInAppOnly(digest ?? undefined)) {
    return { allow: false, reason: "in_app_only" };
  }

  const quiet = resolveQuietWindow(digest ?? undefined);
  if (quiet && isWithinQuietHoursUtc(timestampMs, quiet.start, quiet.end)) {
    return { allow: false, reason: "quiet_hours" };
  }

  switch (type) {
    case "scheduled_report": {
      // Org subscription emails: no per-user digest row yet → allow.
      // When joined to prefs later, only quiet hours + in_app_only apply (handled above).
      return {
        allow: true,
        reason: digest ? "ok" : "no_user_digest_defaults_allow"
      };
    }
    case "digest": {
      if (freq === "off") {
        return { allow: false, reason: "frequency_off" };
      }
      if (freq !== "daily") {
        return { allow: false, reason: "frequency_not_daily" };
      }
      return { allow: true, reason: "ok" };
    }
    case "weekly_summary": {
      if (freq === "off") {
        return { allow: false, reason: "frequency_off" };
      }
      if (freq === "daily") {
        return {
          allow: false,
          reason: "frequency_daily_use_digest_cron"
        };
      }
      if (freq !== "weekly") {
        return { allow: false, reason: "frequency_not_weekly" };
      }
      const dow = new Date(timestampMs).getUTCDay();
      if (dow !== 1) {
        return { allow: false, reason: "not_monday_utc" };
      }
      return { allow: true, reason: "ok" };
    }
    default: {
      return { allow: false, reason: "unknown_type" };
    }
  }
}
