import { query } from "./_generated/server";

import { computeDaysToExpiry, computeExpiryBand } from "./helpers";

export const expiringBuckets = query({
  args: {},
  handler: async (ctx) => {
    // Full-table read for dashboard buckets; migrate to .take() / .paginate() when the dataset grows.
    // eslint-disable-next-line local/no-collect-in-query -- bounded deployment size today; see rule message for alternatives
    const licenses = await ctx.db.query("licenses").collect();
    const expired: Array<Record<string, unknown>> = [];
    const critical: Array<Record<string, unknown>> = [];
    const warning: Array<Record<string, unknown>> = [];

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
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
  args: {},
  handler: async (ctx) => {
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
  args: {},
  handler: async (ctx) => {
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

    for (const lic of licenses) {
      const vendor = await ctx.db.get(lic.vendorId);
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

    // total = every licence row in Convex (not a subset or expiring count)
    return {
      generatedAt,
      summary: {
        total: licenses.length,
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
  args: {},
  handler: async (ctx) => {
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
