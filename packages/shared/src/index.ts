export type ServiceHealth = {
  service: string;
  status: "ok" | "degraded" | "down";
  checkedAt: string;
};
