import { z } from "zod";
import { DealStage, DealStatus } from "@prisma/client";

export const createDealSchema = z.object({
  customerId: z
    .string({ required_error: "Customer ID is required" })
    .uuid("Invalid customer ID"),
  salesRepId: z.string().uuid("Invalid sales rep ID").optional(),
  name: z
    .string({ required_error: "Deal name is required" })
    .min(1, "Deal name cannot be empty")
    .max(255, "Deal name cannot exceed 255 characters")
    .trim(),
  expectedValue: z
    .number()
    .nonnegative("Expected value cannot be negative")
    .default(0),
  probability: z
    .number()
    .min(0, "Probability cannot be less than 0")
    .max(100, "Probability cannot exceed 100")
    .default(0),
  expectedCloseDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string())
    .optional()
    .nullable(),
  source: z
    .string()
    .max(255, "Source cannot exceed 255 characters")
    .optional()
    .nullable(),
});

export const updateDealSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
  salesRepId: z.string().uuid("Invalid sales rep ID").optional(),
  name: z
    .string()
    .min(1, "Deal name cannot be empty")
    .max(255, "Deal name cannot exceed 255 characters")
    .trim()
    .optional(),
  stage: z.nativeEnum(DealStage).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  expectedValue: z
    .number()
    .nonnegative("Expected value cannot be negative")
    .optional(),
  probability: z
    .number()
    .min(0, "Probability cannot be less than 0")
    .max(100, "Probability cannot exceed 100")
    .optional(),
  expectedCloseDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string())
    .optional()
    .nullable(),
  source: z
    .string()
    .max(255, "Source cannot exceed 255 characters")
    .optional()
    .nullable(),
});

export const dealFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;
