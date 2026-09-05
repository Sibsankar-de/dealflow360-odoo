import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { productController } from "../controllers/product.controller";
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
  productController.list,
);

router.post(
  "/:companyId",
  requireRole(CompanyUserRole.ADMIN),
  productController.create,
);

router.get(
  "/:companyId/search",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  productController.search,
);

router.get(
  "/:companyId/:productId",
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  productController.getById,
);

router.patch(
  "/:companyId/:productId",
  requireRole(CompanyUserRole.ADMIN),
  productController.update,
);

router.delete(
  "/:companyId/:productId",
  requireRole(CompanyUserRole.ADMIN),
  productController.delete,
);

router.put(
  "/:companyId/:productId/stock/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  productController.upsertStock,
);

router.delete(
  "/:companyId/:productId/stock/:warehouseId",
  requireRole(CompanyUserRole.ADMIN),
  productController.deleteStock,
);

router.put(
  "/:companyId/:productId/categories",
  requireRole(CompanyUserRole.ADMIN),
  productController.addOrRemoveCategories,
);

router.patch(
  "/:companyId/:productId/categories",
  requireRole(CompanyUserRole.ADMIN),
  productController.addOrRemoveCategories,
);

router.post(
  "/:companyId/:productId/categories",
  requireRole(CompanyUserRole.ADMIN),
  productController.addOrRemoveCategories,
);

export default router;
