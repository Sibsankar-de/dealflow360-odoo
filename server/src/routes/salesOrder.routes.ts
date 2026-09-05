import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { salesOrderController } from "../controllers/salesOrder.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

const orderCreateRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.SALES_REP,
  CompanyUserRole.SALES_MANAGER,
];

const fulfillmentRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.FINANCE_MANAGER,
  CompanyUserRole.SALES_MANAGER,
];

router.use(verifyAuth);

router.post(
  "/",
  verifyCompanyAccess,
  requireRole(...orderCreateRoles),
  salesOrderController.create,
);

router.get(
  "/",
  verifyCompanyAccess,
  salesOrderController.list,
);

router.get(
  "/:id",
  verifyCompanyAccess,
  salesOrderController.getById,
);

router.post(
  "/:id/deliver",
  verifyCompanyAccess,
  requireRole(...fulfillmentRoles),
  salesOrderController.deliver,
);

export default router;
