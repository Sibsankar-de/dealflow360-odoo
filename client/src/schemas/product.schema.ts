import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  baseUnit: z.string().default("Unit"),
  type: z.enum(["ONE_TIME", "RECURRING"]).default("ONE_TIME"),
  stocks: z
    .array(
      z.object({
        warehouseId: z.string().min(1, "Warehouse is required"),
        stockQty: z.number().min(0, "Stock quantity cannot be negative"),
      })
    )
    .optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be greater than or equal to 0").optional(),
  baseUnit: z.string().optional(),
  type: z.enum(["ONE_TIME", "RECURRING"]).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
