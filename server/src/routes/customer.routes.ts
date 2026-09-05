import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { customerController } from "../controllers/customer.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

router.use(verifyAuth);
router.use("/:companyId", verifyCompanyAccess);

router.get(
  "/:companyId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  customerController.list,
);

router.get(
  "/:companyId/search",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  customerController.search,
);

router.get(
  "/:companyId/:customerId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  customerController.getById,
);

export default router;
