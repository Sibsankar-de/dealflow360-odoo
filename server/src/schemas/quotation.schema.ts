import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const createQuotationItemSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price must be greater than or equal to 0").optional(),
  discountPercentage: z
    .number()
    .min(0, "Discount percentage cannot be less than 0")
    .max(100, "Discount percentage cannot exceed 100")
    .default(0)
    .optional(),
  taxPercentage: z
    .number()
    .min(0, "Tax percentage cannot be less than 0")
    .max(100, "Tax percentage cannot exceed 100")
    .default(0)
    .optional(),
});

export const createQuotationSchema = z.object({
  companyId: z.string({ required_error: "Company ID is required" }).uuid("Invalid company ID"),
  customerId: z.string({ required_error: "Customer ID is required" }).uuid("Invalid customer ID"),
  items: z
    .array(createQuotationItemSchema, { required_error: "Items array is required" })
    .min(1, "Quotation must contain at least one item"),
  quotationDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string()).optional().nullable(),
  currency: z.string().min(2).max(10).trim().optional(),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
  discountAmount: z.number().nonnegative("Discount amount cannot be negative").default(0).optional(),
  status: z
    .nativeEnum(QuotationStatus)
    .refine(
      (val) => val === QuotationStatus.DRAFT || val === QuotationStatus.SENT,
      {
        message: `Status must be ${QuotationStatus.DRAFT} or ${QuotationStatus.SENT}`,
      },
    )
    .default(QuotationStatus.DRAFT)
    .optional(),
});

export const updateQuotationSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
  items: z.array(createQuotationItemSchema).min(1, "Quotation must contain at least one item").optional(),
  quotationDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string()).optional().nullable(),
  currency: z.string().min(2).max(10).trim().optional(),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
  discountAmount: z.number().nonnegative("Discount amount cannot be negative").optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
});

export const quotationFilterSchema = z.object({
  companyId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type CreateQuotationItemInput = z.infer<typeof createQuotationItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type QuotationFilterInput = z.infer<typeof quotationFilterSchema>;
