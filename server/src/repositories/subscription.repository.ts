import {
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionItem,
  SubscriptionPeriod,
  SubscriptionStatus,
  Product,
  User,
  SalesOrder,
  Quotation,
  SubscriptionPricing,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type SubscriptionWithRelations = Subscription & {
  customer?: User | null;
  salesOrder?: SalesOrder | null;
  quotation?: Quotation | null;
  subscriptionPricing?: SubscriptionPricing | null;
  items: (SubscriptionItem & {
    product?: Product | null;
  })[];
  periods: (SubscriptionPeriod & {
    renewedBy?: User | null;
    subscriptionPricing?: SubscriptionPricing | null;
  })[];
};

export class SubscriptionRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countSubscriptions(tx?: TransactionClient): Promise<number> {
    const client = tx || this.prisma;
    return client.subscription.count();
  }

  public async findBySubscriptionNo(
    subscriptionNo: string,
    tx?: TransactionClient,
  ): Promise<Subscription | null> {
    const client = tx || this.prisma;
    return client.subscription.findUnique({
      where: { subscriptionNo },
    });
  }

  public async findById(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<Subscription | null> {
    const client = tx || this.prisma;
    const where: Prisma.SubscriptionWhereInput = { id };
    if (companyId) {
      where.companyId = companyId;
    }
    return client.subscription.findFirst({
      where,
    });
  }

  public async findByIdWithRelations(
    id: string,
    companyId?: string,
    customerId?: string,
    tx?: TransactionClient,
  ): Promise<SubscriptionWithRelations | null> {
    const client = tx || this.prisma;
    const where: Prisma.SubscriptionWhereInput = { id };
    if (companyId) {
      where.companyId = companyId;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    return client.subscription.findFirst({
      where,
      include: {
        customer: true,
        salesOrder: true,
        quotation: true,
        subscriptionPricing: true,
        items: {
          include: {
            product: true,
          },
        },
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            renewedBy: true,
            subscriptionPricing: true,
          },
        },
      },
    });
  }

  public async create(
    data: Prisma.SubscriptionCreateInput,
    tx?: TransactionClient,
  ): Promise<SubscriptionWithRelations> {
    const client = tx || this.prisma;
    return client.subscription.create({
      data,
      include: {
        customer: true,
        salesOrder: true,
        quotation: true,
        subscriptionPricing: true,
        items: {
          include: {
            product: true,
          },
        },
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            renewedBy: true,
            subscriptionPricing: true,
          },
        },
      },
    });
  }

  public async update(
    id: string,
    data: Prisma.SubscriptionUpdateInput,
    tx?: TransactionClient,
  ): Promise<SubscriptionWithRelations> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { id },
      data,
      include: {
        customer: true,
        salesOrder: true,
        quotation: true,
        subscriptionPricing: true,
        items: {
          include: {
            product: true,
          },
        },
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            renewedBy: true,
            subscriptionPricing: true,
          },
        },
      },
    });
  }

  public async findMany(
    where: Prisma.SubscriptionWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<SubscriptionWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.subscription.findMany({
          ...(args as {
            where?: Prisma.SubscriptionWhereInput;
            orderBy?: Prisma.SubscriptionOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            customer: true,
            salesOrder: true,
            quotation: true,
            subscriptionPricing: true,
            items: {
              include: {
                product: true,
              },
            },
            periods: {
              orderBy: { periodNumber: "asc" },
              include: {
                renewedBy: true,
                subscriptionPricing: true,
              },
            },
          },
        }) as Promise<SubscriptionWithRelations[]>,
      count: (args: { where?: object }) =>
        client.subscription.count(
          args as { where?: Prisma.SubscriptionWhereInput },
        ),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }

  public async createPeriod(
    data: Prisma.SubscriptionPeriodCreateInput,
    tx?: TransactionClient,
  ): Promise<SubscriptionPeriod> {
    const client = tx || this.prisma;
    return client.subscriptionPeriod.create({
      data,
    });
  }

  public async getPeriods(
    subscriptionId: string,
    tx?: TransactionClient,
  ): Promise<SubscriptionPeriod[]> {
    const client = tx || this.prisma;
    return client.subscriptionPeriod.findMany({
      where: { subscriptionId },
      orderBy: { periodNumber: "asc" },
      include: {
        renewedBy: true,
        subscriptionPricing: true,
      },
    });
  }

  public async getSummary(
    companyId: string,
    tx?: TransactionClient,
  ) {
    const client = tx || this.prisma;

    const [
      totalCount,
      activeCount,
      expiredCount,
      cancelledCount,
      monthlyCount,
      quarterlyCount,
      yearlyCount,
      activeSubscriptions,
    ] = await Promise.all([
      client.subscription.count({ where: { companyId } }),
      client.subscription.count({
        where: { companyId, status: SubscriptionStatus.ACTIVE },
      }),
      client.subscription.count({
        where: { companyId, status: SubscriptionStatus.EXPIRED },
      }),
      client.subscription.count({
        where: { companyId, status: SubscriptionStatus.CANCELLED },
      }),
      client.subscription.count({
        where: {
          companyId,
          status: SubscriptionStatus.ACTIVE,
          subscriptionType: "MONTHLY",
        },
      }),
      client.subscription.count({
        where: {
          companyId,
          status: SubscriptionStatus.ACTIVE,
          subscriptionType: "QUARTERLY",
        },
      }),
      client.subscription.count({
        where: {
          companyId,
          status: SubscriptionStatus.ACTIVE,
          subscriptionType: "YEARLY",
        },
      }),
      client.subscription.findMany({
        where: { companyId, status: SubscriptionStatus.ACTIVE },
        select: {
          subscriptionType: true,
          totalRecurringAmount: true,
        },
      }),
    ]);

    let mrr = 0;
    let arr = 0;

    for (const sub of activeSubscriptions) {
      const amount = Number(sub.totalRecurringAmount);
      if (sub.subscriptionType === "MONTHLY") {
        mrr += amount;
        arr += amount * 12;
      } else if (sub.subscriptionType === "QUARTERLY") {
        mrr += amount / 3;
        arr += amount * 4;
      } else if (sub.subscriptionType === "YEARLY") {
        mrr += amount / 12;
        arr += amount;
      }
    }

    return {
      totalCount,
      activeCount,
      expiredCount,
      cancelledCount,
      monthlyCount,
      quarterlyCount,
      yearlyCount,
      totalMonthlyRecurringRevenue: Number(mrr.toFixed(2)),
      totalAnnualRecurringRevenue: Number(arr.toFixed(2)),
    };
  }
}

export const subscriptionRepository = new SubscriptionRepository();
