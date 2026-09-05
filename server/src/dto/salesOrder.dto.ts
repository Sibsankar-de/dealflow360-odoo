import { z } from "zod";
import {
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
  Product,
  User,
  Quotation,
  Delivery,
  Backorder,
  Invoice,
} from "@prisma/client";
import {
  createSalesOrderSchema,
  salesOrderFilterSchema,
  deliverOrderSchema,
} from "../schemas/salesOrder.schema";

export type CreateSalesOrderDto = z.infer<typeof createSalesOrderSchema>;
export type SalesOrderFilterDto = z.infer<typeof salesOrderFilterSchema>;
export type DeliverOrderDto = z.infer<typeof deliverOrderSchema>;

export interface SalesOrderItemResponseDto {
  id: string;
  salesOrderId: string;
  productId: string;
  productName?: string;
  quotationItemId?: string | null;
  orderedQuantity: number;
  deliveredQuantity: number;
  invoicedQuantity: number;
  remainingQuantity: number;
  remainingToInvoice: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  finalUnitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderResponseDto {
  id: string;
  companyId: string;
  orderNo: string;
  quotationId?: string | null;
  quotationNo?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  salesRepId?: string | null;
  salesRepName?: string;
  status: SalesOrderStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: SalesOrderItemResponseDto[];
  deliveriesCount?: number;
  invoicesCount?: number;
  backordersCount?: number;
}

export const toSalesOrderItemDto = (
  item: SalesOrderItem & { product?: Product | null },
): SalesOrderItemResponseDto => {
  const ordered = Number(item.orderedQuantity);
  const delivered = Number(item.deliveredQuantity);
  const invoiced = Number(item.invoicedQuantity);

  return {
    id: item.id,
    salesOrderId: item.salesOrderId,
    productId: item.productId,
    productName: item.product?.name,
    quotationItemId: item.quotationItemId,
    orderedQuantity: ordered,
    deliveredQuantity: delivered,
    invoicedQuantity: invoiced,
    remainingQuantity: Math.max(0, ordered - delivered),
    remainingToInvoice: Math.max(0, delivered - invoiced),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    taxRate: Number(item.taxRate),
    finalUnitPrice: Number(item.finalUnitPrice),
    lineTotal: Number(item.lineTotal),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toSalesOrderDto = (
  order: SalesOrder & {
    items?: (SalesOrderItem & { product?: Product | null })[];
    quotation?: Quotation | null;
    customer?: User | null;
    salesRep?: User | null;
    deliveries?: Delivery[];
    invoices?: Invoice[];
    backorders?: Backorder[];
  },
): SalesOrderResponseDto => {
  return {
    id: order.id,
    companyId: order.companyId,
    orderNo: order.orderNo,
    quotationId: order.quotationId,
    quotationNo: order.quotation?.quotationNo,
    customerId: order.customerId,
    customerName: order.customer?.userName,
    customerEmail: order.customer?.email,
    salesRepId: order.salesRepId,
    salesRepName: order.salesRep?.userName,
    status: order.status,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items?.map(toSalesOrderItemDto),
    deliveriesCount: order.deliveries?.length,
    invoicesCount: order.invoices?.length,
    backordersCount: order.backorders?.length,
  };
};
