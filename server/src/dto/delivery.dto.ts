import { z } from "zod";
import {
  Delivery,
  DeliveryItem,
  DeliveryStatus,
  Product,
  SalesOrder,
  Backorder,
} from "@prisma/client";
import { deliveryFilterSchema } from "../schemas/delivery.schema";
import { BackorderResponseDto } from "./backorder.dto";

export type DeliveryFilterDto = z.infer<typeof deliveryFilterSchema>;

export interface DeliveryItemResponseDto {
  id: string;
  deliveryId: string;
  salesOrderItemId: string;
  productId: string;
  productName?: string;
  deliveredQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryResponseDto {
  id: string;
  companyId: string;
  deliveryNo: string;
  salesOrderId: string;
  orderNo?: string;
  backorderId?: string | null;
  status: DeliveryStatus;
  trackingNumber?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: DeliveryItemResponseDto[];
  createdBackorder?: BackorderResponseDto | null;
}

export const toDeliveryItemDto = (
  item: DeliveryItem & { product?: Product | null },
): DeliveryItemResponseDto => {
  return {
    id: item.id,
    deliveryId: item.deliveryId,
    salesOrderItemId: item.salesOrderItemId,
    productId: item.productId,
    productName: item.product?.name,
    deliveredQuantity: Number(item.deliveredQuantity),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toDeliveryDto = (
  delivery: Delivery & {
    items?: (DeliveryItem & { product?: Product | null })[];
    salesOrder?: SalesOrder | null;
    backorder?: Backorder | null;
  },
  createdBackorder?: BackorderResponseDto | null,
): DeliveryResponseDto => {
  return {
    id: delivery.id,
    companyId: delivery.companyId,
    deliveryNo: delivery.deliveryNo,
    salesOrderId: delivery.salesOrderId,
    orderNo: delivery.salesOrder?.orderNo,
    backorderId: delivery.backorderId,
    status: delivery.status,
    trackingNumber: delivery.trackingNumber,
    shippedAt: delivery.shippedAt,
    deliveredAt: delivery.deliveredAt,
    notes: delivery.notes,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
    items: delivery.items?.map(toDeliveryItemDto),
    createdBackorder: createdBackorder ?? null,
  };
};
