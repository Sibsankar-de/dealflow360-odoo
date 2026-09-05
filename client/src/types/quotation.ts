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

export type NegotiationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface NegotiationItemDetail {
  id: string;
  negotiationId: string;
  quotationItemId: string | null;
  productId: string;
  productName?: string;
  requestedQuantity: number;
  requestedUnitPrice: number;
  requestedDiscountType: DiscountType;
  requestedDiscountValue: number;
  requestedLineTotal: number;
}

export interface NegotiationDetail {
  id: string;
  quotationId: string;
  status: NegotiationStatus;
  message: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  requiredRole: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items?: NegotiationItemDetail[];
}

export interface DiscountViolationEvaluation {
  maxLineViolation: number;
  blendedViolationScore: number;
  riskLevel: "LOW" | "MID" | "HIGH";
  requiredApprovalRole: "SALES_MANAGER" | "FINANCE_MANAGER" | null;
  lineItems?: Array<{
    productId: string;
    actualDiscountPercentage: number;
    allowedDiscountPercentage: number;
    violationScore: number;
  }>;
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
  discountEvaluation?: DiscountViolationEvaluation;
  customer?: UserResponseType;
  salesRep?: UserResponseType;
  company?: {
    id: string;
    name: string;
  };
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
  companyId?: string;
  dealId: string;
  customerId: string;
  items?: CreateQuotationItemRequest[];
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
}

export interface SubmitNegotiationItemPayload {
  quotationItemId?: string;
  productId?: string;
  requestedQuantity?: number;
  requestedUnitPrice?: number;
  requestedDiscountType?: DiscountType;
  requestedDiscountValue?: number;
}

export interface SubmitNegotiationPayload {
  message?: string;
  items?: SubmitNegotiationItemPayload[];
}

export interface ApproveNegotiationPayload {
  notes?: string;
}

export interface RejectNegotiationPayload {
  reason?: string;
}

export interface FulfillQuotationPayload {
  warehouseId?: string;
  items?: Array<{
    productId: string;
    warehouseId?: string;
    quantity?: number;
  }>;
  notes?: string;
  trackingNumber?: string;
  paymentTerms?: string;
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
