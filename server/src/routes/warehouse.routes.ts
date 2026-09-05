import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { warehouseController } from "../controllers/warehouse.controller";
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
  warehouseController.list,
);

router.post(
  "/:companyId",
  requireRole(CompanyUserRole.ADMIN),
  warehouseController.create,
);

router.get(
  "/:companyId/:warehouseId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  warehouseController.getById,
);

router.patch(
  "/:companyId/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  warehouseController.update,
);

router.delete(
  "/:companyId/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  warehouseController.delete,
);

export default router;
