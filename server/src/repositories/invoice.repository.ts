import {
  Prisma,
  PrismaClient,
  Invoice,
  InvoiceItem,
  Product,
  SalesOrder,
  SalesOrderItem,
  User,
  Delivery,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type InvoiceWithRelations = Invoice & {
  customer?: User | null;
  salesOrder?: SalesOrder | null;
  delivery?: Delivery | null;
  items: (InvoiceItem & {
    product?: Product | null;
    salesOrderItem?: SalesOrderItem | null;
  })[];
};

export class InvoiceRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countInvoices(tx?: TransactionClient): Promise<number> {
    const client = tx || this.prisma;
    return client.invoice.count();
  }

  public async countCompanyInvoices(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.invoice.count({
      where: { companyId },
    });
  }

  public async findByInvoiceNo(
    invoiceNo: string,
    tx?: TransactionClient,
  ): Promise<Invoice | null> {
    const client = tx || this.prisma;
    return client.invoice.findUnique({
      where: { invoiceNo },
    });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<Invoice | null> {
    const client = tx || this.prisma;
    return client.invoice.findUnique({
      where: { id },
    });
  }

  public async findByIdWithRelations(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<InvoiceWithRelations | null> {
    const client = tx || this.prisma;
    return client.invoice.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        customer: true,
        salesOrder: true,
        delivery: true,
        items: {
          include: {
            product: true,
            salesOrderItem: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  public async create(
    data: Prisma.InvoiceCreateInput,
    tx?: TransactionClient,
  ): Promise<Invoice> {
    const client = tx || this.prisma;
    return client.invoice.create({
      data,
    });
  }

  public async update(
    id: string,
    data: Prisma.InvoiceUpdateInput,
    tx?: TransactionClient,
  ): Promise<Invoice> {
    const client = tx || this.prisma;
    return client.invoice.update({
      where: { id },
      data,
    });
  }

  public async list(
    where: Prisma.InvoiceWhereInput,
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<PaginatedResult<InvoiceWithRelations>> {
    const client = tx || this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
      }) =>
        client.invoice.findMany({
          ...(args as {
            where?: Prisma.InvoiceWhereInput;
            orderBy?: Prisma.InvoiceOrderByWithRelationInput;
            skip?: number;
            take?: number;
          }),
          include: {
            customer: true,
            salesOrder: true,
            delivery: true,
            items: {
              include: {
                product: true,
                salesOrderItem: true,
              },
            },
          },
        }) as Promise<InvoiceWithRelations[]>,
      count: (args: { where?: object }) =>
        client.invoice.count(args as { where?: Prisma.InvoiceWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const invoiceRepository = new InvoiceRepository();
