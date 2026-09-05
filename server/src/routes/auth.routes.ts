import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);

// Protected routes
router.post("/logout", verifyAuth, authController.logout);
router.get("/profile", verifyAuth, authController.getCurrentUser);
router.patch("/profile", verifyAuth, authController.updateProfile);
router.post("/update-password", verifyAuth, authController.updatePassword);

export default router;
