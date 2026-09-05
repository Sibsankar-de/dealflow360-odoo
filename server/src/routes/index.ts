import { Router } from "express";
import authRoutes from "./auth.routes";
import companyRoutes from "./company.routes";
import dealRoutes from "./deal.routes";
import quotationRoutes from "./quotation.routes";
import warehouseRoutes from "./warehouse.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";
import customerRoutes from "./customer.routes";
import salesOrderRoutes from "./salesOrder.routes";
import deliveryRoutes from "./delivery.routes";
import backorderRoutes from "./backorder.routes";
import invoiceRoutes from "./invoice.routes";

const router = Router();

// Versioned API routes
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/companies", companyRoutes);
router.use("/api/v1/deals", dealRoutes);
router.use("/api/v1/quotations", quotationRoutes);
router.use("/api/v1/warehouses", warehouseRoutes);
router.use("/api/v1/products", productRoutes);
router.use("/api/v1/categories", categoryRoutes);
router.use("/api/v1/customers", customerRoutes);
router.use("/api/v1/sales-orders", salesOrderRoutes);
router.use("/api/v1/deliveries", deliveryRoutes);
router.use("/api/v1/backorders", backorderRoutes);
router.use("/api/v1/invoices", invoiceRoutes);

export default router;
