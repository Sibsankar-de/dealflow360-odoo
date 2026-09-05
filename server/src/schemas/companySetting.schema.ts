import { z } from "zod";
import { CustomerTier } from "@prisma/client";

export const customerDiscountTierMapSchema = z.object({
  [CustomerTier.BRONZE]: z.number().min(0).max(100).optional(),
  [CustomerTier.SILVER]: z.number().min(0).max(100).optional(),
  [CustomerTier.GOLD]: z.number().min(0).max(100).optional(),
});

export const updateCompanySettingSchema = z.object({
  customerDiscountTier: customerDiscountTierMapSchema.optional(),
});

export type CustomerDiscountTierMap = z.infer<typeof customerDiscountTierMapSchema>;
export type UpdateCompanySettingInput = z.infer<typeof updateCompanySettingSchema>;
