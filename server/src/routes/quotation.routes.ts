import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { quotationController } from "../controllers/quotation.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

const salesRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
];

// All routes require authentication.
router.use(verifyAuth);

// Create quotation within company context.
router.post(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.create,
);

// List quotations within company context.
router.get("/:companyId", quotationController.list);

// List quotations by deal.
router.get("/:companyId/deal/:dealId", quotationController.listByDeal);

// Quotation details and revisions.
router.get("/:companyId/:id", quotationController.getById);
router.get("/:companyId/:id/items", quotationController.getItems);
router.get("/:companyId/:id/revisions", quotationController.getRevisions);

// Item management.
router.post(
  "/:companyId/:id/items",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.addItem,
);
router.delete(
  "/:companyId/:id/items/:itemId",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.removeItem,
);

// Update quotation fields.
router.patch(
  "/:companyId/:id",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.update,
);

// Send quotation to customer.
router.post(
  "/:companyId/:id/send",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.send,
);

// Customer status updates (accept, reject, negotiate).
router.patch("/:companyId/:id/status", quotationController.updateStatus);

// Cancel quotation.
router.post(
  "/:companyId/:id/cancel",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.cancel,
);

// Customer rejection.
router.post("/:companyId/:id/reject", quotationController.reject);

// Customer counter-offer and negotiation.
router.post("/:companyId/:id/counter-offer", quotationController.counterOffer);
router.post("/:companyId/:id/negotiate", quotationController.counterOffer);

// Negotiation history.
router.get("/:companyId/:id/negotiations", quotationController.getNegotiations);

// Approve quotation or negotiation counter-offer.
router.post(
  "/:companyId/:id/approve",
  verifyCompanyAccess,
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  quotationController.approve,
);

// Fulfill quotation: warehouse stock deduction, delivery, invoice, and backorder creation.
router.post(
  "/:companyId/:id/fulfill",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN, CompanyUserRole.FINANCE_MANAGER),
  quotationController.fulfill,
);

// Discount violation evaluation.
router.get(
  "/:companyId/:id/discount-evaluation",
  quotationController.getDiscountEvaluation,
);

export default router;