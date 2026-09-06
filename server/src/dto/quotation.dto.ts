import { z } from "zod";
import {
  Quotation,
  QuotationItem,
  QuotationRevision,
  QuotationRevisionItem,
  QuotationStatus,
  DiscountType,
  RevisionType,
  RevisionStatus,
  Deal,
  DealStage,
  DealStatus,
  Negotiation,
  NegotiationItem,
  NegotiationStatus,
  Product,
  User,
  Company,
} from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";
import { SalesOrderResponseDto, toSalesOrderDto } from "./salesOrder.dto";
import { DeliveryResponseDto } from "./delivery.dto";
import { InvoiceResponseDto } from "./invoice.dto";
import { BackorderResponseDto } from "./backorder.dto";
import { DiscountViolationEvaluation } from "../utils/discount-violation.util";
import {
  addQuotationItemSchema,
  createQuotationItemSchema,
  createQuotationSchema,
  updateQuotationSchema,
  quotationFilterSchema,
  cancelQuotationSchema,
  rejectQuotationSchema,
  dealQuotationsQuerySchema,
  submitNegotiationSchema,
  acceptQuotationSchema,
  approveNegotiationSchema,
  rejectNegotiationSchema,
  fulfillQuotationSchema,
} from "../schemas/quotation.schema";

export type AddQuotationItemDto = z.infer<typeof addQuotationItemSchema>;
export type CreateQuotationItemDto = z.infer<typeof createQuotationItemSchema>;
export type CreateQuotationDto = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationDto = z.infer<typeof updateQuotationSchema>;
export type QuotationFilterDto = z.infer<typeof quotationFilterSchema>;
export type CancelQuotationDto = z.infer<typeof cancelQuotationSchema>;
export type RejectQuotationDto = z.infer<typeof rejectQuotationSchema>;
export type DealQuotationsQueryDto = z.infer<typeof dealQuotationsQuerySchema>;
export type SubmitNegotiationDto = z.infer<typeof submitNegotiationSchema>;
export type AcceptQuotationDto = z.infer<typeof acceptQuotationSchema>;
export type ApproveNegotiationDto = z.infer<typeof approveNegotiationSchema>;
export type RejectNegotiationDto = z.infer<typeof rejectNegotiationSchema>;
export type FulfillQuotationDto = z.infer<typeof fulfillQuotationSchema>;

export interface FulfillmentResultDto {
  quotation: QuotationResponseDto;
  salesOrder: SalesOrderResponseDto;
  delivery: DeliveryResponseDto | null;
  invoice: InvoiceResponseDto | null;
  backorder: BackorderResponseDto | null;
  deal?: DealResponseDto | null;
}

