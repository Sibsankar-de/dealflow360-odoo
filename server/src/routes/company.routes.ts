import { Router } from "express";
import { companyController } from "../controllers/company.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// All company routes are protected
router.use(verifyAuth);

router.post("/", companyController.create);
router.get("/", companyController.getUserCompanies);
router.get("/:id", companyController.getById);
router.patch("/:id", companyController.update);
router.put("/:id", companyController.update);

// Company members management
router.get("/:id/users", companyController.listMembers);
router.post("/:id/users", companyController.addMember);
router.patch("/:id/users", companyController.updateMemberRole);
router.put("/:id/users", companyController.updateMemberRole);
router.delete("/:id/users/:userId", companyController.removeMember);

export default router;
