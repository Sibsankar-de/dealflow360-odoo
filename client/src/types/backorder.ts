export type BackorderStatus =
  | "PENDING"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";

export interface BackorderItemResponse {
  id: string;
  backorderId: string;
  salesOrderItemId: string;
  productId: string;
  productName?: string;
  orderedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackorderDeliveryItem {
  id: string;
  deliveryId: string;
  productId: string;
  deliveredQuantity: number;
}

export interface BackorderDelivery {
  id: string;
  deliveryNo: string;
  status: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  items?: BackorderDeliveryItem[];
}

export interface BackorderResponse {
  id: string;
  companyId: string;
  backorderNo: string;
  salesOrderId: string;
  orderNo?: string;
  parentBackorderId?: string | null;
  parentBackorderNo?: string;
  status: BackorderStatus;
  expectedDate?: string | null;
  totalQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: BackorderItemResponse[];
  childBackorders?: BackorderResponse[];
  deliveries?: BackorderDelivery[];
  deliveriesCount?: number;
}

export interface BackorderSummaryResponse {
  totalCount: number;
  pendingCount: number;
  partiallyFulfilledCount: number;
  fulfilledCount: number;
  cancelledCount: number;
  totalQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
}

export interface ListBackordersQuery {
  page?: number;
  limit?: number;
  salesOrderId?: string;
  status?: BackorderStatus;
  search?: string;
}

export interface FulfillBackorderPayload {
  trackingNumber?: string;
  notes?: string;
  expectedDate?: string;
  items: Array<{
    salesOrderItemId: string;
    deliveredQuantity: number;
  }>;
}
