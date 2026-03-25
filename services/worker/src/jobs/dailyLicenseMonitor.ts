export type ExpiryComputationResult = {
  licenseId: string;
  daysToExpiry: number;
  expiryStatus: "valid" | "expiring_soon" | "expired";
};

export type NotificationPayload = {
  licenseId: string;
  vendorId: string;
  expiryStatus: ExpiryComputationResult["expiryStatus"];
  daysToExpiry: number;
  channelHints: Array<"email" | "push">;
};

export const runDailyLicenseMonitor = async (): Promise<void> => {
  // Placeholder: query licenses and compute expiry classifications.
  const computed: ExpiryComputationResult[] = [];

  // Placeholder: isolate licenses requiring alerting.
  const expiring = computed.filter((item) => item.expiryStatus !== "valid");

  // Placeholder: prepare payloads for notification dispatcher.
  const notifications: NotificationPayload[] = expiring.map((item) => ({
    licenseId: item.licenseId,
    vendorId: "placeholder-vendor-id",
    expiryStatus: item.expiryStatus,
    daysToExpiry: item.daysToExpiry,
    channelHints: ["email", "push"]
  }));

  console.log(`[worker] prepared ${notifications.length} notifications`);
};
