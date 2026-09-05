import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  country: z.string().min(1).max(100).trim(),
  postalCode: z.string().min(1).max(20).trim(),
  addressLine: z.string().min(1).max(255).trim(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const warehouseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type WarehouseListQueryInput = z.infer<typeof warehouseListQuerySchema>;
