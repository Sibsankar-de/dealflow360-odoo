import { Router } from "express";
import authRoutes from "./auth.routes";
import companyRoutes from "./company.routes";
import quotationRoutes from "./quotation.routes";

const router = Router();

// Versioned API routes
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/companies", companyRoutes);
router.use("/api/v1/quotations", quotationRoutes);

// Direct root route aliases
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/quotations", quotationRoutes);

export default router;
