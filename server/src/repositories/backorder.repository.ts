import {
  Prisma,
  PrismaClient,
  Backorder,
  BackorderItem,
  Product,
  SalesOrder,
  SalesOrderItem,
  Delivery,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type BackorderWithRelations = Backorder & {
  salesOrder?: SalesOrder | null;
  parentBackorder?: Backorder | null;
  childBackorders?: (Backorder & {
    items?: (BackorderItem & { product?: Product | null })[];
  })[];
  items: (BackorderItem & {
    product?: Product | null;
    salesOrderItem?: SalesOrderItem | null;
  })[];
  deliveries?: Delivery[];
};

export class BackorderRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countBackorders(tx?: TransactionClient): Promise<number> {
    const client = tx || this.prisma;
    return client.backorder.count();
  }

  public async countCompanyBackorders(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.backorder.count({
      where: { companyId },
    });
  }

  public async findByBackorderNo(
    backorderNo: string,
    tx?: TransactionClient,
  ): Promise<Backorder | null> {
    const client = tx || this.prisma;
    return client.backorder.findUnique({
      where: { backorderNo },
    });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<Backorder | null> {
    const client = tx || this.prisma;
    return client.backorder.findUnique({
      where: { id },
    });
  }

  public async findByIdWithRelations(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<BackorderWithRelations | null> {
    const client = tx || this.prisma;
    return client.backorder.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        salesOrder: true,
        parentBackorder: true,
        childBackorders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
            salesOrderItem: true,
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
      },
    });
  }

  public async create(
    data: Prisma.BackorderCreateInput,
    tx?: TransactionClient,
  ): Promise<Backorder> {
    const client = tx || this.prisma;
    return client.backorder.create({
      data,
    });
  }

  public async update(
    id: string,
    data: Prisma.BackorderUpdateInput,
    tx?: TransactionClient,
  ): Promise<Backorder> {
    const client = tx || this.prisma;
    return client.backorder.update({
      where: { id },
      data,
    });
  }

  public async updateItem(
    itemId: string,
    data: Prisma.BackorderItemUpdateInput,
    tx?: TransactionClient,
  ): Promise<BackorderItem> {
    const client = tx || this.prisma;
    return client.backorderItem.update({
      where: { id: itemId },
      data,
    });
  }

  public async list(
    where: Prisma.BackorderWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<BackorderWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.backorder.findMany({
          ...(args as {
            where?: Prisma.BackorderWhereInput;
            orderBy?: Prisma.BackorderOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            salesOrder: true,
            parentBackorder: true,
            childBackorders: true,
            items: {
              include: {
                product: true,
                salesOrderItem: true,
              },
            },
            deliveries: true,
          },
        }) as Promise<BackorderWithRelations[]>,
      count: (args: { where?: object }) =>
        client.backorder.count(args as { where?: Prisma.BackorderWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const backorderRepository = new BackorderRepository();
