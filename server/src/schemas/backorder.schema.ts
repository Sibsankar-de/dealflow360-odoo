import { z } from "zod";
import { BackorderStatus } from "@prisma/client";
import { deliverOrderItemSchema } from "./salesOrder.schema";

export const backorderFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  salesOrderId: z.string().uuid("Invalid sales order ID").optional(),
  status: z.nativeEnum(BackorderStatus).optional(),
  search: z.string().trim().optional(),
});

export const fulfillBackorderSchema = z.object({
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
    .min(1, "At least one item must be specified for backorder fulfillment"),
});
