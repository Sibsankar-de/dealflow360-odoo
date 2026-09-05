import { z } from "zod";
import { QuotationStatus, DiscountType } from "@prisma/client";

export const addQuotationItemSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .uuid("Invalid product ID"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive("Quantity must be greater than 0"),
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

export const createQuotationSchema = z.object({
  companyId: z.string().uuid("Invalid company ID").optional(),
  dealId: z
    .string({ required_error: "Deal ID is required" })
    .uuid("Invalid deal ID"),
  customerId: z
    .string({ required_error: "Customer ID is required" })
    .uuid("Invalid customer ID"),
  salesRepId: z.string().uuid("Invalid sales rep ID").optional(),
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

export const negotiationItemSchema = z.object({
  quotationItemId: z.string().uuid("Invalid quotation item ID").optional(),
  productId: z.string().uuid("Invalid product ID").optional(),
  requestedQuantity: z
    .number()
    .positive("Quantity must be greater than 0")
    .optional(),
  requestedUnitPrice: z
    .number()
    .nonnegative("Unit price cannot be negative")
    .optional(),
  requestedDiscountType: z
    .nativeEnum(DiscountType)
    .default(DiscountType.PERCENTAGE)
    .optional(),
  requestedDiscountValue: z
    .number()
    .nonnegative("Discount value cannot be negative")
    .default(0)
    .optional(),
});

export const submitNegotiationSchema = z.object({
  message: z
    .string()
    .max(2000, "Message cannot exceed 2000 characters")
    .optional()
    .nullable(),
  items: z.array(negotiationItemSchema).optional(),
});

export const dealQuotationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  search: z.string().optional(),
});

export const acceptQuotationSchema = z.object({
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
});

export const approveNegotiationSchema = z.object({
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
});

export const rejectNegotiationSchema = z.object({
  reason: z
    .string()
    .max(1000, "Reason cannot exceed 1000 characters")
    .optional(),
});

export const fulfillQuotationItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  quantity: z.number().positive("Quantity must be greater than 0").optional(),
});

export const fulfillQuotationSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  items: z.array(fulfillQuotationItemSchema).optional(),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
  trackingNumber: z
    .string()
    .max(255, "Tracking number cannot exceed 255 characters")
    .optional(),
  paymentTerms: z
    .string()
    .max(100, "Payment terms cannot exceed 100 characters")
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
export type DealQuotationsQueryInput = z.infer<typeof dealQuotationsQuerySchema>;
export type NegotiationItemInput = z.infer<typeof negotiationItemSchema>;
export type SubmitNegotiationInput = z.infer<typeof submitNegotiationSchema>;
export type AcceptQuotationInput = z.infer<typeof acceptQuotationSchema>;
export type ApproveNegotiationInput = z.infer<typeof approveNegotiationSchema>;
export type RejectNegotiationInput = z.infer<typeof rejectNegotiationSchema>;
export type FulfillQuotationInput = z.infer<typeof fulfillQuotationSchema>;
