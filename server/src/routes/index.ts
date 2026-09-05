import { Router } from "express";
import authRoutes from "./auth.routes";
import companyRoutes from "./company.routes";

const router = Router();

router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/companies", companyRoutes);

export default router;
