import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { subscriptionController } from "../controllers/subscription.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const staffRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
  CompanyUserRole.FINANCE_MANAGER,
];

const managementRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_MANAGER,
  CompanyUserRole.FINANCE_MANAGER,
];

router.use(verifyAuth);

// Customer portal subscription endpoints (scoped to authenticated user as customer)
router.get("/customer", subscriptionController.listCustomerSubscriptions);
router.get("/customer/:companyId", subscriptionController.listCustomerSubscriptions);
router.get(
  "/customer/:companyId/:id",
  subscriptionController.getCustomerSubscriptionById,
);
router.post(
  "/customer/:companyId/:id/renew",
  subscriptionController.customerRenew,
);
router.post(
  "/customer/:companyId/:id/cancel",
  subscriptionController.customerCancel,
);

// Subscription summary / KPI metrics (company context)
router.get(
  "/:companyId/summary",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getSummary,
);
router.get(
  "/summary",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getSummary,
);

// List subscriptions in company context
router.get(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.list,
);
router.get(
  "/",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.list,
);

// Subscription details in company context
router.get(
  "/:companyId/:id",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getById,
);
router.get(
  "/:id",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getById,
);

// Subscription period / renewal history
router.get(
  "/:companyId/:id/history",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getHistory,
);
router.get(
  "/:id/history",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.getHistory,
);

// Renew subscription within company context
router.post(
  "/:companyId/:id/renew",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.renew,
);
router.post(
  "/:id/renew",
  verifyCompanyAccess,
  requireRole(...staffRoles),
  subscriptionController.renew,
);

// Cancel subscription within company context
router.post(
  "/:companyId/:id/cancel",
  verifyCompanyAccess,
  requireRole(...managementRoles),
  subscriptionController.cancel,
);
router.post(
  "/:id/cancel",
  verifyCompanyAccess,
  requireRole(...managementRoles),
  subscriptionController.cancel,
);

export default router;
