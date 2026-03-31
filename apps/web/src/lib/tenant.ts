import { AuthRoleError } from "@/lib/auth-role-error";
import type { Role } from "@/lib/roles";

/**
 * Clerk `publicMetadata.orgId` — non-empty string identifies the tenant for client users.
 * Admins and owners may omit it for global access.
 */
export function parseOrgId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const raw = (metadata as { orgId?: unknown }).orgId;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Args passed to Convex license queries — only ever constructed on the server from Clerk. */
export type LicenseQueryScope = {
  orgIdFilter?: string;
  includeUnscopedVendors?: boolean;
};

/**
 * Resolves tenant scope for licence data. Clients must have `orgId` in public metadata.
 * Owners and admins get full-database scope (no org filter).
 */
export function getLicenseQueryScope(
  metadata: unknown,
  role: Role
): LicenseQueryScope {
  if (role === "owner" || role === "admin") {
    return {};
  }
  const orgId = parseOrgId(metadata);
  if (!orgId) {
    throw new AuthRoleError(
      "Organization not configured for your account",
      403
    );
  }
  return { orgIdFilter: orgId, includeUnscopedVendors: false };
}

/**
 * Security: `orgIdFilter` on Convex licence queries is not an authorization boundary by
 * itself — anyone could call Convex with a spoofed org id. Production multi-tenant
 * access must use Convex auth (e.g. Clerk JWT) or keep sensitive reads behind
 * server-only routes that do not expose unauthenticated Convex query URLs.
 */
