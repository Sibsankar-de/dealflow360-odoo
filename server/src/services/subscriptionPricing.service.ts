import { Prisma, CustomerTier, SubscriptionType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  SubscriptionPricingRepository,
  subscriptionPricingRepository as defaultSubscriptionPricingRepo,
} from "../repositories/subscriptionPricing.repository";
import {
  ProductRepository,
  productRepository as defaultProductRepository,
} from "../repositories/product.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CreateSubscriptionPricingDto,
  UpdateSubscriptionPricingDto,
  SubscriptionPricingFilterDto,
  SubscriptionPricingResponseDto,
  toSubscriptionPricingDto,
} from "../dto/subscriptionPricing.dto";

export class SubscriptionPricingService {
  private pricingRepo: SubscriptionPricingRepository;
  private productRepo: ProductRepository;

  public constructor(
    pricingRepo: SubscriptionPricingRepository = defaultSubscriptionPricingRepo,
    productRepo: ProductRepository = defaultProductRepository,
  ) {
    this.pricingRepo = pricingRepo;
    this.productRepo = productRepo;
  }

  public async createPricing(
    companyId: string,
    dto: CreateSubscriptionPricingDto,
  ): Promise<SubscriptionPricingResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const product = await this.productRepo.findById(
        dto.productId,
        companyId,
        tx,
      );
      if (!product) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Product not found in this company",
        );
      }

      if (product.type !== "RECURRING") {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Subscription pricing can only be configured for recurring products",
        );
      }

      const created = await this.pricingRepo.create(
        {
          company: { connect: { id: companyId } },
          product: { connect: { id: dto.productId } },
          subscriptionType: dto.subscriptionType,
          customerTier: dto.customerTier || null,
          price: new Prisma.Decimal(dto.price),
          minQuantity: new Prisma.Decimal(dto.minQuantity ?? 1),
          currency: dto.currency || product.companyId ? "USD" : "USD",
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        },
        tx,
      );

      return toSubscriptionPricingDto(created);
    });
  }

  public async getPricingById(
    id: string,
    companyId: string,
  ): Promise<SubscriptionPricingResponseDto> {
    const pricing = await this.pricingRepo.findById(id, companyId);
    if (!pricing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Subscription pricing not found");
    }
    return toSubscriptionPricingDto(pricing);
  }

  public async updatePricing(
    id: string,
    companyId: string,
    dto: UpdateSubscriptionPricingDto,
  ): Promise<SubscriptionPricingResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const existing = await this.pricingRepo.findById(id, companyId, tx);
      if (!existing) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Subscription pricing not found",
        );
      }

      const updateData: Prisma.SubscriptionPricingUpdateInput = {};
      if (dto.subscriptionType !== undefined) {
        updateData.subscriptionType = dto.subscriptionType;
      }
      if (dto.customerTier !== undefined) {
        updateData.customerTier = dto.customerTier;
      }
      if (dto.price !== undefined) {
        updateData.price = new Prisma.Decimal(dto.price);
      }
      if (dto.minQuantity !== undefined) {
        updateData.minQuantity = new Prisma.Decimal(dto.minQuantity);
      }
      if (dto.currency !== undefined) {
        updateData.currency = dto.currency;
      }
      if (dto.isActive !== undefined) {
        updateData.isActive = dto.isActive;
      }
      if (dto.validFrom !== undefined) {
        updateData.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
      }
      if (dto.validUntil !== undefined) {
        updateData.validUntil = dto.validUntil
          ? new Date(dto.validUntil)
          : null;
      }

      const updated = await this.pricingRepo.update(id, updateData, tx);
      return toSubscriptionPricingDto(updated);
    });
  }

  public async deletePricing(id: string, companyId: string): Promise<void> {
    const existing = await this.pricingRepo.findById(id, companyId);
    if (!existing) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Subscription pricing not found",
      );
    }
    await this.pricingRepo.delete(id);
  }

  public async listPricing(
    companyId: string,
    filters: SubscriptionPricingFilterDto,
  ): Promise<PaginatedResult<SubscriptionPricingResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.SubscriptionPricingWhereInput = {
      companyId,
    };

    if (filters.productId) {
      where.productId = filters.productId;
    }
    if (filters.subscriptionType) {
      where.subscriptionType = filters.subscriptionType;
    }
    if (filters.customerTier !== undefined) {
      where.customerTier = filters.customerTier;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const result = await this.pricingRepo.findMany(where, { page, limit });
    return {
      ...result,
      docs: result.docs.map(toSubscriptionPricingDto),
    };
  }

  public async findApplicablePricing(
    companyId: string,
    productId: string,
    subscriptionType: SubscriptionType,
    customerTier?: CustomerTier | null,
    tx?: TransactionClient,
  ) {
    return this.pricingRepo.findApplicablePricing(
      companyId,
      productId,
      subscriptionType,
      customerTier,
      tx,
    );
  }
}

export const subscriptionPricingService = new SubscriptionPricingService();
