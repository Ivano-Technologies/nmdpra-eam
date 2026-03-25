import cron from "node-cron";

import { runDailyLicenseMonitor } from "./jobs/dailyLicenseMonitor";

export const startScheduler = (): void => {
  // Run every day at 01:00 UTC.
  cron.schedule("0 1 * * *", async () => {
    try {
      await runDailyLicenseMonitor();
    } catch (error) {
      console.error("[worker] daily monitor failed", error);
    }
  });
};
