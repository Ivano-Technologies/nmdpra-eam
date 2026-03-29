import type { Request, Response } from "express";

import { formatIsoDateEnGb } from "@rmlis/shared";

import {
  getExpiringLicenses,
  getLicensesCsvRows,
  getMvpReportData,
  getOverviewSnapshot,
  getRiskRanking
} from "../services/licenseService";

const escapeCsvCell = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const getLicenseOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getOverviewSnapshot();
    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Overview failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
  }
};

export const getExpiringLicensesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await getExpiringLicenses();
    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
  }
};

export const getRiskRankingController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getRiskRanking();
    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
  }
};

export const getMvpReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getMvpReportData();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
  }
};

export const exportLicensesCsv = async (_req: Request, res: Response): Promise<void> => {
  let rows;
  try {
    rows = await getLicensesCsvRows();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
    return;
  }
  const header = [
    "vendorName",
    "licenseType",
    "issueDate",
    "expiryDate",
    "status",
    "riskScore",
    "daysToExpiry",
    "expiryStatus"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.vendorName),
        escapeCsvCell(row.licenseType),
        escapeCsvCell(formatIsoDateEnGb(row.issueDate)),
        escapeCsvCell(formatIsoDateEnGb(row.expiryDate)),
        escapeCsvCell(row.status),
        escapeCsvCell(String(row.riskScore)),
        escapeCsvCell(String(row.daysToExpiry)),
        escapeCsvCell(row.expiryStatus)
      ].join(",")
    );
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="licenses.csv"');
  res.status(200).send(lines.join("\n"));
};
