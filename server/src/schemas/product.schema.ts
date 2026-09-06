import { z } from "zod";
import { ProductType } from "@prisma/client";

export const stockEntrySchema = z.object({
  warehouseId: z.string().uuid(),
  stockQty: z.number().nonnegative(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive(),
  baseUnit: z.string().min(1).max(20).trim().default("UNIT").optional(),
  type: z.nativeEnum(ProductType).default(ProductType.ONE_TIME).optional(),
  stocks: z.array(stockEntrySchema).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  categoryIdList: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive().optional(),
  baseUnit: z.string().min(1).max(20).trim().optional(),
  type: z.nativeEnum(ProductType).optional(),
  stocks: z.array(stockEntrySchema).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  categoryIdList: z.array(z.string().uuid()).optional(),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  type: z.nativeEnum(ProductType).optional(),
  search: z.string().optional(),
});

export const upsertStockSchema = z.object({
  stockQty: z.number().nonnegative(),
});

export const addOrRemoveCategorySchema = z.object({
  categoryIdList: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
export type UpsertStockInput = z.infer<typeof upsertStockSchema>;
export type AddOrRemoveCategoryInput = z.infer<typeof addOrRemoveCategorySchema>;
