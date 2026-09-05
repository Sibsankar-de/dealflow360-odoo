import {
  Prisma,
  PrismaClient,
  SalesOrder,
  SalesOrderItem,
  Product,
  Quotation,
  User,
  Delivery,
  Invoice,
  Backorder,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type SalesOrderWithRelations = SalesOrder & {
  customer: User;
  salesRep?: User | null;
  quotation?: Quotation | null;
  items: (SalesOrderItem & { product?: Product | null })[];
  deliveries?: Delivery[];
  invoices?: Invoice[];
  backorders?: Backorder[];
};

export class SalesOrderRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countOrders(tx?: TransactionClient): Promise<number> {
    const client = tx || this.prisma;
    return client.salesOrder.count();
  }

  public async countCompanyOrders(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.salesOrder.count({
      where: { companyId },
    });
  }

  public async findByOrderNo(
    orderNo: string,
    tx?: TransactionClient,
  ): Promise<SalesOrder | null> {
    const client = tx || this.prisma;
    return client.salesOrder.findUnique({
      where: { orderNo },
    });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<SalesOrder | null> {
    const client = tx || this.prisma;
    return client.salesOrder.findUnique({
      where: { id },
    });
  }

  public async findByIdWithRelations(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<SalesOrderWithRelations | null> {
    const client = tx || this.prisma;
    return client.salesOrder.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
        customer: true,
        salesRep: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        deliveries: {
          include: {
            items: true,
          },
        },
        invoices: {
          include: {
            items: true,
          },
        },
        backorders: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  public async create(
    data: Prisma.SalesOrderCreateInput,
    tx?: TransactionClient,
  ): Promise<SalesOrder> {
    const client = tx || this.prisma;
    return client.salesOrder.create({
      data,
    });
  }

  public async update(
    id: string,
    data: Prisma.SalesOrderUpdateInput,
    tx?: TransactionClient,
  ): Promise<SalesOrder> {
    const client = tx || this.prisma;
    return client.salesOrder.update({
      where: { id },
      data,
    });
  }

  public async updateItem(
    itemId: string,
    data: Prisma.SalesOrderItemUpdateInput,
    tx?: TransactionClient,
  ): Promise<SalesOrderItem> {
    const client = tx || this.prisma;
    return client.salesOrderItem.update({
      where: { id: itemId },
      data,
    });
  }

  public async list(
    where: Prisma.SalesOrderWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<SalesOrderWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.salesOrder.findMany({
          ...(args as {
            where?: Prisma.SalesOrderWhereInput;
            orderBy?: Prisma.SalesOrderOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            customer: true,
            salesRep: true,
            quotation: true,
            items: {
              include: {
                product: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
            deliveries: true,
            invoices: true,
            backorders: true,
          },
        }) as Promise<SalesOrderWithRelations[]>,
      count: (args: { where?: object }) =>
        client.salesOrder.count(
          args as { where?: Prisma.SalesOrderWhereInput },
        ),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const salesOrderRepository = new SalesOrderRepository();
