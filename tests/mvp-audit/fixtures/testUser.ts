/**
 * Stub test user — align Clerk Dashboard + publicMetadata with these values.
 * Password is for optional manual UI sign-in only; Playwright uses ticket auth.
 */
export const testUser = {
  email:
    process.env.E2E_CLERK_EMAIL?.trim() || "e2e-placeholder@example.com",
  password: process.env.E2E_CLERK_PASSWORD?.trim() || "E2E-Use-Clerk-Dashboard",
  firstName: "E2E",
  lastName: "Audit",
  /** Clerk `publicMetadata.role` */
  role: "owner" as const,
  /** Clerk `publicMetadata.orgId` — fallback env E2E_ORG_ID */
  orgId: process.env.E2E_ORG_ID?.trim() || "org_e2e_audit"
} as const;
