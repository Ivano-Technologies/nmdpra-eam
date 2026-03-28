import { makeFunctionReference } from "convex/server";

import type { CanonicalLicenseRow } from "@rmlis/shared";

export const importLicenses = makeFunctionReference<
  "mutation",
  { secret: string; rows: CanonicalLicenseRow[] },
  { imported: number; total: number }
>("ingest:importLicenses");
