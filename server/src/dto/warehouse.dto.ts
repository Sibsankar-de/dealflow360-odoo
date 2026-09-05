import { Warehouse } from "@prisma/client";

export interface WarehouseResponseDto {
  id: string;
  companyId: string;
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarehouseDto {
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  country?: string;
  postalCode?: string;
  addressLine?: string;
}

export interface WarehouseListDto {
  warehouses: WarehouseResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export const toWarehouseDto = (w: Warehouse): WarehouseResponseDto => ({
  id: w.id,
  companyId: w.companyId,
  name: w.name,
  country: w.country,
  postalCode: w.postalCode,
  addressLine: w.addressLine,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
