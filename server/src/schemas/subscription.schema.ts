import { z } from "zod";
import { SubscriptionStatus, SubscriptionType } from "@prisma/client";

export const subscriptionFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  subscriptionType: z.nativeEnum(SubscriptionType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const customerSubscriptionFilterSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  subscriptionType: z.nativeEnum(SubscriptionType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const renewSubscriptionSchema = z.object({
  subscriptionType: z.nativeEnum(SubscriptionType).optional(),
  notes: z.string().max(1000).optional(),
});

export const cancelSubscriptionSchema = z.object({
  cancellationReason: z.string().max(1000).optional(),
});

export type SubscriptionFilterInput = z.infer<typeof subscriptionFilterSchema>;
export type CustomerSubscriptionFilterInput = z.infer<
  typeof customerSubscriptionFilterSchema
>;
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
