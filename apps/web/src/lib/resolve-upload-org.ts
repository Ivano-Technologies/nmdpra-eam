import type { Role } from "@/lib/roles";
import { parseOrgId } from "@/lib/tenant";

/**
 * Resolves tenant org for Excel upload. Owners may pass org via form when Clerk has no orgId.
 * Admins must have orgId in Clerk metadata (cannot target arbitrary orgs via form).
 */
export function resolveUploadOrgId(params: {
  role: Role;
  metadata: unknown;
  formOrgId: string | null | undefined;
}):
  | { ok: true; orgId: string }
  | { ok: false; error: string; status?: 403 | 400 } {
  const meta = parseOrgId(params.metadata);
  const form = params.formOrgId?.trim() || null;

  if (params.role === "owner") {
    const orgId = form ?? meta;
    if (!orgId) {
      return {
        ok: false,
        status: 400,
        error:
          "Organization ID is required. Set orgId in Clerk public metadata or enter it when uploading."
      };
    }
    return { ok: true, orgId };
  }

  if (params.role === "admin") {
    if (!meta) {
      return {
        ok: false,
        status: 403,
        error:
          "Your account must have orgId in Clerk public metadata to upload data for your organization."
      };
    }
    if (form && form !== meta) {
      return {
        ok: false,
        status: 403,
        error: "orgId must match your organization in Clerk metadata."
      };
    }
    return { ok: true, orgId: meta };
  }

  return { ok: false, status: 403, error: "Insufficient permissions to upload." };
}
