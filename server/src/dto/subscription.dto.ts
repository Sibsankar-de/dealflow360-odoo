import { z } from "zod";
import {
  Subscription,
  SubscriptionItem,
  SubscriptionPeriod,
  SubscriptionStatus,
  SubscriptionType,
  Product,
  User,
  SalesOrder,
  Quotation,
  SubscriptionPricing,
} from "@prisma/client";
import {
  subscriptionFilterSchema,
  customerSubscriptionFilterSchema,
  renewSubscriptionSchema,
  cancelSubscriptionSchema,
} from "../schemas/subscription.schema";

export type SubscriptionFilterDto = z.infer<typeof subscriptionFilterSchema>;
export type CustomerSubscriptionFilterDto = z.infer<
  typeof customerSubscriptionFilterSchema
>;
export type RenewSubscriptionDto = z.infer<typeof renewSubscriptionSchema>;
export type CancelSubscriptionDto = z.infer<typeof cancelSubscriptionSchema>;

export interface SubscriptionItemResponseDto {
  id: string;
  subscriptionId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPeriodResponseDto {
  id: string;
  subscriptionId: string;
  periodNumber: number;
  startDate: Date;
  endDate: Date;
  subscriptionType: SubscriptionType;
  totalAmount: number;
  subscriptionPricingId?: string | null;
  itemsSnapshot?: unknown;
  renewedById?: string | null;
  renewedByName?: string | null;
  renewedAt: Date;
  notes?: string | null;
}

export interface SubscriptionSummaryResponseDto {
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  cancelledCount: number;
  monthlyCount: number;
  quarterlyCount: number;
  yearlyCount: number;
  totalMonthlyRecurringRevenue: number;
  totalAnnualRecurringRevenue: number;
}

export interface SubscriptionResponseDto {
  id: string;
  companyId: string;
  subscriptionNo: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  salesOrderId?: string | null;
  orderNo?: string | null;
  quotationId?: string | null;
  quotationNo?: string | null;
  subscriptionPricingId?: string | null;
  subscriptionType: SubscriptionType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  nextRenewalDate: Date;
  currency: string;
  totalRecurringAmount: number;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: SubscriptionItemResponseDto[];
  periods?: SubscriptionPeriodResponseDto[];
}

export const toSubscriptionItemDto = (
  item: SubscriptionItem & { product?: Product | null },
): SubscriptionItemResponseDto => {
  return {
    id: item.id,
    subscriptionId: item.subscriptionId,
    productId: item.productId,
    productName: item.product?.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    lineTotal: Number(item.lineTotal),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toSubscriptionPeriodDto = (
  period: SubscriptionPeriod & {
    renewedBy?: User | null;
    subscriptionPricing?: SubscriptionPricing | null;
  },
): SubscriptionPeriodResponseDto => {
  return {
    id: period.id,
    subscriptionId: period.subscriptionId,
    periodNumber: period.periodNumber,
    startDate: period.startDate,
    endDate: period.endDate,
    subscriptionType: period.subscriptionType,
    totalAmount: Number(period.totalAmount),
    subscriptionPricingId: period.subscriptionPricingId,
    itemsSnapshot: period.itemsSnapshot,
    renewedById: period.renewedById,
    renewedByName: period.renewedBy?.userName,
    renewedAt: period.renewedAt,
    notes: period.notes,
  };
};

export const toSubscriptionDto = (
  sub: Subscription & {
    items?: (SubscriptionItem & { product?: Product | null })[];
    periods?: (SubscriptionPeriod & { renewedBy?: User | null })[];
    customer?: User | null;
    salesOrder?: SalesOrder | null;
    quotation?: Quotation | null;
    subscriptionPricing?: SubscriptionPricing | null;
  },
): SubscriptionResponseDto => {
  return {
    id: sub.id,
    companyId: sub.companyId,
    subscriptionNo: sub.subscriptionNo,
    customerId: sub.customerId,
    customerName: sub.customer?.userName,
    customerEmail: sub.customer?.email,
    salesOrderId: sub.salesOrderId,
    orderNo: sub.salesOrder?.orderNo,
    quotationId: sub.quotationId,
    quotationNo: sub.quotation?.quotationNo,
    subscriptionPricingId: sub.subscriptionPricingId,
    subscriptionType: sub.subscriptionType,
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    nextRenewalDate: sub.nextRenewalDate,
    currency: sub.currency,
    totalRecurringAmount: Number(sub.totalRecurringAmount),
    cancelledAt: sub.cancelledAt,
    cancellationReason: sub.cancellationReason,
    notes: sub.notes,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
    items: sub.items?.map(toSubscriptionItemDto),
    periods: sub.periods?.map(toSubscriptionPeriodDto),
  };
};
