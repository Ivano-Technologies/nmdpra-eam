export type ServiceHealth = {
  service: string;
  status: "ok" | "degraded" | "down";
  checkedAt: string;
};

export * from "./expiry";
export * from "./licenseImport";
