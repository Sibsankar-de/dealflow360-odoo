import { StatusCodes } from "http-status-codes";
import {
  WarehouseRepository,
  warehouseRepository as defaultWarehouseRepository,
} from "../repositories/warehouse.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction } from "../utils/transactionHandler";
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseListDto,
  WarehouseResponseDto,
  toWarehouseDto,
} from "../dto/warehouse.dto";

export class WarehouseService {
  private warehouseRepo: WarehouseRepository;

  public constructor(
    warehouseRepo: WarehouseRepository = defaultWarehouseRepository,
  ) {
    this.warehouseRepo = warehouseRepo;
  }

  public async createWarehouse(
    companyId: string,
    dto: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return prismaTransaction(async (tx) => {
      const warehouse = await this.warehouseRepo.create(
        {
          companyId,
          name: dto.name,
          country: dto.country,
          postalCode: dto.postalCode,
          addressLine: dto.addressLine,
        },
        tx,
      );
      return toWarehouseDto(warehouse);
    });
  }

  public async getWarehouse(
    warehouseId: string,
    companyId: string,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepo.findById(warehouseId, companyId);
    if (!warehouse) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
    }
    return toWarehouseDto(warehouse);
  }

  public async listWarehouses(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<WarehouseListDto> {
    const { warehouses, total } = await this.warehouseRepo.findMany(
      companyId,
      page,
      limit,
    );
    return {
      warehouses: warehouses.map(toWarehouseDto),
      total,
      page,
      limit,
    };
  }

  public async updateWarehouse(
    warehouseId: string,
    companyId: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return prismaTransaction(async (tx) => {
      const existing = await this.warehouseRepo.findById(warehouseId, companyId, tx);
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
      }

      const updated = await this.warehouseRepo.update(
        warehouseId,
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.country !== undefined ? { country: dto.country } : {}),
          ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
          ...(dto.addressLine !== undefined ? { addressLine: dto.addressLine } : {}),
        },
        tx,
      );
      return toWarehouseDto(updated);
    });
  }

  public async deleteWarehouse(
    warehouseId: string,
    companyId: string,
  ): Promise<void> {
    return prismaTransaction(async (tx) => {
      const existing = await this.warehouseRepo.findById(warehouseId, companyId, tx);
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
      }
      await this.warehouseRepo.delete(warehouseId, tx);
    });
  }
}

export const warehouseService = new WarehouseService();
