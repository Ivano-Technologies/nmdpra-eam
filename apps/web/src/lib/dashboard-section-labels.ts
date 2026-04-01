import type { DashboardSectionId } from "@/types/user-preferences";

const LABELS: Record<DashboardSectionId, string> = {
  overview: "Overview & KPIs",
  "data-upload": "Data upload",
  "expiry-radar": "Expiry radar",
  "risk-ranking": "Risk ranking",
  reports: "Reports",
  "owner-panel": "Owner workspace"
};

export function sectionLabel(id: DashboardSectionId): string {
  return LABELS[id] ?? id;
}
