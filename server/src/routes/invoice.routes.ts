import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { invoiceController } from "../controllers/invoice.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

const financeRoles = [
  CompanyUserRole.ADMIN,
  CompanyUserRole.FINANCE_MANAGER,
  CompanyUserRole.SALES_MANAGER,
];

router.use(verifyAuth);

router.post(
  "/",
  verifyCompanyAccess,
  requireRole(...financeRoles),
  invoiceController.create,
);

router.get(
  "/",
  verifyCompanyAccess,
  invoiceController.list,
);

router.get(
  "/:id",
  verifyCompanyAccess,
  invoiceController.getById,
);

router.post(
  "/:id/pay",
  verifyCompanyAccess,
  requireRole(...financeRoles),
  invoiceController.pay,
);

export default router;
