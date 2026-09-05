import { z } from "zod";
import {
  Backorder,
  BackorderItem,
  BackorderStatus,
  Product,
  SalesOrder,
  Delivery,
} from "@prisma/client";
import {
  backorderFilterSchema,
  fulfillBackorderSchema,
} from "../schemas/backorder.schema";

export type BackorderFilterDto = z.infer<typeof backorderFilterSchema>;
export type FulfillBackorderDto = z.infer<typeof fulfillBackorderSchema>;

export interface BackorderItemResponseDto {
  id: string;
  backorderId: string;
  salesOrderItemId: string;
  productId: string;
  productName?: string;
  orderedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackorderResponseDto {
  id: string;
  companyId: string;
  backorderNo: string;
  salesOrderId: string;
  orderNo?: string;
  parentBackorderId?: string | null;
  parentBackorderNo?: string;
  status: BackorderStatus;
  expectedDate?: Date | null;
  totalQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: BackorderItemResponseDto[];
  childBackorders?: BackorderResponseDto[];
  deliveriesCount?: number;
}

export const toBackorderItemDto = (
  item: BackorderItem & { product?: Product | null },
): BackorderItemResponseDto => {
  return {
    id: item.id,
    backorderId: item.backorderId,
    salesOrderItemId: item.salesOrderItemId,
    productId: item.productId,
    productName: item.product?.name,
    orderedQuantity: Number(item.orderedQuantity),
    fulfilledQuantity: Number(item.fulfilledQuantity),
    remainingQuantity: Number(item.remainingQuantity),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toBackorderDto = (
  backorder: Backorder & {
    items?: (BackorderItem & { product?: Product | null })[];
    salesOrder?: SalesOrder | null;
    parentBackorder?: Backorder | null;
    childBackorders?: (Backorder & {
      items?: (BackorderItem & { product?: Product | null })[];
    })[];
    deliveries?: Delivery[];
  },
): BackorderResponseDto => {
  return {
    id: backorder.id,
    companyId: backorder.companyId,
    backorderNo: backorder.backorderNo,
    salesOrderId: backorder.salesOrderId,
    orderNo: backorder.salesOrder?.orderNo,
    parentBackorderId: backorder.parentBackorderId,
    parentBackorderNo: backorder.parentBackorder?.backorderNo,
    status: backorder.status,
    expectedDate: backorder.expectedDate,
    totalQuantity: Number(backorder.totalQuantity),
    fulfilledQuantity: Number(backorder.fulfilledQuantity),
    remainingQuantity: Number(backorder.remainingQuantity),
    notes: backorder.notes,
    createdAt: backorder.createdAt,
    updatedAt: backorder.updatedAt,
    items: backorder.items?.map(toBackorderItemDto),
    childBackorders: backorder.childBackorders?.map((cb) => toBackorderDto(cb)),
    deliveriesCount: backorder.deliveries?.length,
  };
};
