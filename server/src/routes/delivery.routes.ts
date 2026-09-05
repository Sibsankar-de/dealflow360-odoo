import { Router } from "express";
import { deliveryController } from "../controllers/delivery.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import { verifyCompanyAccess } from "../middlewares/company.middleware";

const router = Router();

router.use(verifyAuth);

router.get(
  "/",
  verifyCompanyAccess,
  deliveryController.list,
);

router.get(
  "/:id",
  verifyCompanyAccess,
  deliveryController.getById,
);

export default router;
