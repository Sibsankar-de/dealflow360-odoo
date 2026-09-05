import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { backorderController } from "../controllers/backorder.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

const fulfillmentRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.FINANCE_MANAGER,
  CompanyUserRole.SALES_MANAGER,
];

router.use(verifyAuth);

router.get(
  "/",
  verifyCompanyAccess,
  backorderController.list,
);

router.get(
  "/:id",
  verifyCompanyAccess,
  backorderController.getById,
);

router.post(
  "/:id/deliver",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  backorderController.fulfill,
);

export default router;
