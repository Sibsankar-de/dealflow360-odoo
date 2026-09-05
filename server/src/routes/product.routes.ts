import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { productController } from "../controllers/product.controller";
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
  productController.list,
);

router.post(
  "/",
  requireRole(CompanyUserRole.ADMIN),
  productController.create,
);

router.get(
  "/:productId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  productController.getById,
);

router.patch(
  "/:productId",
  requireRole(CompanyUserRole.ADMIN),
  productController.update,
);

router.delete(
  "/:productId",
  requireRole(CompanyUserRole.ADMIN),
  productController.delete,
);

router.put(
  "/:productId/stock/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  productController.upsertStock,
);

router.delete(
  "/:productId/stock/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  productController.deleteStock,
);

export default router;
