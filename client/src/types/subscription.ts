export type SubscriptionType = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type CustomerTier = "BRONZE" | "SILVER" | "GOLD";

export interface SubscriptionPricingResponseType {
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
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPricingRequest {
  productId: string;
  subscriptionType: SubscriptionType;
  customerTier?: CustomerTier | null;
  price: number;
  minQuantity?: number;
  currency?: string;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface UpdateSubscriptionPricingRequest {
  subscriptionType?: SubscriptionType;
  customerTier?: CustomerTier | null;
  price?: number;
  minQuantity?: number;
  currency?: string;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface SubscriptionItemResponseType {
  id: string;
  subscriptionId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPeriodResponseType {
  id: string;
  subscriptionId: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  subscriptionType: SubscriptionType;
  totalAmount: number;
  subscriptionPricingId?: string | null;
  itemsSnapshot?: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
  }> | null;
  renewedById?: string | null;
  renewedByName?: string | null;
  renewedAt: string;
  notes?: string | null;
}

export interface SubscriptionResponseType {
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
  startDate: string;
  endDate: string;
  nextRenewalDate: string;
  currency: string;
  totalRecurringAmount: number;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SubscriptionItemResponseType[];
  periods?: SubscriptionPeriodResponseType[];
}

export interface SubscriptionSummaryResponseType {
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

export interface PaginatedSubscriptionsResponse {
  docs: SubscriptionResponseType[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedSubscriptionPricingResponse {
  docs: SubscriptionPricingResponseType[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListSubscriptionsQuery {
  customerId?: string;
  salesOrderId?: string;
  quotationId?: string;
  status?: SubscriptionStatus;
  subscriptionType?: SubscriptionType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListCustomerSubscriptionsQuery {
  status?: SubscriptionStatus;
  subscriptionType?: SubscriptionType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RenewSubscriptionRequest {
  subscriptionType?: SubscriptionType;
  notes?: string;
}

export interface CancelSubscriptionRequest {
  cancellationReason?: string;
}
