import type { Role } from "@/lib/roles";
import type { DashboardLayout, DashboardSectionId } from "@/types/user-preferences";

export const ALL_ADMIN_SECTION_IDS: DashboardSectionId[] = [
  "overview",
  "data-upload",
  "risk-ranking",
  "expiry-radar",
  "reports",
  "weekly-insight"
];

export const OWNER_EXTRA_SECTION: DashboardSectionId = "owner-panel";

export function defaultDashboardLayout(role: Role): DashboardLayout {
  if (role === "owner") {
    return {
      order: [...ALL_ADMIN_SECTION_IDS, OWNER_EXTRA_SECTION],
      hidden: []
    };
  }
  return {
    order: [...ALL_ADMIN_SECTION_IDS],
    hidden: []
  };
}

export function mergeDashboardLayout(
  user: Partial<DashboardLayout> | undefined,
  role: Role
): DashboardLayout {
  const d = defaultDashboardLayout(role);
  const baseOrder =
    user?.order?.length &&
    user.order.every((id) => validSectionId(id, role))
      ? [...user.order]
      : [...d.order];
  for (const id of d.order) {
    if (!baseOrder.includes(id)) {
      baseOrder.push(id);
    }
  }
  const hidden = user?.hidden?.length
    ? [...new Set(user.hidden.filter((id) => validSectionId(id, role)))]
    : d.hidden;
  return { order: baseOrder, hidden };
}

function validSectionId(id: string, role: Role): id is DashboardSectionId {
  const base = ALL_ADMIN_SECTION_IDS.includes(id as DashboardSectionId);
  if (id === "owner-panel") {
    return role === "owner";
  }
  return base;
}
