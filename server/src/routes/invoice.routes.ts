import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { invoiceController } from "../controllers/invoice.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const financeRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.FINANCE_MANAGER,
  CompanyUserRole.SALES_MANAGER,
];

router.use(verifyAuth);

// Invoice summary / KPI metrics
router.get(
  "/:companyId/summary",
  verifyCompanyAccess,
  invoiceController.getSummary,
);
router.get(
  "/summary",
  verifyCompanyAccess,
  invoiceController.getSummary,
);

// Create invoice within company context
router.post(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(...financeRoles),
  invoiceController.create,
);
router.post(
  "/",
  verifyCompanyAccess,
  requireRole(...financeRoles),
  invoiceController.create,
);

// List invoices within company context
router.get(
  "/:companyId",
  verifyCompanyAccess,
  invoiceController.list,
);
router.get(
  "/",
  verifyCompanyAccess,
  invoiceController.list,
);

// Invoice details
router.get(
  "/:companyId/:id",
  verifyCompanyAccess,
  invoiceController.getById,
);
router.get(
  "/:id",
  verifyCompanyAccess,
  invoiceController.getById,
);

// Record invoice payment
router.post(
  "/:companyId/:id/pay",
  verifyCompanyAccess,
  requireRole(...financeRoles, CompanyUserRole.CUSTOMER),
  invoiceController.pay,
);
router.post(
  "/:id/pay",
  verifyCompanyAccess,
  requireRole(...financeRoles, CompanyUserRole.CUSTOMER),
  invoiceController.pay,
);

export default router;
