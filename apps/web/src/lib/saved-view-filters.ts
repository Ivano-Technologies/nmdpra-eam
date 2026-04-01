import type { MvpReportRow, MvpReportSummary, RiskRankingRow } from "@/types/api";
import type { SavedViewFilter } from "@/types/user-preferences";

function rowMatchesExpiryBand(
  expiryStatus: string,
  band: string | undefined
): boolean {
  if (!band) {
    return true;
  }
  return expiryStatus === band;
}

function riskMatchesExpiryBand(row: RiskRankingRow, band: string): boolean {
  const d = row.daysToExpiry;
  switch (band) {
    case "EXPIRED":
      return d < 0;
    case "CRITICAL":
      return d >= 0 && d <= 30;
    case "WARNING":
      return d >= 31 && d <= 60;
    case "SAFE":
      return d > 60;
    default:
      return true;
  }
}

export function filterMvpRows(
  rows: MvpReportRow[],
  f: SavedViewFilter
): MvpReportRow[] {
  const q = f.vendorQuery?.trim().toLowerCase();
  return rows.filter((r) => {
    if (!rowMatchesExpiryBand(r.expiryStatus, f.expiryStatus)) {
      return false;
    }
    if (q && !r.vendor.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

/** Recompute MVP summary for client-filtered rows. */
export function summarizeMvpRows(rows: MvpReportRow[]): MvpReportSummary {
  let expired = 0;
  let critical = 0;
  let warning = 0;
  let safe = 0;
  for (const r of rows) {
    switch (r.expiryStatus) {
      case "EXPIRED":
        expired += 1;
        break;
      case "CRITICAL":
        critical += 1;
        break;
      case "WARNING":
        warning += 1;
        break;
      case "SAFE":
        safe += 1;
        break;
      default:
        break;
    }
  }
  const expiringIn30Days = rows.filter(
    (r) => r.daysToExpiry >= 0 && r.daysToExpiry <= 30
  ).length;
  return {
    total: rows.length,
    expired,
    critical,
    warning,
    safe,
    expiringIn30Days
  };
}

export function filterRiskRows(
  rows: RiskRankingRow[],
  f: SavedViewFilter
): RiskRankingRow[] {
  const q = f.vendorQuery?.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.expiryStatus && !riskMatchesExpiryBand(r, f.expiryStatus)) {
      return false;
    }
    if (q && !r.vendorName.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}
