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
  productType: string;
  requiredQty: number;
  weight: string;
}

export interface ProductWarehouseStock {
  warehouseId: string;
  warehouseName: string;
  location: string;
  availableQty: number;
  allocatedQty: number;
  remainingQty: number;
  id?: string;
  name?: string;
}

export type WarehouseAllocation = ProductWarehouseStock;

export interface ItemFulfillmentPlan {
  productId: string;
  productName: string;
  productType?: string;
  requiredQty: number;
  allocatedQty: number;
  backorderQty: number;
  warehouses: ProductWarehouseStock[];
}

export interface RecommendedFulfillmentPlan {
  mode: "Suggested" | "Manual Override";
  currency: string;
  items: ItemFulfillmentPlan[];
  totalRequired: number;
  totalAllocated: number;
  totalBackordered: number;
  shipmentsCount: number;
  primaryWarehouseId?: string;
  // Optional backward-compatibility fields
  productId?: string;
  productName?: string;
  targetQty?: number;
  warehouses?: WarehouseAllocation[];
  estShippingCost?: number;
}

export interface FulfillmentOrderDetail extends FulfillmentOrder {
  quotationRef: string;
  items: FulfillmentOrderItem[];
  fulfillmentPlan: RecommendedFulfillmentPlan;
}
