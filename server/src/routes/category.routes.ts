import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { categoryController } from "../controllers/category.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router({ mergeParams: true });

router.use(verifyAuth);
router.use(verifyCompanyAccess);

router.get(
  "/",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  categoryController.list,
);

router.post(
  "/",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.create,
);

router.get(
  "/:categoryId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  categoryController.getById,
);

router.patch(
  "/:categoryId",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.update,
);

router.delete(
  "/:categoryId",
  requireRole(CompanyUserRole.ADMIN),
  categoryController.delete,
);

export default router;
