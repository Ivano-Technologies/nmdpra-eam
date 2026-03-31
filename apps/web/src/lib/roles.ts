/**
 * Clerk stores role on {@link User.publicMetadata} (Dashboard: User → Metadata).
 * Never trust client-only checks — enforce again in API routes / server actions.
 */
export type UserRole = "admin" | "client";

export function parseUserRole(metadata: unknown): UserRole {
  if (!metadata || typeof metadata !== "object") {
    return "client";
  }
  const raw = (metadata as { role?: unknown }).role;
  if (raw === "admin" || raw === "client") {
    return raw;
  }
  return "client";
}
