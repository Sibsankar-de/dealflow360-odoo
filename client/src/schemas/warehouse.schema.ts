import { z } from "zod";

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  addressLine: z.string().min(1, "Address line is required"),
});

export const UpdateWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").optional(),
  country: z.string().min(1, "Country is required").optional(),
  postalCode: z.string().min(1, "Postal code is required").optional(),
  addressLine: z.string().min(1, "Address line is required").optional(),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;
