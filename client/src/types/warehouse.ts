export interface WarehouseResponseType {
  id: string;
  companyId: string;
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
  totalProductsCount?: number;
  totalStockUnits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWarehousesResponse {
  warehouses: WarehouseResponseType[];
  total: number;
  page: number;
  limit: number;
}

export type WarehouseListData =
  | PaginatedWarehousesResponse
  | { warehouses: WarehouseResponseType[] }
  | WarehouseResponseType[];

export interface CreateWarehouseRequest {
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
}

export interface UpdateWarehouseRequest {
  name?: string;
  country?: string;
  postalCode?: string;
  addressLine?: string;
}

export interface ListWarehousesQuery {
  page?: number;
  limit?: number;
}
