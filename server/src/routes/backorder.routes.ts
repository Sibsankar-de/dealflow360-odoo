import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { backorderController } from "../controllers/backorder.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const fulfillmentRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.FINANCE_MANAGER,
  CompanyUserRole.SALES_MANAGER,
];

router.use(verifyAuth);

// Backorder summary / KPI metrics
router.get(
  "/:companyId/summary",
  verifyCompanyAccess,
  backorderController.getSummary,
);
router.get(
  "/summary",
  verifyCompanyAccess,
  backorderController.getSummary,
);

// List backorders within company context
router.get(
  "/:companyId",
  verifyCompanyAccess,
  backorderController.list,
);
router.get(
  "/",
  verifyCompanyAccess,
  backorderController.list,
);

// Backorder details
router.get(
  "/:companyId/:id",
  verifyCompanyAccess,
  backorderController.getById,
);
router.get(
  "/:id",
  verifyCompanyAccess,
  backorderController.getById,
);

// Fulfill backorder
router.post(
  "/:companyId/:id/fulfill",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  backorderController.fulfill,
);
router.post(
  "/:companyId/:id/deliver",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  backorderController.fulfill,
);
router.post(
  "/:id/fulfill",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  backorderController.fulfill,
);
router.post(
  "/:id/deliver",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  backorderController.fulfill,
);

export default router;
