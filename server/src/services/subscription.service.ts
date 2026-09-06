import {
  Prisma,
  SubscriptionStatus,
  SubscriptionType,
  ProductType,
} from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  SubscriptionRepository,
  subscriptionRepository as defaultSubscriptionRepo,
} from "../repositories/subscription.repository";
import {
  SubscriptionPricingRepository,
  subscriptionPricingRepository as defaultSubscriptionPricingRepo,
} from "../repositories/subscriptionPricing.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";
import { calculateSubscriptionEndDate } from "../utils/date-utils";
import { PaginatedResult } from "../utils/paginate";
import {
  SubscriptionFilterDto,
  CustomerSubscriptionFilterDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionPeriodResponseDto,
  SubscriptionSummaryResponseDto,
  toSubscriptionDto,
  toSubscriptionPeriodDto,
} from "../dto/subscription.dto";

export class SubscriptionService {
  private subscriptionRepo: SubscriptionRepository;
  private pricingRepo: SubscriptionPricingRepository;

  public constructor(
    subscriptionRepo: SubscriptionRepository = defaultSubscriptionRepo,
    pricingRepo: SubscriptionPricingRepository = defaultSubscriptionPricingRepo,
  ) {
    this.subscriptionRepo = subscriptionRepo;
    this.pricingRepo = pricingRepo;
  }

