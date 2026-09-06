import { z } from "zod";
import {
  SubscriptionPricing,
  Product,
  CustomerTier,
  SubscriptionType,
} from "@prisma/client";
import {
  createSubscriptionPricingSchema,
  updateSubscriptionPricingSchema,
  subscriptionPricingFilterSchema,
} from "../schemas/subscriptionPricing.schema";

export type CreateSubscriptionPricingDto = z.infer<
  typeof createSubscriptionPricingSchema
>;
export type UpdateSubscriptionPricingDto = z.infer<
  typeof updateSubscriptionPricingSchema
>;
export type SubscriptionPricingFilterDto = z.infer<
  typeof subscriptionPricingFilterSchema
>;

export interface SubscriptionPricingResponseDto {
  id: string;
  companyId: string;
  productId: string;
  productName?: string;
  subscriptionType: SubscriptionType;
  customerTier?: CustomerTier | null;
  price: number;
  minQuantity: number;
  currency: string;
  isActive: boolean;
  validFrom?: Date | null;
  validUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toSubscriptionPricingDto = (
  pricing: SubscriptionPricing & { product?: Product | null },
): SubscriptionPricingResponseDto => {
  return {
    id: pricing.id,
    companyId: pricing.companyId,
    productId: pricing.productId,
    productName: pricing.product?.name,
    subscriptionType: pricing.subscriptionType,
    customerTier: pricing.customerTier,
    price: Number(pricing.price),
    minQuantity: Number(pricing.minQuantity),
    currency: pricing.currency,
    isActive: pricing.isActive,
    validFrom: pricing.validFrom,
    validUntil: pricing.validUntil,
    createdAt: pricing.createdAt,
    updatedAt: pricing.updatedAt,
  };
};
