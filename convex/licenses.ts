import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { v } from "convex/values";

import { computeDaysToExpiry, computeExpiryBand } from "./helpers";

/**
 * Tenant filter for licence rows. These args are optional for backward compatibility.
 * Callers that enforce Clerk roles must only pass scope from trusted server code — never
 * trust a client-provided org id for authorization (see platform governance notes).
 */
const licenseScopeArgs = {
  orgIdFilter: v.optional(v.string()),
  includeUnscopedVendors: v.optional(v.boolean())
};

type LicenseScope = {
  orgIdFilter?: string;
  includeUnscopedVendors?: boolean;
};

function vendorMatchesScope(
  vendor: Doc<"vendors"> | null,
  scope: LicenseScope
): boolean {
  if (!vendor) {
    return false;
  }
  if (scope.orgIdFilter === undefined) {
    return true;
  }
  if (vendor.orgId === scope.orgIdFilter) {
    return true;
  }
  return (
    scope.includeUnscopedVendors === true && vendor.orgId === undefined
  );
}

export const expiringBuckets = query({
  args: licenseScopeArgs,
  handler: async (ctx, rawArgs) => {
    const scope: LicenseScope = {
      orgIdFilter: rawArgs.orgIdFilter,
      includeUnscopedVendors: rawArgs.includeUnscopedVendors
    };
    // Full-table read for dashboard buckets; migrate to .take() / .paginate() when the dataset grows.
    // eslint-disable-next-line local/no-collect-in-query -- bounded deployment size today; see rule message for alternatives
    const licenses = await ctx.db.query("licenses").collect();
    const expired: Array<Record<string, unknown>> = [];
    const critical: Array<Record<string, unknown>> = [];
    const warning: Array<Record<string, unknown>> = [];

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
      if (!vendorMatchesScope(vendor, scope)) {
        continue;
      }
      const vendorName = vendor?.name ?? "Unknown vendor";

      const daysToExpiry = computeDaysToExpiry(lic.expiryDate);
      const expiryStatus = computeExpiryBand(daysToExpiry);

      const item = {
        id: lic._id,
        vendorName,
        licenseType: lic.licenseType,
        issueDate: lic.issueDate,
        expiryDate: lic.expiryDate,
        status: lic.status,
        daysToExpiry,
        expiryStatus,
        riskScore: lic.riskScore
      };

      if (expiryStatus === "EXPIRED") {
        expired.push(item);
      } else if (expiryStatus === "CRITICAL") {
        critical.push(item);
      } else if (expiryStatus === "WARNING") {
        warning.push(item);
      }
    }

    return { expired, critical, warning };
  }
});

export const listAllForCsv = query({
  args: licenseScopeArgs,
  handler: async (ctx, rawArgs) => {
    const scope: LicenseScope = {
      orgIdFilter: rawArgs.orgIdFilter,
      includeUnscopedVendors: rawArgs.includeUnscopedVendors
    };
    // Export needs all rows; replace with paginated export when licenses no longer fit in memory limits.
    // eslint-disable-next-line local/no-collect-in-query
    const licenses = await ctx.db.query("licenses").collect();
    const rows: Array<{
      vendorName: string;
      licenseType: string;
      issueDate: string;
      expiryDate: string;
      status: string;
      riskScore: number;
      daysToExpiry: number;
      expiryStatus: ReturnType<typeof computeExpiryBand>;
    }> = [];

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
      if (!vendorMatchesScope(vendor, scope)) {
        continue;
      }
      const daysToExpiry = computeDaysToExpiry(lic.expiryDate);
      rows.push({
        vendorName: vendor?.name ?? "Unknown vendor",
        licenseType: lic.licenseType,
        issueDate: lic.issueDate,
        expiryDate: lic.expiryDate,
        status: lic.status,
        riskScore: lic.riskScore,
        daysToExpiry,
        expiryStatus: computeExpiryBand(daysToExpiry)
      });
    }

    return rows;
  }
});

export const mvpReportData = query({
  args: licenseScopeArgs,
  handler: async (ctx, rawArgs) => {
    const scope: LicenseScope = {
      orgIdFilter: rawArgs.orgIdFilter,
      includeUnscopedVendors: rawArgs.includeUnscopedVendors
    };
    // Report totals require scanning all license rows; paginate or stream when scale requires it.
    // eslint-disable-next-line local/no-collect-in-query
    const licenses = await ctx.db.query("licenses").collect();
    const generatedAt = new Date().toISOString();
    let expired = 0;
    let critical = 0;
    let warning = 0;
    let safe = 0;
    let expiringIn30Days = 0;
    const vendorMaxRisk = new Map<string, { vendorName: string; riskScore: number }>();

    const table: Array<{
      vendor: string;
      licenseType: string;
      expiryDate: string;
      status: string;
      expiryStatus: ReturnType<typeof computeExpiryBand>;
      daysToExpiry: number;
    }> = [];

    let included = 0;

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
      if (!vendorMatchesScope(vendor, scope)) {
        continue;
      }
      included += 1;
      const vendorName = vendor?.name ?? "Unknown vendor";
      const daysToExpiry = computeDaysToExpiry(lic.expiryDate);
      const expiryStatus = computeExpiryBand(daysToExpiry);
      if (expiryStatus === "EXPIRED") {
        expired += 1;
      } else if (expiryStatus === "CRITICAL") {
        critical += 1;
      } else if (expiryStatus === "WARNING") {
        warning += 1;
      } else {
        safe += 1;
      }
      if (daysToExpiry >= 0 && daysToExpiry <= 30) {
        expiringIn30Days += 1;
      }

      const key = String(lic.vendorId);
      const prev = vendorMaxRisk.get(key);
      if (!prev || lic.riskScore > prev.riskScore) {
        vendorMaxRisk.set(key, { vendorName, riskScore: lic.riskScore });
      }

      table.push({
        vendor: vendorName,
        licenseType: lic.licenseType,
        expiryDate: lic.expiryDate,
        status: lic.status,
        expiryStatus,
        daysToExpiry
      });
    }

    const topRiskVendors = Array.from(vendorMaxRisk.values())
      .filter((v) => v.vendorName.trim().length > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 15);

    return {
      generatedAt,
      summary: {
        total: included,
        expired,
        critical,
        warning,
        safe,
        expiringIn30Days
      },
      rows: table,
      topRiskVendors
    };
  }
});

export const riskRanking = query({
  args: licenseScopeArgs,
  handler: async (ctx, rawArgs) => {
    const scope: LicenseScope = {
      orgIdFilter: rawArgs.orgIdFilter,
      includeUnscopedVendors: rawArgs.includeUnscopedVendors
    };
    // Ranking uses full set; switch to indexed/paginated reads if the table grows large.
    // eslint-disable-next-line local/no-collect-in-query
    const licenses = await ctx.db.query("licenses").collect();
    const rows: Array<{
      vendorName: string;
      licenseType: string;
      expiryDate: string;
      riskScore: number;
      daysToExpiry: number;
    }> = [];

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
      if (!vendorMatchesScope(vendor, scope)) {
        continue;
      }
      const daysToExpiry = computeDaysToExpiry(lic.expiryDate);
      rows.push({
        vendorName: vendor?.name ?? "Unknown vendor",
        licenseType: lic.licenseType,
        expiryDate: lic.expiryDate,
        riskScore: lic.riskScore,
        daysToExpiry
      });
    }

    rows.sort((a, b) => b.riskScore - a.riskScore);
    return rows;
  }
});
