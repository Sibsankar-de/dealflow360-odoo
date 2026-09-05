import {
  Prisma,
  PrismaClient,
  Delivery,
  DeliveryItem,
  Product,
  SalesOrder,
  SalesOrderItem,
  Backorder,
  Invoice,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type DeliveryWithRelations = Delivery & {
  salesOrder?: SalesOrder | null;
  backorder?: Backorder | null;
  items: (DeliveryItem & {
    product?: Product | null;
    salesOrderItem?: SalesOrderItem | null;
  })[];
  invoices?: Invoice[];
};

export class DeliveryRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countDeliveries(tx?: TransactionClient): Promise<number> {
    const client = tx || this.prisma;
    return client.delivery.count();
  }

  public async countCompanyDeliveries(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.delivery.count({
      where: { companyId },
    });
  }

  public async findByDeliveryNo(
    deliveryNo: string,
    tx?: TransactionClient,
  ): Promise<Delivery | null> {
    const client = tx || this.prisma;
    return client.delivery.findUnique({
      where: { deliveryNo },
    });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<Delivery | null> {
    const client = tx || this.prisma;
    return client.delivery.findUnique({
      where: { id },
    });
  }

  public async findByIdWithRelations(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<DeliveryWithRelations | null> {
    const client = tx || this.prisma;
    return client.delivery.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        salesOrder: true,
        backorder: true,
        items: {
          include: {
            product: true,
            salesOrderItem: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        invoices: true,
      },
    });
  }

  public async create(
    data: Prisma.DeliveryCreateInput,
    tx?: TransactionClient,
  ): Promise<Delivery> {
    const client = tx || this.prisma;
    return client.delivery.create({
      data,
    });
  }

  public async update(
    id: string,
    data: Prisma.DeliveryUpdateInput,
    tx?: TransactionClient,
  ): Promise<Delivery> {
    const client = tx || this.prisma;
    return client.delivery.update({
      where: { id },
      data,
    });
  }

  public async list(
    where: Prisma.DeliveryWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<DeliveryWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.delivery.findMany({
          ...(args as {
            where?: Prisma.DeliveryWhereInput;
            orderBy?: Prisma.DeliveryOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            salesOrder: true,
            backorder: true,
            items: {
              include: {
                product: true,
                salesOrderItem: true,
              },
            },
            invoices: true,
          },
        }) as Promise<DeliveryWithRelations[]>,
      count: (args: { where?: object }) =>
        client.delivery.count(args as { where?: Prisma.DeliveryWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const deliveryRepository = new DeliveryRepository();
