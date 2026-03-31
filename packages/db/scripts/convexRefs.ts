import { makeFunctionReference } from "convex/server";

import type { CanonicalLicenseRow } from "@rmlis/shared";

export const importLicenses = makeFunctionReference<
  "mutation",
  { secret: string; rows: CanonicalLicenseRow[]; defaultOrgId?: string },
  { imported: number; total: number }
>("ingest:importLicenses");
