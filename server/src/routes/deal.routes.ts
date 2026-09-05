import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { dealController } from "../controllers/deal.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const salesRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
];

// All deal routes require authentication.
router.use(verifyAuth);

// Customer deal listing routes (scoped by authenticated user as customerId)
router.get("/customer", dealController.listCustomerDeals);
router.get("/customer/:companyId", dealController.listCustomerDeals);
router.get("/customer/:companyId/:id", dealController.getCustomerDealById);
router.get(
  "/customer/:companyId/:dealId/quotations",
  dealController.listCustomerDealQuotations,
);

// Company-scoped deal management routes
router.use("/:companyId", verifyCompanyAccess);

// List deals within the company.
router.get("/:companyId", requireRole(...salesRoles), dealController.list);

// Create a new deal.
router.post("/:companyId", requireRole(...salesRoles), dealController.create);

// Read a single deal.
router.get("/:companyId/:id", requireRole(...salesRoles), dealController.getById);

// Update deal fields.
router.patch("/:companyId/:id", requireRole(...salesRoles), dealController.update);

// List quotations for a deal.
router.get(
  "/:companyId/:id/quotations",
  requireRole(...salesRoles),
  dealController.listQuotations,
);

export default router;
