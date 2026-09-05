import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { dealController } from "../controllers/deal.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

const salesRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
];

// All deal routes require authentication and a company context.
router.use(verifyAuth);
router.use(verifyCompanyAccess);

// List deals within the company.
router.get("/", requireRole(...salesRoles), dealController.list);

// Create a new deal.
router.post("/", requireRole(...salesRoles), dealController.create);

// Read a single deal.
router.get("/:id", requireRole(...salesRoles), dealController.getById);

// Update deal fields.
router.patch("/:id", requireRole(...salesRoles), dealController.update);
router.put("/:id", requireRole(...salesRoles), dealController.update);

export default router;
