import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { quotationController } from "../controllers/quotation.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

// All quotation routes require authentication
router.use(verifyAuth);

router.post(
  "/",
  verifyCompanyAccess,
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
  ),
  quotationController.create,
);

router.get("/", quotationController.list);
router.get("/:id", quotationController.getById);
router.get("/:id/items", quotationController.getItems);
router.post("/:id/items", quotationController.addItem);
router.delete("/:id/items/:itemId", quotationController.removeItem);
router.get("/:id/revisions", quotationController.getRevisions);
router.patch("/:id", quotationController.update);
router.post("/:id/send", quotationController.send);
router.patch("/:id/send", quotationController.send);
router.patch("/:id/status", quotationController.updateStatus);
router.post("/:id/cancel", quotationController.cancel);
router.patch("/:id/cancel", quotationController.cancel);
router.post("/:id/reject", quotationController.reject);
router.patch("/:id/reject", quotationController.reject);

export default router;
