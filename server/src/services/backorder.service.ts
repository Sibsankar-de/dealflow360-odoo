import { StatusCodes } from "http-status-codes";
import { Prisma, BackorderStatus } from "@prisma/client";
import {
  BackorderRepository,
  backorderRepository as defaultBackorderRepository,
} from "../repositories/backorder.repository";
import {
  DeliveryService,
  deliveryService as defaultDeliveryService,
} from "./delivery.service";
import { prisma as defaultPrisma } from "../lib/prisma";
import { ApiError } from "../utils/apiErrorHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  BackorderResponseDto,
  BackorderSummaryResponseDto,
  BackorderFilterDto,
  FulfillBackorderDto,
  toBackorderDto,
} from "../dto/backorder.dto";
import { DeliveryResponseDto } from "../dto/delivery.dto";

export class BackorderService {
  private backorderRepo: BackorderRepository;
  private deliveryService: DeliveryService;

  public constructor(
    backorderRepo: BackorderRepository = defaultBackorderRepository,
    deliveryService: DeliveryService = defaultDeliveryService,
  ) {
    this.backorderRepo = backorderRepo;
    this.deliveryService = deliveryService;
  }

  public async getBackorderById(
    backorderId: string,
    companyId: string,
  ): Promise<BackorderResponseDto> {
    const backorder = await this.backorderRepo.findByIdWithRelations(
      backorderId,
      companyId,
    );
    if (!backorder) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Backorder not found");
    }
    return toBackorderDto(backorder);
  }

  public async listBackorders(
    companyId: string,
    filters: BackorderFilterDto,
  ): Promise<PaginatedResult<BackorderResponseDto>> {
    const where: Prisma.BackorderWhereInput = { companyId };

    if (filters.salesOrderId) {
      where.salesOrderId = filters.salesOrderId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { backorderNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const options = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    const paginated = await this.backorderRepo.list(where, options);
    return {
      ...paginated,
      docs: paginated.docs.map((b) => toBackorderDto(b)),
    };
  }

  public async getBackorderSummary(
    companyId: string,
  ): Promise<BackorderSummaryResponseDto> {
    const [
      totalCount,
      pendingCount,
      partiallyFulfilledCount,
      fulfilledCount,
      cancelledCount,
      aggregates,
    ] = await Promise.all([
      defaultPrisma.backorder.count({ where: { companyId } }),
      defaultPrisma.backorder.count({
        where: { companyId, status: BackorderStatus.PENDING },
      }),
      defaultPrisma.backorder.count({
        where: { companyId, status: BackorderStatus.PARTIALLY_FULFILLED },
      }),
      defaultPrisma.backorder.count({
        where: { companyId, status: BackorderStatus.FULFILLED },
      }),
      defaultPrisma.backorder.count({
        where: { companyId, status: BackorderStatus.CANCELLED },
      }),
      defaultPrisma.backorder.aggregate({
        where: { companyId },
        _sum: {
          totalQuantity: true,
          fulfilledQuantity: true,
          remainingQuantity: true,
        },
      }),
    ]);

    return {
      totalCount,
      pendingCount,
      partiallyFulfilledCount,
      fulfilledCount,
      cancelledCount,
      totalQuantity: Number(aggregates._sum.totalQuantity || 0),
      fulfilledQuantity: Number(aggregates._sum.fulfilledQuantity || 0),
      remainingQuantity: Number(aggregates._sum.remainingQuantity || 0),
    };
  }

  public async fulfillBackorder(
    companyId: string,
    userId: string,
    backorderId: string,
    dto: FulfillBackorderDto,
  ): Promise<DeliveryResponseDto> {
    const backorder = await this.backorderRepo.findByIdWithRelations(
      backorderId,
      companyId,
    );

    if (!backorder) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Backorder not found");
    }

    if (backorder.status === BackorderStatus.FULFILLED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Backorder is already completely fulfilled",
      );
    }

    if (backorder.status === BackorderStatus.CANCELLED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot fulfill a cancelled backorder",
      );
    }

    return this.deliveryService.createDelivery(
      companyId,
      backorder.salesOrderId,
      {
        backorderId,
        trackingNumber: dto.trackingNumber,
        notes: dto.notes,
        expectedDate: dto.expectedDate,
        items: dto.items,
      },
    );
  }
}

export const backorderService = new BackorderService();