export interface QuotationItemResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationRevisionItemResponseDto {
  id: string;
  quotationRevisionId: string;
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

export interface QuotationRevisionResponseDto {
  id: string;
  quotationId: string;
  revisionNo: number;
  createdById: string;
  revisionType: RevisionType;
  status: RevisionStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  customerNote: string | null;
  internalNote: string | null;
  createdAt: Date;
  creator?: UserResponseDto;
  items?: QuotationRevisionItemResponseDto[];
}

export interface QuotationResponseDto {
  id: string;
  companyId: string;
  dealId: string;
  customerId: string;
  salesRepId: string;
  quotationNo: string;
  status: QuotationStatus;
  currency: string;
  validUntil: Date | null;
  currentRevisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  items?: QuotationItemResponseDto[];
  currentRevision?: QuotationRevisionResponseDto;
  revisions?: QuotationRevisionResponseDto[];
  deal?: DealResponseDto;
  salesRep?: UserResponseDto;
  customer?: UserResponseDto;
  company?: {
    id: string;
    name: string;
  };
  negotiations?: NegotiationResponseDto[];
  discountEvaluation?: DiscountViolationEvaluation;
  salesOrders?: SalesOrderResponseDto[];
}

export interface FulfillmentSummaryResponseDto {
  readyToFulfillCount: number;
  partiallyFulfilledCount: number;
  backorderedCount: number;
  completedCount: number;
}

export interface DealResponseDto {
  id: string;
  companyId: string;
  dealNo: string;
  customerId: string;
  salesRepId: string;
  name: string;
  stage: DealStage;
  status: DealStatus;
  expectedValue: number;
  probability: number;
  expectedCloseDate: Date | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: UserResponseDto;
  salesRep?: UserResponseDto;
  company?: {
    id: string;
    name: string;
  };
}

export interface NegotiationItemResponseDto {
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

export interface NegotiationResponseDto {
  id: string;
  quotationId: string;
  status: NegotiationStatus;
  message: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  requiredRole: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: NegotiationItemResponseDto[];
}

export const toQuotationItemDto = (
  item: QuotationItem & { product?: Product },
): QuotationItemResponseDto => {
  return {
    id: item.id,
    quotationId: item.quotationId,
    productId: item.productId,
    productName: item.product?.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discountType: item.discountType,
    discountValue: Number(item.discountValue),
    discountAmount: Number(item.discountAmount),
    taxRate: Number(item.taxRate),
    finalUnitPrice: Number(item.finalUnitPrice),
    lineTotal: Number(item.lineTotal),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toQuotationRevisionItemDto = (
  item: QuotationRevisionItem & { product?: Product },
): QuotationRevisionItemResponseDto => {
  return {
    id: item.id,
    quotationRevisionId: item.quotationRevisionId,
    productId: item.productId,
    productName: item.product?.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discountType: item.discountType,
    discountValue: Number(item.discountValue),
    discountAmount: Number(item.discountAmount),
    taxRate: Number(item.taxRate),
    finalUnitPrice: Number(item.finalUnitPrice),
    lineTotal: Number(item.lineTotal),
  };
};

export const toQuotationRevisionDto = (
  revision: QuotationRevision & {
    items?: (QuotationRevisionItem & { product?: Product })[];
    creator?: User;
  },
): QuotationRevisionResponseDto => {
  return {
    id: revision.id,
    quotationId: revision.quotationId,
    revisionNo: revision.revisionNo,
    createdById: revision.createdById,
    revisionType: revision.revisionType,
    status: revision.status,
    subtotal: Number(revision.subtotal),
    discountAmount: Number(revision.discountAmount),
    taxAmount: Number(revision.taxAmount),
    totalAmount: Number(revision.totalAmount),
    customerNote: revision.customerNote,
    internalNote: revision.internalNote,
    createdAt: revision.createdAt,
    creator: revision.creator ? toUserDto(revision.creator) : undefined,
    items: revision.items
      ? revision.items.map(toQuotationRevisionItemDto)
      : undefined,
  };
};

export const toDealDto = (
  deal: Deal & {
    customer?: User;
    salesRep?: User;
    company?: Company;
  },
): DealResponseDto => {
  return {
    id: deal.id,
    companyId: deal.companyId,
    dealNo: deal.dealNo,
    customerId: deal.customerId,
    salesRepId: deal.salesRepId,
    name: deal.name,
    stage: deal.stage,
    status: deal.status,
    expectedValue: Number(deal.expectedValue),
    probability: Number(deal.probability),
    expectedCloseDate: deal.expectedCloseDate,
    source: deal.source,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    customer: deal.customer ? toUserDto(deal.customer) : undefined,
    salesRep: deal.salesRep ? toUserDto(deal.salesRep) : undefined,
    company: deal.company
      ? {
          id: deal.company.id,
          name: deal.company.name,
        }
      : undefined,
  };
};

export const toNegotiationItemDto = (
  item: NegotiationItem & { product?: Product },
): NegotiationItemResponseDto => {
  return {
    id: item.id,
    negotiationId: item.negotiationId,
    quotationItemId: item.quotationItemId,
    productId: item.productId,
    productName: item.product?.name,
    requestedQuantity: Number(item.requestedQuantity),
    requestedUnitPrice: Number(item.requestedUnitPrice),
    requestedDiscountType: item.requestedDiscountType,
    requestedDiscountValue: Number(item.requestedDiscountValue),
    requestedLineTotal: Number(item.requestedLineTotal),
  };
};

export const toNegotiationDto = (
  negotiation: Negotiation & {
    items?: (NegotiationItem & { product?: Product })[];
  },
): NegotiationResponseDto => {
  return {
    id: negotiation.id,
    quotationId: negotiation.quotationId,
    status: negotiation.status,
    message: negotiation.message,
    riskScore: negotiation.riskScore !== null ? Number(negotiation.riskScore) : null,
    riskLevel: negotiation.riskLevel,
    requiredRole: negotiation.requiredRole,
    approvedBy: negotiation.approvedBy,
    approvedAt: negotiation.approvedAt,
    rejectedBy: negotiation.rejectedBy,
    rejectedAt: negotiation.rejectedAt,
    rejectionReason: negotiation.rejectionReason,
    createdAt: negotiation.createdAt,
    updatedAt: negotiation.updatedAt,
    items: negotiation.items
      ? negotiation.items.map(toNegotiationItemDto)
      : undefined,
  };
};

export const toQuotationDto = (
  quotation: Quotation & {
    items?: (QuotationItem & { product?: Product })[];
    currentRevision?:
      | (QuotationRevision & {
          items?: (QuotationRevisionItem & { product?: Product })[];
          creator?: User;
        })
      | null;
    revisions?: (QuotationRevision & {
      items?: (QuotationRevisionItem & { product?: Product })[];
      creator?: User;
    })[];
    deal?: Deal & { customer?: User; salesRep?: User; company?: Company };
    salesRep?: User;
    customer?: User;
    company?: Company;
    negotiations?: Parameters<typeof toNegotiationDto>[0][];
    salesOrders?: Parameters<typeof toSalesOrderDto>[0][];
  },
): QuotationResponseDto => {
  const items = quotation.items ? quotation.items.map(toQuotationItemDto) : [];
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
    discountAmount += item.discountAmount;
    const taxable = item.unitPrice * item.quantity - item.discountAmount;
    taxAmount += taxable * (item.taxRate / 100);
    totalAmount += item.lineTotal;
  }

  return {
    id: quotation.id,
    companyId: quotation.companyId,
    dealId: quotation.dealId,
    customerId: quotation.customerId,
    salesRepId: quotation.salesRepId,
    quotationNo: quotation.quotationNo,
    status: quotation.status,
    currency: quotation.currency,
    validUntil: quotation.validUntil,
    currentRevisionId: quotation.currentRevisionId,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    items: quotation.items ? items : undefined,
    currentRevision: quotation.currentRevision
      ? toQuotationRevisionDto(quotation.currentRevision)
      : undefined,
    revisions: quotation.revisions
      ? quotation.revisions.map(toQuotationRevisionDto)
      : undefined,
    deal: quotation.deal ? toDealDto(quotation.deal) : undefined,
    salesRep: quotation.salesRep ? toUserDto(quotation.salesRep) : undefined,
    customer: quotation.customer ? toUserDto(quotation.customer) : undefined,
    company: quotation.company
      ? {
          id: quotation.company.id,
          name: quotation.company.name,
        }
      : undefined,
    negotiations: quotation.negotiations
      ? quotation.negotiations.map(toNegotiationDto)
      : undefined,
    salesOrders: quotation.salesOrders
      ? quotation.salesOrders.map(toSalesOrderDto)
      : undefined,
  };
};
