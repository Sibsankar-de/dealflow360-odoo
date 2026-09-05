import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { categoryController } from "../controllers/category.controller";
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
  categoryController.list,
);

router.post(
  "/:companyId",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.create,
);

router.get(
  "/:companyId/:categoryId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  categoryController.getById,
);

router.patch(
  "/:companyId/:categoryId",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.update,
);

router.delete(
  "/:companyId/:categoryId",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.delete,
);

export default router;
