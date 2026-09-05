import { Quotation, QuotationItem, QuotationStatus, Product, User, Company } from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";

export interface QuotationItemResponseDto {
  id: string;
  quotationId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxPercentage: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationResponseDto {
  id: string;
  companyId: string;
  creatorId: string;
  customerId: string;
  quotationNumber: string;
  status: QuotationStatus;
  quotationDate: Date;
  expiresAt: Date | null;
  currency: string;
  discountAmount: number;
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: QuotationItemResponseDto[];
  creator?: UserResponseDto;
  customer?: UserResponseDto;
  company?: {
    id: string;
    name: string;
  };
}

export interface CreateQuotationItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountPercentage?: number;
  taxPercentage?: number;
}

export interface CreateQuotationDto {
  companyId: string;
  customerId: string;
  items: CreateQuotationItemDto[];
  quotationDate?: string | Date;
  expiresAt?: string | Date | null;
  currency?: string;
  notes?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface UpdateQuotationDto {
  customerId?: string;
  items?: CreateQuotationItemDto[];
  quotationDate?: string | Date;
  expiresAt?: string | Date | null;
  currency?: string;
  notes?: string | null;
  discountAmount?: number;
  status?: QuotationStatus;
}

export interface QuotationFilterDto {
  companyId?: string;
  customerId?: string;
  status?: QuotationStatus;
  search?: string;
  page?: number;
  limit?: number;
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
    discountPercentage: Number(item.discountPercentage),
    taxPercentage: Number(item.taxPercentage),
    lineTotal: Number(item.lineTotal),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toQuotationDto = (
  quotation: Quotation & {
    items?: (QuotationItem & { product?: Product })[];
    creator?: User;
    customer?: User;
    company?: Company;
  },
): QuotationResponseDto => {
  return {
    id: quotation.id,
    companyId: quotation.companyId,
    creatorId: quotation.creatorId,
    customerId: quotation.customerId,
    quotationNumber: quotation.quotationNumber,
    status: quotation.status,
    quotationDate: quotation.quotationDate,
    expiresAt: quotation.expiresAt,
    currency: quotation.currency,
    discountAmount: Number(quotation.discountAmount),
    subtotal: Number(quotation.subtotal),
    total: Number(quotation.total),
    notes: quotation.notes,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    items: quotation.items ? quotation.items.map(toQuotationItemDto) : undefined,
    creator: quotation.creator ? toUserDto(quotation.creator) : undefined,
    customer: quotation.customer ? toUserDto(quotation.customer) : undefined,
    company: quotation.company
      ? {
          id: quotation.company.id,
          name: quotation.company.name,
        }
      : undefined,
  };
};
