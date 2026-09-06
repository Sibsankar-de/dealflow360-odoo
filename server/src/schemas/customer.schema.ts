import { z } from "zod";
import { CustomerTier } from "@prisma/client";

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  search: z.string().trim().optional(),
  customerTier: z.nativeEnum(CustomerTier).optional(),
});

export const createCustomerSchema = z.object({
  userEmail: z
    .string({ required_error: "User email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  customerTier: z.nativeEnum(CustomerTier).default(CustomerTier.BRONZE).optional(),
});

export type CustomerListQueryInput = z.infer<typeof customerListQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
