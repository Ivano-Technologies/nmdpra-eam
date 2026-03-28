import { makeFunctionReference } from "convex/server";

/**
 * Function references without requiring `npx convex codegen` (works offline).
 * Paths match Convex module exports: `fileName:exportName`.
 */
export const convexApi = {
  licenses: {
    expiringBuckets: makeFunctionReference<"query">("licenses:expiringBuckets"),
    listAllForCsv: makeFunctionReference<"query">("licenses:listAllForCsv"),
    mvpReportData: makeFunctionReference<"query">("licenses:mvpReportData"),
    riskRanking: makeFunctionReference<"query">("licenses:riskRanking")
  },
  ingest: {
    importLicenses: makeFunctionReference<
      "mutation",
      { secret: string; rows: Array<Record<string, string>> },
      { imported: number; total: number }
    >("ingest:importLicenses")
  }
} as const;
