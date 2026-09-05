export type FulfillmentStatus =
  | "Ready to Fulfill"
  | "Partially Fulfilled"
  | "Fulfilled"
  | "Backordered";

export interface FulfillmentKPI {
  readyToFulfillCount: number;
  partiallyFulfilledCount: number;
  backorderedCount: number;
  completedCount: number;
}

export interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemsCount: number;
  totalQty: number;
  qtyUnit: string;
  warehousesCount: number;
  shipmentsCount: number;
  status: FulfillmentStatus;
  requiredBy: string;
  isUrgentDate?: boolean;
}

export interface FulfillmentOrderItem {
  id: string;
  productName: string;
  productType: "Hardware" | "Service" | "Software";
  requiredQty: number;
  weight: string;
}

export interface WarehouseAllocation {
  id: string;
  name: string;
  location: string;
  availableQty: number;
  allocatedQty: number;
  remainingQty: number;
  shippingEstimate: number;
  currencySymbol?: string;
}

export interface RecommendedFulfillmentPlan {
  productId: string;
  productName: string;
  targetQty: number;
  mode: "Suggested" | "Manual Override";
  warehouses: WarehouseAllocation[];
  totalRequired: number;
  totalAllocated: number;
  shipmentsCount: number;
  estShippingCost: number;
}

export interface FulfillmentOrderDetail extends FulfillmentOrder {
  quotationRef: string;
  items: FulfillmentOrderItem[];
  fulfillmentPlan: RecommendedFulfillmentPlan;
}
