import { describe, expect, it } from "vitest";

import { shouldSendNotification } from "./policy";

/** Monday 12:00 UTC (not in quiet hours for typical windows). */
const mondayNoonUtc = new Date("2025-01-06T12:00:00.000Z");

describe("shouldSendNotification", () => {
  it("returns no_preferences when prefs missing for weekly_summary", () => {
    const d = shouldSendNotification(
      null,
      { type: "weekly_summary" },
      mondayNoonUtc
    );
    expect(d.send).toBe(false);
    expect(d.reason).toBe("no_preferences");
  });

  it("returns no_consent when productUpdates false", () => {
    const d = shouldSendNotification(
      {
        consents: { productUpdates: false },
        digest: { frequency: "weekly" }
      },
      { type: "weekly_summary" },
      mondayNoonUtc
    );
    expect(d.send).toBe(false);
    expect(d.reason).toBe("no_consent");
  });

  it("returns frequency_off when digest frequency is off", () => {
    const d = shouldSendNotification(
      {
        consents: { productUpdates: true },
        digest: { frequency: "off" }
      },
      { type: "weekly_summary" },
      mondayNoonUtc
    );
    expect(d.send).toBe(false);
    expect(d.reason).toBe("frequency_off");
  });

  it("returns quiet_hours when now falls in quiet window (UTC minutes)", () => {
    const inQuietUtc = new Date("2025-01-06T10:30:00.000Z");
    const d = shouldSendNotification(
      {
        consents: { productUpdates: true },
        digest: {
          frequency: "weekly",
          quietHours: { start: 600, end: 660 }
        }
      },
      { type: "weekly_summary" },
      inQuietUtc
    );
    expect(d.send).toBe(false);
    expect(d.reason).toBe("quiet_hours");
  });

  it("returns in_app channel when inAppOnly", () => {
    const d = shouldSendNotification(
      {
        consents: { productUpdates: true },
        digest: { frequency: "weekly", inAppOnly: true }
      },
      { type: "weekly_summary" },
      mondayNoonUtc
    );
    expect(d.send).toBe(true);
    expect(d.channel).toBe("in_app");
  });

  it("returns email channel on Monday UTC when weekly and allowed", () => {
    const d = shouldSendNotification(
      {
        consents: { productUpdates: true },
        digest: { frequency: "weekly" }
      },
      { type: "weekly_summary" },
      mondayNoonUtc
    );
    expect(d.send).toBe(true);
    expect(d.channel).toBe("email");
  });

  it("scheduled_report with null prefs allows email", () => {
    const d = shouldSendNotification(
      null,
      { type: "scheduled_report" },
      mondayNoonUtc
    );
    expect(d.send).toBe(true);
    expect(d.channel).toBe("email");
  });
});
