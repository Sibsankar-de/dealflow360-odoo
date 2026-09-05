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
  NegotiationStatus,
  NegotiationOffer,
  NegotiationOfferItem,
  OfferParty,
  OfferStatus,
  Product,
  User,
  Company,
} from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";

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

export interface NegotiationOfferItemResponseDto {
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

export interface NegotiationOfferResponseDto {
  id: string;
  negotiationId: string;
  baseRevisionId: string | null;
  offeredBy: OfferParty;
  status: OfferStatus;
  message: string | null;
  createdAt: Date;
  items?: NegotiationOfferItemResponseDto[];
}

export interface NegotiationResponseDto {
  id: string;
  quotationId: string;
  status: NegotiationStatus;
  startedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  offers?: NegotiationOfferResponseDto[];
}

export interface CreateQuotationItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
}

export interface CreateQuotationDto {
  companyId: string;
  dealId: string;
  customerId: string;
  items: CreateQuotationItemDto[];
  validUntil?: string | Date | null;
  currency?: string;
  customerNote?: string | null;
  internalNote?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface UpdateQuotationDto {
  customerId?: string;
  items?: CreateQuotationItemDto[];
  validUntil?: string | Date | null;
  currency?: string;
  customerNote?: string | null;
  internalNote?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface QuotationFilterDto {
  companyId?: string;
  dealId?: string;
  customerId?: string;
  salesRepId?: string;
  status?: QuotationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CancelQuotationDto {
  reason?: string;
}

export interface RejectQuotationDto {
  reason?: string;
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

export const toNegotiationOfferItemDto = (
  item: NegotiationOfferItem & { product?: Product },
): NegotiationOfferItemResponseDto => {
  return {
    id: item.id,
    negotiationOfferId: item.negotiationOfferId,
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

export const toNegotiationOfferDto = (
  offer: NegotiationOffer & {
    items?: (NegotiationOfferItem & { product?: Product })[];
  },
): NegotiationOfferResponseDto => {
  return {
    id: offer.id,
    negotiationId: offer.negotiationId,
    baseRevisionId: offer.baseRevisionId,
    offeredBy: offer.offeredBy,
    status: offer.status,
    message: offer.message,
    createdAt: offer.createdAt,
    items: offer.items
      ? offer.items.map(toNegotiationOfferItemDto)
      : undefined,
  };
};

export const toNegotiationDto = (
  negotiation: Negotiation & {
    offers?: (NegotiationOffer & {
      items?: (NegotiationOfferItem & { product?: Product })[];
    })[];
  },
): NegotiationResponseDto => {
  return {
    id: negotiation.id,
    quotationId: negotiation.quotationId,
    status: negotiation.status,
    startedAt: negotiation.startedAt,
    closedAt: negotiation.closedAt,
    createdAt: negotiation.createdAt,
    updatedAt: negotiation.updatedAt,
    offers: negotiation.offers
      ? negotiation.offers.map(toNegotiationOfferDto)
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
  },
): QuotationResponseDto => {
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
    items: quotation.items ? quotation.items.map(toQuotationItemDto) : undefined,
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
  };
};

