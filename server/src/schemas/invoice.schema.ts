import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const createInvoiceItemInputSchema = z.object({
  salesOrderItemId: z
    .string({ required_error: "Sales order item ID is required" })
    .uuid("Invalid sales order item ID"),
  deliveredQuantity: z
    .number({ required_error: "Delivered quantity is required" })
    .positive("Delivered quantity must be greater than 0"),
});

export const createInvoiceSchema = z
  .object({
    salesOrderId: z.string().uuid("Invalid sales order ID").optional(),
    deliveryId: z.string().uuid("Invalid delivery ID").optional(),
    paymentTerms: z.string().max(100).optional(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string())
      .optional()
      .nullable(),
    notes: z.string().max(2000).optional(),
    items: z.array(createInvoiceItemInputSchema).optional(),
  })
  .refine(
    (data) => Boolean(data.salesOrderId || data.deliveryId),
    {
      message: "Either salesOrderId or deliveryId must be provided",
      path: ["salesOrderId"],
    },
  );

export const recordInvoicePaymentSchema = z.object({
  amount: z
    .number({ required_error: "Payment amount is required" })
    .positive("Payment amount must be greater than 0"),
  notes: z.string().max(1000).optional(),
});

export const invoiceFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  salesOrderId: z.string().uuid("Invalid sales order ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  search: z.string().trim().optional(),
});
