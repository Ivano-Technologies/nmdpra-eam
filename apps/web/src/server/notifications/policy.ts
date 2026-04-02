import type { DigestPreferences } from "@/types/user-preferences";

import { isInQuietHours } from "@/server/notifications/quiet-hours";

export type DigestFrequency = "daily" | "weekly" | "off";

/** Policy input; aligns with Convex `userPreferences` subset. */
export type PolicyUserPreferences = {
  digest?: {
    frequency?: DigestFrequency;
    /** @deprecated */
    emailFrequency?: DigestFrequency;
    quietHours?: { start: number; end: number };
    quietHoursStart?: string;
    quietHoursEnd?: string;
    inAppOnly?: boolean;
  };
  consents?: {
    productUpdates?: boolean;
  };
};

export type NotificationEvent =
  | { type: "weekly_summary" }
  | { type: "risk_alert"; severity: "low" | "medium" | "high" }
  | { type: "digest" }
  | { type: "scheduled_report" };

export type Decision = {
  send: boolean;
  reason?: string;
  channel?: "email" | "in_app";
};

function resolveFrequency(d: DigestPreferences | null | undefined): {
  freq: DigestFrequency;
} {
  const raw = d?.frequency ?? d?.emailFrequency ?? "weekly";
  if (raw === "daily" || raw === "weekly") {
    return { freq: raw };
  }
  return { freq: "off" };
}

function applyChannel(
  digest: DigestPreferences | undefined | null,
  base: Decision
): Decision {
  if (!base.send) {
    return base;
  }
  if (digest?.inAppOnly === true) {
    return { send: true, reason: base.reason ?? "ok", channel: "in_app" };
  }
  return { send: true, reason: base.reason ?? "ok", channel: "email" };
}

function quietBlock(
  digest: DigestPreferences | undefined | null,
  timestampMs: number
): Decision | null {
  if (isInQuietHours(digest, timestampMs)) {
    return { send: false, reason: "quiet_hours" };
  }
  return null;
}

/**
 * Pure decision layer: frequency, quiet hours, consent, channel (email vs in-app).
 */
export function shouldSendNotification(
  prefs: PolicyUserPreferences | null | undefined,
  event: NotificationEvent,
  now: Date = new Date()
): Decision {
  const timestampMs = now.getTime();
  const digest = prefs?.digest as DigestPreferences | undefined;

  if (event.type === "scheduled_report") {
    const q = quietBlock(digest, timestampMs);
    if (q) {
      return q;
    }
    if (!prefs) {
      return { send: true, reason: "no_user_digest_defaults_allow", channel: "email" };
    }
    return applyChannel(digest, {
      send: true,
      reason: "ok",
      channel: "email"
    });
  }

  if (!prefs) {
    return { send: false, reason: "no_preferences" };
  }

  if (!prefs.consents?.productUpdates) {
    return { send: false, reason: "no_consent" };
  }

  const q = quietBlock(digest, timestampMs);
  if (q) {
    return q;
  }

  const { freq } = resolveFrequency(digest);

  switch (event.type) {
    case "weekly_summary": {
      if (freq === "off") {
        return { send: false, reason: "frequency_off" };
      }
      if (freq === "daily") {
        return { send: false, reason: "frequency_daily_use_digest_cron" };
      }
      if (freq !== "weekly") {
        return { send: false, reason: "frequency_not_weekly" };
      }
      const dow = now.getUTCDay();
      if (dow !== 1) {
        return { send: false, reason: "not_monday_utc" };
      }
      return applyChannel(digest, { send: true, reason: "ok" });
    }
    case "digest": {
      if (freq === "off") {
        return { send: false, reason: "frequency_off" };
      }
      if (freq !== "daily") {
        return { send: false, reason: "frequency_not_daily" };
      }
      return applyChannel(digest, { send: true, reason: "ok" });
    }
    case "risk_alert": {
      if (event.severity !== "high") {
        return {
          send: false,
          reason: "risk_severity_deferred"
        };
      }
      return applyChannel(digest, { send: true, reason: "ok_risk_high" });
    }
  }
}

/** Maps Decision to legacy email-only gate (Resend). */
export function decisionToLegacyEmailAllow(d: Decision): {
  allow: boolean;
  reason: string;
} {
  if (!d.send) {
    return { allow: false, reason: d.reason ?? "blocked" };
  }
  if (d.channel === "in_app") {
    return { allow: false, reason: "in_app_only" };
  }
  return { allow: true, reason: d.reason ?? "ok" };
}

