import { Router } from "express";
import authRoutes from "./auth.routes";
import companyRoutes from "./company.routes";
import dealRoutes from "./deal.routes";
import quotationRoutes from "./quotation.routes";
import warehouseRoutes from "./warehouse.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";

const router = Router();

// Versioned API routes
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/companies", companyRoutes);
router.use("/api/v1/deals", dealRoutes);
router.use("/api/v1/quotations", quotationRoutes);
router.use("/api/v1/companies/:companyId/warehouses", warehouseRoutes);
router.use("/api/v1/companies/:companyId/products", productRoutes);
router.use("/api/v1/companies/:companyId/categories", categoryRoutes);
router.use("/api/v1/categories", categoryRoutes);

// Direct root route aliases
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/deals", dealRoutes);
router.use("/quotations", quotationRoutes);
router.use("/categories", categoryRoutes);

export default router;
