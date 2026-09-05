import { Router } from "express";
import { CompanyUserRole } from "@prisma/client";
import { companyController } from "../controllers/company.controller";
import { customerController } from "../controllers/customer.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

// All company routes are protected by auth
router.use(verifyAuth);

router.post("/", companyController.create);
router.get("/", companyController.list);

// Routes scoped to a specific company ID
router.get("/:id", verifyCompanyAccess, companyController.getById);
router.get(
  "/:id/roles",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  companyController.listCompanyRoles,
);
router.patch(
  "/:id",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  companyController.update,
);

// Company settings
router.get("/:id/settings", verifyCompanyAccess, companyController.getSettings);
router.patch(
  "/:id/settings",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  companyController.updateSettings,
);

// Company members management
router.get("/:id/users", verifyCompanyAccess, companyController.listMembers);
router.get(
  "/:id/customers",
  verifyCompanyAccess,
  requireRole(
    CompanyUserRole.ADMIN,
    CompanyUserRole.SALES_REP,
    CompanyUserRole.SALES_MANAGER,
    CompanyUserRole.FINANCE_MANAGER,
  ),
  customerController.list,
);
router.post(
  "/:id/users",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  companyController.addMember,
);
router.patch(
  "/:id/users",
  verifyCompanyAccess,
  requireRole(CompanyUserRole.ADMIN),
  companyController.updateMemberRole,
);
router.delete(
  "/:id/users/:userId",
  verifyCompanyAccess,
  companyController.removeMember,
);

export default router;
