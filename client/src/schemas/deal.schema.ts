import { z } from "zod";

export const CreateDealSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  name: z.string().min(1, "Deal name is required"),
  expectedValue: z.number().min(0, "Expected value must be positive").default(0),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export const UpdateDealSchema = z.object({
  customerId: z.string().optional(),
  salesRepId: z.string().optional(),
  name: z.string().min(1, "Deal name is required").optional(),
  stage: z
    .enum([
      "NEW",
      "QUALIFICATION",
      "REQUIREMENT",
      "QUOTATION",
      "NEGOTIATION",
      "WON",
      "LOST",
    ])
    .optional(),
  status: z.enum(["OPEN", "WON", "LOST", "CANCELLED"]).optional(),
  expectedValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
