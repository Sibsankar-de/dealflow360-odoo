import {
  Prisma,
  PrismaClient,
  Quotation,
  QuotationItem,
  QuotationStatus,
  Product,
  User,
  Company,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";

export type QuotationWithRelations = Quotation & {
  items: (QuotationItem & { product: Product })[];
  creator: User;
  customer: User;
  company: Company;
};

export class QuotationRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async countCompanyQuotations(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.quotation.count({
      where: { companyId },
    });
  }

  public async findProductsByIds(
    productIds: string[],
    companyId: string,
    tx?: TransactionClient,
  ): Promise<Product[]> {
    const client = tx || this.prisma;
    return client.product.findMany({
      where: {
        id: { in: productIds },
        companyId,
      },
    });
  }

  public async create(
    data: {
      companyId: string;
      creatorId: string;
      customerId: string;
      quotationNumber: string;
      status: QuotationStatus;
      quotationDate: Date;
      expiresAt: Date | null;
      currency: string;
      discountAmount: Prisma.Decimal;
      subtotal: Prisma.Decimal;
      total: Prisma.Decimal;
      notes: string | null;
    },
    items: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountPercentage: Prisma.Decimal;
      taxPercentage: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>,
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations> {
    const client = tx || this.prisma;

    const quotation = await client.quotation.create({
      data: {
        companyId: data.companyId,
        creatorId: data.creatorId,
        customerId: data.customerId,
        quotationNumber: data.quotationNumber,
        status: data.status,
        quotationDate: data.quotationDate,
        expiresAt: data.expiresAt,
        currency: data.currency,
        discountAmount: data.discountAmount,
        subtotal: data.subtotal,
        total: data.total,
        notes: data.notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
            taxPercentage: item.taxPercentage,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: true,
        customer: true,
        company: true,
      },
    });

    return quotation;
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations | null> {
    const client = tx || this.prisma;
    return client.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: true,
        customer: true,
        company: true,
      },
    });
  }

  public async findMany(
    where: Prisma.QuotationWhereInput,
    page: number = 1,
    limit: number = 20,
    tx?: TransactionClient,
  ): Promise<{ quotations: QuotationWithRelations[]; total: number }> {
    const client = tx || this.prisma;
    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      client.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          creator: true,
          customer: true,
          company: true,
        },
      }),
      client.quotation.count({ where }),
    ]);

    return { quotations, total };
  }

  public async update(
    id: string,
    data: Prisma.QuotationUpdateInput,
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations> {
    const client = tx || this.prisma;
    return client.quotation.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: true,
        customer: true,
        company: true,
      },
    });
  }

  public async updateStatus(
    id: string,
    status: QuotationStatus,
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations> {
    const client = tx || this.prisma;
    return client.quotation.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: true,
        customer: true,
        company: true,
      },
    });
  }

  public async deleteItemsByQuotationId(
    quotationId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.quotationItem.deleteMany({
      where: { quotationId },
    });
  }
}

export const quotationRepository = new QuotationRepository();