  public async generateSubscriptionNo(
    tx?: TransactionClient,
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.subscriptionRepo.countSubscriptions(tx);
    let seqNum = count + 1;
    let subscriptionNo = `SUB-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    while (await this.subscriptionRepo.findBySubscriptionNo(subscriptionNo, tx)) {
      seqNum++;
      subscriptionNo = `SUB-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }
    return subscriptionNo;
  }

  public async generateSubscriptionFromFulfillment(
    companyId: string,
    customerId: string,
    salesOrderId: string | null,
    quotationId: string | null,
    currency: string,
    deliveredItems: Array<{
      productId: string;
      quantity: number;
      unitPrice?: number;
      discount?: number;
    }>,
    defaultSubscriptionType: SubscriptionType = SubscriptionType.MONTHLY,
    tx: TransactionClient,
  ): Promise<SubscriptionResponseDto | null> {
    if (!deliveredItems || deliveredItems.length === 0) {
      return null;
    }

    const productIds = deliveredItems.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        companyId,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Filter strictly to recurring products. One-time products must not generate subscriptions.
    const recurringDeliveredItems = deliveredItems.filter((item) => {
      const product = productMap.get(item.productId);
      return product && product.type === ProductType.RECURRING;
    });

    if (recurringDeliveredItems.length === 0) {
      return null;
    }

    // Lookup customer tier in company context
    const companyUser = await tx.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: customerId,
        },
      },
    });
    const customerTier = companyUser?.customerTier || null;

    let targetSubscriptionType = defaultSubscriptionType;
    let primaryPricingId: string | null = null;

    // Check if configured pricing exists for the first recurring product to infer period if not explicit
    const firstPricing = await this.pricingRepo.findApplicablePricing(
      companyId,
      recurringDeliveredItems[0].productId,
      targetSubscriptionType,
      customerTier,
      tx,
    );
    if (firstPricing) {
      primaryPricingId = firstPricing.id;
      targetSubscriptionType = firstPricing.subscriptionType;
    }

    let totalRecurringAmount = new Prisma.Decimal(0);
    const itemsToCreate: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discount: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
      productName: string;
    }> = [];

    for (const item of recurringDeliveredItems) {
      const product = productMap.get(item.productId)!;
      const applicablePricing = await this.pricingRepo.findApplicablePricing(
        companyId,
        item.productId,
        targetSubscriptionType,
        customerTier,
        tx,
      );

      // Determine applied price: configured subscription pricing takes precedence,
      // otherwise agreed line price from fulfillment
      let appliedUnitPrice: Prisma.Decimal;
      if (applicablePricing) {
        appliedUnitPrice = new Prisma.Decimal(applicablePricing.price);
        if (!primaryPricingId) {
          primaryPricingId = applicablePricing.id;
        }
      } else if (item.unitPrice !== undefined) {
        appliedUnitPrice = new Prisma.Decimal(item.unitPrice);
      } else {
        appliedUnitPrice = new Prisma.Decimal(product.price);
      }

      const qty = new Prisma.Decimal(item.quantity);
      const discount = new Prisma.Decimal(item.discount ?? 0);
      const lineTotal = appliedUnitPrice.mul(qty).sub(discount);

      totalRecurringAmount = totalRecurringAmount.add(lineTotal);

      itemsToCreate.push({
        productId: item.productId,
        quantity: qty,
        unitPrice: appliedUnitPrice,
        discount,
        lineTotal,
        productName: product.name,
      });
    }

    const startDate = new Date();
    const endDate = calculateSubscriptionEndDate(startDate, targetSubscriptionType);
    const nextRenewalDate = endDate;
    const subscriptionNo = await this.generateSubscriptionNo(tx);

    const created = await this.subscriptionRepo.create(
      {
        company: { connect: { id: companyId } },
        customer: { connect: { id: customerId } },
        salesOrder: salesOrderId ? { connect: { id: salesOrderId } } : undefined,
        quotation: quotationId ? { connect: { id: quotationId } } : undefined,
        subscriptionPricing: primaryPricingId
          ? { connect: { id: primaryPricingId } }
          : undefined,
        subscriptionNo,
        subscriptionType: targetSubscriptionType,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        nextRenewalDate,
        currency,
        totalRecurringAmount,
        items: {
          create: itemsToCreate.map((i) => ({
            product: { connect: { id: i.productId } },
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            lineTotal: i.lineTotal,
          })),
        },
        periods: {
          create: [
            {
              periodNumber: 1,
              startDate,
              endDate,
              subscriptionType: targetSubscriptionType,
              totalAmount: totalRecurringAmount,
              subscriptionPricingId: primaryPricingId,
              itemsSnapshot: itemsToCreate.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                discount: Number(i.discount),
                lineTotal: Number(i.lineTotal),
              })),
            },
          ],
        },
      },
      tx,
    );

    return toSubscriptionDto(created);
  }

  public async renewSubscription(
    subscriptionId: string,
    requestingUserId: string,
    companyId?: string,
    dto?: RenewSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const subscription = await this.subscriptionRepo.findByIdWithRelations(
        subscriptionId,
        companyId,
        undefined,
        tx,
      );

      if (!subscription) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Subscription not found");
      }

      if (
        subscription.status !== SubscriptionStatus.ACTIVE &&
        subscription.status !== SubscriptionStatus.EXPIRED
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot renew a subscription with status ${subscription.status}. Only ACTIVE or EXPIRED subscriptions can be renewed.`,
        );
      }

      const targetType =
        dto?.subscriptionType || subscription.subscriptionType;

      // Customer tier lookup
      const companyUser = await tx.companyUser.findUnique({
        where: {
          companyId_userId: {
            companyId: subscription.companyId,
            userId: subscription.customerId,
          },
        },
      });
      const customerTier = companyUser?.customerTier || null;

      let primaryPricingId: string | null = null;
      let newTotalAmount = new Prisma.Decimal(0);
      const itemsSnapshot: Array<{
        productId: string;
        productName?: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        lineTotal: number;
      }> = [];

      // Apply latest configured renewal pricing applicable at time of renewal
      for (const item of subscription.items) {
        const applicablePricing =
          await this.pricingRepo.findApplicablePricing(
            subscription.companyId,
            item.productId,
            targetType,
            customerTier,
            tx,
          );

        let appliedUnitPrice: Prisma.Decimal;
        if (applicablePricing) {
          appliedUnitPrice = new Prisma.Decimal(applicablePricing.price);
          if (!primaryPricingId) {
            primaryPricingId = applicablePricing.id;
          }
        } else {
          appliedUnitPrice = new Prisma.Decimal(item.unitPrice);
        }

        const qty = new Prisma.Decimal(item.quantity);
        const discount = new Prisma.Decimal(item.discount);
        const lineTotal = appliedUnitPrice.mul(qty).sub(discount);

        newTotalAmount = newTotalAmount.add(lineTotal);

        itemsSnapshot.push({
          productId: item.productId,
          productName: item.product?.name,
          quantity: Number(qty),
          unitPrice: Number(appliedUnitPrice),
          discount: Number(discount),
          lineTotal: Number(lineTotal),
        });

        // Update item unit price and line total in DB
        await tx.subscriptionItem.update({
          where: { id: item.id },
          data: {
            unitPrice: appliedUnitPrice,
            lineTotal,
          },
        });
      }

      // Calculate new period dates
      const now = new Date();
      let newStartDate: Date;
      if (
        subscription.status === SubscriptionStatus.ACTIVE &&
        subscription.endDate > now
      ) {
        newStartDate = new Date(subscription.endDate);
      } else {
        newStartDate = now;
      }
      const newEndDate = calculateSubscriptionEndDate(newStartDate, targetType);
      const nextRenewalDate = newEndDate;

      const nextPeriodNumber = (subscription.periods?.length || 0) + 1;

      // Preserve previous period history by creating a new SubscriptionPeriod record
      await tx.subscriptionPeriod.create({
        data: {
          subscription: { connect: { id: subscription.id } },
          periodNumber: nextPeriodNumber,
          startDate: newStartDate,
          endDate: newEndDate,
          subscriptionType: targetType,
          totalAmount: newTotalAmount,
          subscriptionPricing: primaryPricingId
            ? { connect: { id: primaryPricingId } }
            : undefined,
          itemsSnapshot,
          renewedBy: { connect: { id: requestingUserId } },
          renewedAt: now,
          notes: dto?.notes || null,
        },
      });

      // Update subscription header
      const updated = await this.subscriptionRepo.update(
        subscription.id,
        {
          startDate: newStartDate,
          endDate: newEndDate,
          nextRenewalDate,
          subscriptionType: targetType,
          totalRecurringAmount: newTotalAmount,
          status: SubscriptionStatus.ACTIVE,
          subscriptionPricing: primaryPricingId
            ? { connect: { id: primaryPricingId } }
            : undefined,
          notes: dto?.notes ? dto.notes : subscription.notes,
        },
        tx,
      );

      return toSubscriptionDto(updated);
    });
  }

  public async cancelSubscription(
    subscriptionId: string,
    requestingUserId: string,
    companyId?: string,
    dto?: CancelSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const subscription = await this.subscriptionRepo.findByIdWithRelations(
        subscriptionId,
        companyId,
        undefined,
        tx,
      );

      if (!subscription) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Subscription not found");
      }

      if (subscription.status === SubscriptionStatus.CANCELLED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Subscription is already cancelled",
        );
      }

      const updated = await this.subscriptionRepo.update(
        subscription.id,
        {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto?.cancellationReason || "Cancelled by user",
        },
        tx,
      );

      return toSubscriptionDto(updated);
    });
  }

  public async getSubscriptionById(
    subscriptionId: string,
    companyId?: string,
    customerId?: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepo.findByIdWithRelations(
      subscriptionId,
      companyId,
      customerId,
    );

    if (!subscription) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Subscription not found");
    }

    return toSubscriptionDto(subscription);
  }

  public async listSubscriptions(
    companyId: string,
    filters: SubscriptionFilterDto,
  ): Promise<PaginatedResult<SubscriptionResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.SubscriptionWhereInput = {
      companyId,
    };

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.salesOrderId) {
      where.salesOrderId = filters.salesOrderId;
    }
    if (filters.quotationId) {
      where.quotationId = filters.quotationId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.subscriptionType) {
      where.subscriptionType = filters.subscriptionType;
    }
    if (filters.search) {
      where.OR = [
        { subscriptionNo: { contains: filters.search, mode: "insensitive" } },
        { customer: { userName: { contains: filters.search, mode: "insensitive" } } },
        { customer: { email: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const result = await this.subscriptionRepo.findMany(where, {
      page,
      limit,
    });

    return {
      ...result,
      docs: result.docs.map(toSubscriptionDto),
    };
  }

  public async listCustomerSubscriptions(
    customerId: string,
    companyId?: string,
    filters: CustomerSubscriptionFilterDto = { page: 1, limit: 20 },
  ): Promise<PaginatedResult<SubscriptionResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.SubscriptionWhereInput = {
      customerId,
    };

    if (companyId) {
      where.companyId = companyId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.subscriptionType) {
      where.subscriptionType = filters.subscriptionType;
    }
    if (filters.search) {
      where.subscriptionNo = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const result = await this.subscriptionRepo.findMany(where, {
      page,
      limit,
    });

    return {
      ...result,
      docs: result.docs.map(toSubscriptionDto),
    };
  }

  public async getSubscriptionPeriods(
    subscriptionId: string,
    companyId?: string,
    customerId?: string,
  ): Promise<SubscriptionPeriodResponseDto[]> {
    const subscription = await this.subscriptionRepo.findById(
      subscriptionId,
      companyId,
    );
    if (!subscription) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Subscription not found");
    }
    if (customerId && subscription.customerId !== customerId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
    }

    const periods = await this.subscriptionRepo.getPeriods(subscriptionId);
    return periods.map(toSubscriptionPeriodDto);
  }

  public async getSubscriptionSummary(
    companyId: string,
  ): Promise<SubscriptionSummaryResponseDto> {
    return this.subscriptionRepo.getSummary(companyId);
  }
}

export const subscriptionService = new SubscriptionService();
