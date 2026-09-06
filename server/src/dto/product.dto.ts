import {
  Product,
  ProductStock,
  ProductDiscountTier,
  ProductType,
  CustomerTier,
  Category,
  CategoryProduct,
} from "@prisma/client";
import { CategoryResponseDto, toCategoryDto } from "./category.dto";

export interface ProductStockDto {
  id: string;
  productId: string;
  warehouseId: string;
  stockQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDiscountTierDto {
  id: string;
  productId: string;
  customerTier: CustomerTier;
  discountPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponseDto {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: number;
  baseUnit: string;
  type: ProductType;
  createdAt: Date;
  updatedAt: Date;
  stocks?: ProductStockDto[];
  discountTiers?: ProductDiscountTierDto[];
  categories?: CategoryResponseDto[];
}

export interface StockEntryDto {
  warehouseId: string;
  stockQty: number;
}

export interface DiscountTierEntryDto {
  customerTier: CustomerTier;
  discountPercent: number;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: number;
  baseUnit?: string;
  type?: ProductType;
  stocks?: StockEntryDto[];
  discountTiers?: DiscountTierEntryDto[];
  categoryIds?: string[];
  categoryIdList?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  price?: number;
  baseUnit?: string;
  type?: ProductType;
  stocks?: StockEntryDto[];
  discountTiers?: DiscountTierEntryDto[];
  categoryIds?: string[];
  categoryIdList?: string[];
}

export interface ProductListDto {
  products: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export const toProductStockDto = (s: ProductStock): ProductStockDto => ({
  id: s.id,
  productId: s.productId,
  warehouseId: s.warehouseId,
  stockQty: Number(s.stockQty),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export const toProductDiscountTierDto = (
  t: ProductDiscountTier,
): ProductDiscountTierDto => ({
  id: t.id,
  productId: t.productId,
  customerTier: t.customerTier,
  discountPercent: Number(t.discountPercent),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

export const toProductDto = (
  p: Product & {
    productStocks?: ProductStock[];
    discountTiers?: ProductDiscountTier[];
    categories?: (CategoryProduct & { category: Category })[];
  },
): ProductResponseDto => ({
  id: p.id,
  companyId: p.companyId,
  name: p.name,
  description: p.description ?? null,
  price: Number(p.price),
  baseUnit: p.baseUnit,
  type: p.type,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  stocks: p.productStocks?.map(toProductStockDto),
  discountTiers: p.discountTiers?.map(toProductDiscountTierDto),
  categories: p.categories?.map((cp) => toCategoryDto(cp.category)),
});

export interface ProductSummaryResponseDto {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: number;
  baseUnit: string;
  type: ProductType;
  createdAt: Date;
  updatedAt: Date;
}

export const toProductSummaryDto = (
  p: Product,
): ProductSummaryResponseDto => ({
  id: p.id,
  companyId: p.companyId,
  name: p.name,
  description: p.description ?? null,
  price: Number(p.price),
  baseUnit: p.baseUnit,
  type: p.type,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
