import {
  Prisma,
  PrismaClient,
  SubscriptionPricing,
  SubscriptionType,
  CustomerTier,
  Product,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type SubscriptionPricingWithRelations = SubscriptionPricing & {
  product?: Product | null;
};

export class SubscriptionPricingRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async create(
    data: Prisma.SubscriptionPricingCreateInput,
    tx?: TransactionClient,
  ): Promise<SubscriptionPricingWithRelations> {
    const client = tx || this.prisma;
    return client.subscriptionPricing.create({
      data,
      include: {
        product: true,
      },
    });
  }

  public async findById(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<SubscriptionPricingWithRelations | null> {
    const client = tx || this.prisma;
    const where: Prisma.SubscriptionPricingWhereInput = { id };
    if (companyId) {
      where.companyId = companyId;
    }
    return client.subscriptionPricing.findFirst({
      where,
      include: {
        product: true,
      },
    });
  }

  public async findMany(
    where: Prisma.SubscriptionPricingWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<SubscriptionPricingWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.subscriptionPricing.findMany({
          ...(args as {
            where?: Prisma.SubscriptionPricingWhereInput;
            orderBy?: Prisma.SubscriptionPricingOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            product: true,
          },
        }) as Promise<SubscriptionPricingWithRelations[]>,
      count: (args: { where?: object }) =>
        client.subscriptionPricing.count(
          args as { where?: Prisma.SubscriptionPricingWhereInput },
        ),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }

  public async update(
    id: string,
    data: Prisma.SubscriptionPricingUpdateInput,
    tx?: TransactionClient,
  ): Promise<SubscriptionPricingWithRelations> {
    const client = tx || this.prisma;
    return client.subscriptionPricing.update({
      where: { id },
      data,
      include: {
        product: true,
      },
    });
  }

  public async delete(
    id: string,
    tx?: TransactionClient,
  ): Promise<SubscriptionPricing> {
    const client = tx || this.prisma;
    return client.subscriptionPricing.delete({
      where: { id },
    });
  }

  public async findApplicablePricing(
    companyId: string,
    productId: string,
    subscriptionType: SubscriptionType,
    customerTier?: CustomerTier | null,
    tx?: TransactionClient,
  ): Promise<SubscriptionPricing | null> {
    const client = tx || this.prisma;
    const now = new Date();

    const baseWhere: Prisma.SubscriptionPricingWhereInput = {
      companyId,
      productId,
      subscriptionType,
      isActive: true,
      AND: [
        {
          OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        },
        {
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
      ],
    };

    if (customerTier) {
      const tierPricing = await client.subscriptionPricing.findFirst({
        where: {
          ...baseWhere,
          customerTier,
        },
        orderBy: { createdAt: "desc" },
      });
      if (tierPricing) {
        return tierPricing;
      }
    }

    return client.subscriptionPricing.findFirst({
      where: {
        ...baseWhere,
        customerTier: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const subscriptionPricingRepository =
  new SubscriptionPricingRepository();
