import { UserResponseType } from "./auth";

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Negotiation"
  | "Confirmed";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface QuotationItemDetail {
  id: string;
  quotationId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  finalUnitPrice: number;
  lineTotal: number;
}

export interface QuotationRevisionItemDetail {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  finalUnitPrice: number;
  lineTotal: number;
}

export interface QuotationRevisionDetail {
  id: string;
  quotationId: string;
  revisionNo: number;
  revisionType: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  customerNote: string | null;
  internalNote: string | null;
  createdAt: string;
  creator?: UserResponseType;
  items?: QuotationRevisionItemDetail[];
}

export interface QuotationResponse {
  id: string;
  companyId: string;
  dealId: string;
  customerId: string;
  salesRepId: string;
  quotationNo: string;
  status: QuotationStatus;
  currency: string;
  validUntil: string | null;
  currentRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  items?: QuotationItemDetail[];
  currentRevision?: QuotationRevisionDetail;
  revisions?: QuotationRevisionDetail[];
  customer?: UserResponseType;
  salesRep?: UserResponseType;
}

export interface CreateQuotationItemRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
}

export interface CreateQuotationRequest {
  companyId: string;
  dealId: string;
  customerId: string;
  items: CreateQuotationItemRequest[];
  validUntil?: string | null;
  currency?: string;
  customerNote?: string | null;
  internalNote?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface UpdateQuotationRequest {
  customerId?: string;
  items?: CreateQuotationItemRequest[];
  validUntil?: string | null;
  currency?: string;
  customerNote?: string | null;
  internalNote?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface QuotationItem {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  currency: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt?: string;
  itemCount?: number;
}
