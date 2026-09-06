import { z } from "zod";
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Product,
  User,
  SalesOrder,
  Delivery,
} from "@prisma/client";
import {
  createInvoiceSchema,
  recordInvoicePaymentSchema,
  invoiceFilterSchema,
} from "../schemas/invoice.schema";

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type RecordInvoicePaymentDto = z.infer<typeof recordInvoicePaymentSchema>;
export type InvoiceFilterDto = z.infer<typeof invoiceFilterSchema>;

export interface InvoiceItemResponseDto {
  id: string;
  invoiceId: string;
  salesOrderItemId: string;
  productId: string;
  productName?: string;
  deliveredQuantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceSummaryResponseDto {
  totalCount: number;
  paidCount: number;
  partiallyPaidCount: number;
  postedCount: number;
  cancelledCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface InvoiceResponseDto {
  id: string;
  companyId: string;
  invoiceNo: string;
  salesOrderId: string;
  orderNo?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  deliveryId?: string | null;
  deliveryNo?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  currency: string;
  paymentTerms?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: InvoiceItemResponseDto[];
}

export const toInvoiceItemDto = (
  item: InvoiceItem & { product?: Product | null },
): InvoiceItemResponseDto => {
  return {
    id: item.id,
    invoiceId: item.invoiceId,
    salesOrderItemId: item.salesOrderItemId,
    productId: item.productId,
    productName: item.product?.name,
    deliveredQuantity: Number(item.deliveredQuantity),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    tax: Number(item.tax),
    lineTotal: Number(item.lineTotal),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toInvoiceDto = (
  invoice: Invoice & {
    items?: (InvoiceItem & { product?: Product | null })[];
    customer?: User | null;
    salesOrder?: SalesOrder | null;
    delivery?: Delivery | null;
  },
): InvoiceResponseDto => {
  return {
    id: invoice.id,
    companyId: invoice.companyId,
    invoiceNo: invoice.invoiceNo,
    salesOrderId: invoice.salesOrderId,
    orderNo: invoice.salesOrder?.orderNo,
    customerId: invoice.customerId,
    customerName: invoice.customer?.userName,
    customerEmail: invoice.customer?.email,
    deliveryId: invoice.deliveryId,
    deliveryNo: invoice.delivery?.deliveryNo,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    currency: invoice.currency,
    paymentTerms: invoice.paymentTerms,
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    remainingAmount: Number(invoice.remainingAmount),
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    items: invoice.items?.map(toInvoiceItemDto),
  };
};
