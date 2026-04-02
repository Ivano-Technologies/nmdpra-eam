import type { DigestPreferences } from "@/types/user-preferences";
import {
  decisionToLegacyEmailAllow,
  shouldSendNotification as decideNotification
} from "@/server/notifications/policy";
export {
  isWithinQuietHoursUtc,
  minutesFromMidnightUtc
} from "@/server/notifications/quiet-hours";

/**
 * Legacy `{ allow, reason }` shape for **email only**.
 * Prefer `shouldSendNotification` from `@/server/notifications/policy` for channel-aware decisions.
 */

export type NotificationEmailType =
  | "weekly_summary"
  | "scheduled_report"
  | "digest";

export type ShouldSendNotificationInput = {
  digest?: DigestPreferences | null;
  type: NotificationEmailType;
  timestampMs: number;
};

export type ShouldSendNotificationResult = {
  allow: boolean;
  reason: string;
};

/**
 * Weekly/digest paths assume product consent granted for backward compatibility with callers
 * that only passed `digest` (no consent mirror).
 */
export function shouldSendNotification(
  input: ShouldSendNotificationInput
): ShouldSendNotificationResult {
  const now = new Date(input.timestampMs);
  if (input.type === "scheduled_report") {
    const d = decideNotification(
      input.digest
        ? { digest: input.digest ?? undefined, consents: { productUpdates: true } }
        : null,
      { type: "scheduled_report" },
      now
    );
    return decisionToLegacyEmailAllow(d);
  }
  const d = decideNotification(
    {
      digest: input.digest ?? undefined,
      consents: { productUpdates: true }
    },
    input.type === "weekly_summary"
      ? { type: "weekly_summary" }
      : { type: "digest" },
    now
  );
  return decisionToLegacyEmailAllow(d);
}
