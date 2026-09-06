export type InvoiceStatus =
  | "DRAFT"
  | "POSTED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "VOID";

export interface InvoiceItemResponse {
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
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceResponse {
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
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  currency: string;
  paymentTerms?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItemResponse[];
}

export interface InvoiceSummaryResponse {
  totalCount: number;
  paidCount: number;
  partiallyPaidCount: number;
  postedCount: number;
  cancelledCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface ListInvoicesQuery {
  page?: number;
  limit?: number;
  salesOrderId?: string;
  customerId?: string;
  status?: InvoiceStatus;
  search?: string;
}

export interface RecordInvoicePaymentPayload {
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface CreateInvoicePayload {
  salesOrderId?: string;
  deliveryId?: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  items?: Array<{
    salesOrderItemId: string;
    deliveredQuantity: number;
  }>;
}
