import { z } from "zod";
import { QuotationStatus, DiscountType } from "@prisma/client";

export const addQuotationItemSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID").optional(),
    product_id: z.string().uuid("Invalid product ID").optional(),
    quantity: z
      .number({ required_error: "Quantity is required" })
      .positive("Quantity must be greater than 0"),
  })
  .refine((data) => data.productId || data.product_id, {
    message: "Product ID is required",
    path: ["productId"],
  });

export const createQuotationItemSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .uuid("Invalid product ID"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than 0"),
  unitPrice: z
    .number()
    .nonnegative("Unit price must be greater than or equal to 0")
    .optional(),
  discountType: z
    .nativeEnum(DiscountType)
    .default(DiscountType.PERCENTAGE)
    .optional(),
  discountValue: z
    .number()
    .min(0, "Discount value cannot be less than 0")
    .default(0)
    .optional(),
  taxRate: z
    .number()
    .min(0, "Tax rate cannot be less than 0")
    .max(100, "Tax rate cannot exceed 100")
    .default(0)
    .optional(),
});

export const createQuotationSchema = z
  .object({
    companyId: z.string().uuid("Invalid company ID").optional(),
    company_id: z.string().uuid("Invalid company ID").optional(),
    dealId: z.string().uuid("Invalid deal ID").optional(),
    deal_id: z.string().uuid("Invalid deal ID").optional(),
    customerId: z.string().uuid("Invalid customer ID").optional(),
    customer_id: z.string().uuid("Invalid customer ID").optional(),
    salesRepId: z.string().uuid("Invalid sales rep ID").optional(),
    sales_rep_id: z.string().uuid("Invalid sales rep ID").optional(),
    validUntil: z
      .string()
      .datetime({ offset: true })
      .or(z.string())
      .optional()
      .nullable(),
    valid_until: z
      .string()
      .datetime({ offset: true })
      .or(z.string())
      .optional()
      .nullable(),
    currency: z.string().min(2).max(10).trim().optional(),
    customerNote: z
      .string()
      .max(2000, "Customer note cannot exceed 2000 characters")
      .optional()
      .nullable(),
    customer_note: z
      .string()
      .max(2000, "Customer note cannot exceed 2000 characters")
      .optional()
      .nullable(),
    internalNote: z
      .string()
      .max(2000, "Internal note cannot exceed 2000 characters")
      .optional()
      .nullable(),
    internal_note: z
      .string()
      .max(2000, "Internal note cannot exceed 2000 characters")
      .optional()
      .nullable(),
    items: z.array(createQuotationItemSchema).optional(),
    discountAmount: z
      .number()
      .nonnegative("Discount amount cannot be negative")
      .optional(),
  })
  .refine((data) => data.dealId || data.deal_id, {
    message: "Deal ID is required",
    path: ["dealId"],
  })
  .refine((data) => data.customerId || data.customer_id, {
    message: "Customer ID is required",
    path: ["customerId"],
  });


export const updateQuotationSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
  items: z
    .array(createQuotationItemSchema)
    .min(1, "Quotation must contain at least one item")
    .optional(),
  validUntil: z
    .string()
    .datetime({ offset: true })
    .or(z.string())
    .optional()
    .nullable(),
  currency: z.string().min(2).max(10).trim().optional(),
  customerNote: z
    .string()
    .max(2000, "Customer note cannot exceed 2000 characters")
    .optional()
    .nullable(),
  internalNote: z
    .string()
    .max(2000, "Internal note cannot exceed 2000 characters")
    .optional()
    .nullable(),
  discountAmount: z
    .number()
    .nonnegative("Discount amount cannot be negative")
    .optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
});

export const quotationFilterSchema = z.object({
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export const cancelQuotationSchema = z.object({
  reason: z
    .string()
    .max(1000, "Reason cannot exceed 1000 characters")
    .optional(),
});

export const rejectQuotationSchema = z.object({
  reason: z
    .string()
    .max(1000, "Reason cannot exceed 1000 characters")
    .optional(),
});

export type AddQuotationItemInput = z.infer<typeof addQuotationItemSchema>;
export type CreateQuotationItemInput = z.infer<
  typeof createQuotationItemSchema
>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type QuotationFilterInput = z.infer<typeof quotationFilterSchema>;
export type CancelQuotationInput = z.infer<typeof cancelQuotationSchema>;
export type RejectQuotationInput = z.infer<typeof rejectQuotationSchema>;
