/**
 * Clerk stores role on {@link User.publicMetadata} (Dashboard: Users → Metadata).
 * Hierarchy: owner ≥ admin ≥ client. Enforce again on the server — never trust UI alone.
 */
export type Role = "owner" | "admin" | "client";

/** @deprecated Use {@link Role} */
export type UserRole = Role;

const HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  client: 1
};

export function parseUserRole(metadata: unknown): Role {
  if (!metadata || typeof metadata !== "object") {
    return "client";
  }
  const raw = (metadata as { role?: unknown }).role;
  if (raw === "owner" || raw === "admin" || raw === "client") {
    return raw;
  }
  return "client";
}

/** True if `userRole` is at or above `required` in the hierarchy. */
export function hasPermission(userRole: Role, required: Role): boolean {
  return HIERARCHY[userRole] >= HIERARCHY[required];
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "client":
      return "Client";
    default:
      return "Client";
  }
}
