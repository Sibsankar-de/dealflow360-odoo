import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { quotationController } from "../controllers/quotation.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

const salesRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
];

// All routes require authentication.
router.use(verifyAuth);

// Company-member-only: create quotation.
router.post(
  "/",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.create,
);
router.post(
  "/:companyId",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.create,
);

// Open to any authenticated user (company members and customers both need to list/read).
router.get("/", quotationController.list);
router.get("/deal/:dealId", quotationController.listByDeal);
router.get("/:id", quotationController.getById);
router.get("/:id/items", quotationController.getItems);
router.get("/:id/revisions", quotationController.getRevisions);

// Company-member-only: item management.
router.post(
  "/:id/items",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.addItem,
);
router.delete(
  "/:id/items/:itemId",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.removeItem,
);

// Company-member-only: update quotation fields.
router.patch(
  "/:id",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.update,
);

// Company-member-only: send quotation to customer.
router.post(
  "/:id/send",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.send,
);
router.patch(
  "/:id/send",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.send,
);

// Customer-only: accept, reject, or initiate negotiation (service enforces customer identity).
router.patch("/:id/status", quotationController.updateStatus);

// Company-member-only: cancel quotation.
router.post(
  "/:id/cancel",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.cancel,
);
router.patch(
  "/:id/cancel",
  verifyCompanyAccess,
  requireRole(...salesRoles),
  quotationController.cancel,
);

// Customer-facing: reject quotation (customer declines).
router.post("/:id/reject", quotationController.reject);
router.patch("/:id/reject", quotationController.reject);

// Customer-facing: submit counter-offer / negotiation.
router.post("/:id/counter-offer", quotationController.counterOffer);
router.patch("/:id/counter-offer", quotationController.counterOffer);
router.post("/:id/negotiate", quotationController.counterOffer);
router.patch("/:id/negotiate", quotationController.counterOffer);

// Negotiation history and offers.
router.get("/:id/negotiations", quotationController.getNegotiations);
router.get("/:id/offers", quotationController.getNegotiations);

// Discount violation evaluation.
router.get("/:id/discount-evaluation", quotationController.getDiscountEvaluation);
router.get("/:id/evaluation", quotationController.getDiscountEvaluation);

export default router;
