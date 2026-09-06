export type ProductType = "ONE_TIME" | "RECURRING";
export type CustomerTier = "BRONZE" | "SILVER" | "GOLD";

export interface ProductDiscountTier {
  id?: string;
  productId?: string;
  customerTier: CustomerTier;
  discountPercent: number;
}

export interface ProductStock {
  id?: string;
  productId?: string;
  warehouseId: string;
  warehouseName?: string;
  stockQty: number;
}

export interface ProductResponseType {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: number;
  baseUnit: string;
  type: ProductType;
  discountTiers?: ProductDiscountTier[];
  stocks?: ProductStock[];
  totalStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductsResponse {
  products: ProductResponseType[];
  total: number;
  page: number;
  limit: number;
}

export type ProductListData = PaginatedProductsResponse;

export interface CreateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  baseUnit?: string;
  type?: ProductType;
  stocks?: { warehouseId: string; stockQty: number }[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string | null;
  price?: number;
  baseUnit?: string;
  type?: ProductType;
  stocks?: { warehouseId: string; stockQty: number }[];
}

export interface UpsertProductStockRequest {
  stockQty: number;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  type?: ProductType;
  search?: string;
}
