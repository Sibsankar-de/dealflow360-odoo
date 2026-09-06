import { z } from "zod";
import { CustomerTier, SubscriptionType } from "@prisma/client";

export const createSubscriptionPricingSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  subscriptionType: z.nativeEnum(SubscriptionType),
  customerTier: z.nativeEnum(CustomerTier).nullable().optional(),
  price: z.number().positive("Price must be greater than 0"),
  minQuantity: z.number().positive("Minimum quantity must be at least 1").default(1).optional(),
  currency: z.string().min(1).max(10).default("USD").optional(),
  isActive: z.boolean().default(true).optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

export const updateSubscriptionPricingSchema = z.object({
  subscriptionType: z.nativeEnum(SubscriptionType).optional(),
  customerTier: z.nativeEnum(CustomerTier).nullable().optional(),
  price: z.number().positive("Price must be greater than 0").optional(),
  minQuantity: z.number().positive("Minimum quantity must be at least 1").optional(),
  currency: z.string().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

export const subscriptionPricingFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  subscriptionType: z.nativeEnum(SubscriptionType).optional(),
  customerTier: z.nativeEnum(CustomerTier).optional(),
  isActive: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSubscriptionPricingInput = z.infer<
  typeof createSubscriptionPricingSchema
>;
export type UpdateSubscriptionPricingInput = z.infer<
  typeof updateSubscriptionPricingSchema
>;
export type SubscriptionPricingFilterInput = z.infer<
  typeof subscriptionPricingFilterSchema
>;
