import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { subscriptionPricingController } from "../controllers/subscriptionPricing.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const viewRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
  CompanyUserRole.FINANCE_MANAGER,
];

router.use(verifyAuth);

// Create pricing config (ADMIN only)
router.post(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.create,
);
router.post(
  "/",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.create,
);

// List pricing configs
router.get(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(...viewRoles),
  subscriptionPricingController.list,
);
router.get(
  "/",
  verifyCompanyAccess,
  requireRole(...viewRoles),
  subscriptionPricingController.list,
);

// Get single pricing config
router.get(
  "/:companyId/:id",
  verifyCompanyAccess,
  requireRole(...viewRoles),
  subscriptionPricingController.getById,
);
router.get(
  "/:id",
  verifyCompanyAccess,
  requireRole(...viewRoles),
  subscriptionPricingController.getById,
);

// Update pricing config (ADMIN only)
router.patch(
  "/:companyId/:id",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.update,
);
router.patch(
  "/:id",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.update,
);

// Delete pricing config (ADMIN only)
router.delete(
  "/:companyId/:id",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.delete,
);
router.delete(
  "/:id",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  subscriptionPricingController.delete,
);

export default router;
