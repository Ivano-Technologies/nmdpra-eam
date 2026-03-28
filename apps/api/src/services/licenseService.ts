import type { ExpiryStatus } from "@rmlis/shared";
import { formatIsoDateEnGb } from "@rmlis/shared";

import { convexApi } from "../convex/api";
import { getConvexHttpClient } from "../convex/httpClient";

type LicenseOverviewSnapshot = {
  message: string;
  generatedAt: string;
};

export type ExpiringLicense = {
  id: string;
  vendorName: string;
  licenseType: string;
  /** ISO date-only (YYYY-MM-DD) */
  issueDate: string;
  /** ISO date-only (YYYY-MM-DD) */
  expiryDate: string;
  issueDateEnGb: string;
  expiryDateEnGb: string;
  status: string;
  daysToExpiry: number;
  expiryStatus: ExpiryStatus;
  riskScore: number;
};

export type ExpiringLicensesResponse = {
  expired: ExpiringLicense[];
  critical: ExpiringLicense[];
  warning: ExpiringLicense[];
};

const mapBucket = (rows: unknown[]): ExpiringLicense[] => {
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const issueDate = String(r.issueDate);
    const expiryDate = String(r.expiryDate);
    return {
      id: String(r.id),
      vendorName: String(r.vendorName ?? "Unknown vendor"),
      licenseType: String(r.licenseType),
      issueDate,
      expiryDate,
      issueDateEnGb: formatIsoDateEnGb(issueDate),
      expiryDateEnGb: formatIsoDateEnGb(expiryDate),
      status: String(r.status),
      daysToExpiry: Number(r.daysToExpiry),
      expiryStatus: r.expiryStatus as ExpiryStatus,
      riskScore: Number(r.riskScore)
    };
  });
};

export const getOverviewSnapshot = async (): Promise<LicenseOverviewSnapshot> => {
  return {
    message: "License overview (Convex-backed data available via /api/licenses/expiring)",
    generatedAt: new Date().toISOString()
  };
};

export const getExpiringLicenses = async (): Promise<ExpiringLicensesResponse> => {
  const client = getConvexHttpClient();
  const data = await client.query(convexApi.licenses.expiringBuckets, {});
  return {
    expired: mapBucket((data as { expired: unknown[] }).expired),
    critical: mapBucket((data as { critical: unknown[] }).critical),
    warning: mapBucket((data as { warning: unknown[] }).warning)
  };
};

export type CsvRow = {
  vendorName: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  riskScore: number;
  daysToExpiry: number;
  expiryStatus: string;
};

export const getLicensesCsvRows = async (): Promise<CsvRow[]> => {
  const client = getConvexHttpClient();
  const rows = await client.query(convexApi.licenses.listAllForCsv, {});
  return (rows as CsvRow[]).map((r) => ({
    vendorName: r.vendorName,
    licenseType: r.licenseType,
    issueDate: r.issueDate,
    expiryDate: r.expiryDate,
    status: r.status,
    riskScore: r.riskScore,
    daysToExpiry: r.daysToExpiry,
    expiryStatus: String(r.expiryStatus)
  }));
};

export type MvpReportPayload = {
  generatedAt: string;
  summary: {
    total: number;
    expired: number;
    critical: number;
    warning: number;
    safe: number;
    expiringIn30Days: number;
  };
  rows: Array<{
    vendor: string;
    licenseType: string;
    expiryDate: string;
    status: string;
    expiryStatus: string;
    daysToExpiry: number;
  }>;
  topRiskVendors: Array<{
    vendorName: string;
    riskScore: number;
  }>;
};

export const getMvpReportData = async (): Promise<MvpReportPayload> => {
  const client = getConvexHttpClient();
  return (await client.query(convexApi.licenses.mvpReportData, {})) as MvpReportPayload;
};

export type RiskRankingRow = {
  vendorName: string;
  licenseType: string;
  /** ISO date-only (YYYY-MM-DD) */
  expiryDate: string;
  expiryDateEnGb: string;
  riskScore: number;
  daysToExpiry: number;
};

export const getRiskRanking = async (): Promise<RiskRankingRow[]> => {
  const client = getConvexHttpClient();
  const rows = (await client.query(convexApi.licenses.riskRanking, {})) as Array<
    Omit<RiskRankingRow, "expiryDateEnGb">
  >;
  return rows.map((r) => ({
    ...r,
    expiryDateEnGb: formatIsoDateEnGb(r.expiryDate)
  }));
};
