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

export interface NegotiationOfferItemDetail {
  id: string;
  negotiationOfferId: string;
  quotationItemId: string | null;
  productId: string;
  productName?: string;
  requestedQuantity: number;
  requestedUnitPrice: number;
  requestedDiscountType: DiscountType;
  requestedDiscountValue: number;
  requestedLineTotal: number;
}

export interface NegotiationOfferDetail {
  id: string;
  negotiationId: string;
  baseRevisionId: string | null;
  offeredBy: "CUSTOMER" | "SALES";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "SUPERSEDED";
  message: string | null;
  createdAt: string;
  items?: NegotiationOfferItemDetail[];
}

export interface NegotiationDetail {
  id: string;
  quotationId: string;
  status: "OPEN" | "CLOSED";
  startedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  offers?: NegotiationOfferDetail[];
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
  negotiations?: NegotiationDetail[];
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

export interface PaginatedQuotationsResponse {
  docs: QuotationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
