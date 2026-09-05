import { z } from "zod";
import { DeliveryStatus } from "@prisma/client";

export const deliveryFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  salesOrderId: z.string().uuid("Invalid sales order ID").optional(),
  status: z.nativeEnum(DeliveryStatus).optional(),
  search: z.string().trim().optional(),
});
