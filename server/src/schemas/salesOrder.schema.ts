import { z } from "zod";
import { SalesOrderStatus } from "@prisma/client";

export const createSalesOrderItemSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .uuid("Invalid product ID"),
  orderedQuantity: z
    .number({ required_error: "Ordered quantity is required" })
    .positive("Ordered quantity must be greater than 0"),
  unitPrice: z
    .number()
    .nonnegative("Unit price must be non-negative")
    .optional(),
  discount: z
    .number()
    .nonnegative("Discount must be non-negative")
    .default(0)
    .optional(),
  taxRate: z
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100")
    .default(0)
    .optional(),
});

export const createSalesOrderSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  salesRepId: z.string().uuid("Invalid sales rep ID").optional(),
  currency: z.string().min(2).max(10).trim().default("USD").optional(),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),
  items: z.array(createSalesOrderItemSchema).optional(),
});

export const salesOrderFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  status: z.nativeEnum(SalesOrderStatus).optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  search: z.string().trim().optional(),
});

export const deliverOrderItemSchema = z.object({
  salesOrderItemId: z
    .string({ required_error: "Sales order item ID is required" })
    .uuid("Invalid sales order item ID"),
  deliveredQuantity: z
    .number({ required_error: "Delivered quantity is required" })
    .positive("Delivered quantity must be greater than 0"),
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
});

export const deliverOrderSchema = z.object({
  backorderId: z.string().uuid("Invalid backorder ID").optional(),
  trackingNumber: z.string().trim().optional(),
  notes: z.string().max(1000).optional(),
  expectedDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string())
    .optional()
    .nullable(),
  items: z
    .array(deliverOrderItemSchema)
    .min(1, "At least one item must be specified for delivery"),
});
