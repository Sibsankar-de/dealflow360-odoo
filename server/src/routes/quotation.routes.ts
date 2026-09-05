import { Router } from "express";
import { quotationController } from "../controllers/quotation.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// All quotation routes require authentication
router.use(verifyAuth);

router.post("/", quotationController.create);
router.get("/", quotationController.list);
router.get("/:id", quotationController.getById);
router.patch("/:id", quotationController.update);
router.patch("/:id/status", quotationController.updateStatus);

export default router;
