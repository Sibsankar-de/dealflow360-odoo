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
import { ApiError } from "../utils/apiErrorHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  BackorderResponseDto,
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
