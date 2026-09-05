import { z } from "zod";

export const customerDiscountTierMapSchema = z.object({
  BRONZE: z.number().min(0).max(100).optional(),
  SILVER: z.number().min(0).max(100).optional(),
  GOLD: z.number().min(0).max(100).optional(),
});

export const updateCompanySettingSchema = z.object({
  customerDiscountTier: customerDiscountTierMapSchema.optional(),
});

export type CustomerDiscountTierMap = z.infer<typeof customerDiscountTierMapSchema>;
export type UpdateCompanySettingInput = z.infer<typeof updateCompanySettingSchema>;
