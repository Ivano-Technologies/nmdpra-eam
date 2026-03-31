import { parseOrgId } from "@/lib/tenant";

/**
 * Consent rows are keyed by user + org scope. Users without Clerk orgId use a
 * stable sentinel so consent queries stay indexed.
 */
export function consentOrgIdFromMetadata(metadata: unknown): string {
  return parseOrgId(metadata) ?? "_global_";
}
