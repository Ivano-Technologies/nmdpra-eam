import { Router } from "express";

import {
  exportLicensesCsv,
  getExpiringLicensesController,
  getLicenseOverview,
  getRiskRankingController
} from "../controllers/licenseController";
import { getMvpPdf, postMvpEmail } from "../controllers/reportController";

const router = Router();

router.get("/licenses/overview", getLicenseOverview);
router.get("/licenses/expiring", getExpiringLicensesController);
router.get("/licenses/risk-ranking", getRiskRankingController);
router.get("/licenses/export.csv", exportLicensesCsv);
router.get("/reports/mvp.pdf", getMvpPdf);
router.post("/reports/mvp/email", postMvpEmail);

export { router as apiRouter };
