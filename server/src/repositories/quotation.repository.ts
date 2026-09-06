import {
  Prisma,
  PrismaClient,
  Quotation,
  QuotationItem,
  QuotationRevision,
  QuotationRevisionItem,
  QuotationStatus,
  DiscountType,
  RevisionType,
  RevisionStatus,
  Product,
  ProductDiscountTier,
  CustomerTier,
  User,
  Company,
  Deal,
  Negotiation,
  NegotiationItem,
  SalesOrder,
  Delivery,
  Backorder,
  Invoice,
  SalesOrderItem,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type QuotationWithRelations = Quotation & {
  items: (QuotationItem & { product: Product })[];
  currentRevision?:
    | (QuotationRevision & {
        items: (QuotationRevisionItem & { product: Product })[];
        creator: User;
      })
    | null;
  deal: Deal;
  salesRep: User;
  customer: User;
  company: Company;
  negotiations?: (Negotiation & {
    items: (NegotiationItem & { product: Product })[];
  })[];
  salesOrders?: (SalesOrder & {
    items?: (SalesOrderItem & { product?: Product | null })[];
    deliveries?: Delivery[];
    backorders?: Backorder[];
    invoices?: Invoice[];
  })[];
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

  public async countQuotations(
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.quotation.count();
  }

  public async findByQuotationNo(
    quotationNo: string,
    tx?: TransactionClient,
  ): Promise<Quotation | null> {
    const client = tx || this.prisma;
    return client.quotation.findUnique({
      where: { quotationNo },
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

  public async findProductById(
    productId: string,
    companyId: string,
    tx?: TransactionClient,
  ): Promise<Product | null> {
    const client = tx || this.prisma;
    return client.product.findFirst({
      where: {
        id: productId,
        companyId,
      },
    });
  }

  public async findProductDiscountTier(
    productId: string,
    customerTier: CustomerTier,
    tx?: TransactionClient,
  ): Promise<ProductDiscountTier | null> {
    const client = tx || this.prisma;
    return client.productDiscountTier.findUnique({
      where: {
        productId_customerTier: {
          productId,
          customerTier,
        },
      },
    });
  }

  public async createDraft(
    data: {
      companyId: string;
      dealId: string;
      salesRepId: string;
      customerId: string;
      quotationNo: string;
      validUntil: Date | null;
      currency: string;
    },
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations> {
    const client = tx || this.prisma;
    return client.quotation.create({
      data: {
        companyId: data.companyId,
        dealId: data.dealId,
        salesRepId: data.salesRepId,
        customerId: data.customerId,
        quotationNo: data.quotationNo,
        status: QuotationStatus.DRAFT,
        validUntil: data.validUntil,
        currency: data.currency,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        currentRevision: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            creator: true,
          },
        },
        deal: true,
        salesRep: true,
        customer: true,
        company: true,
      },
    });
  }

  public async addItem(
    data: {
      quotationId: string;
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountType: DiscountType;
      discountValue: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      finalUnitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    },
    tx?: TransactionClient,
  ): Promise<QuotationItem & { product: Product }> {
    const client = tx || this.prisma;
    return client.quotationItem.create({
      data: {
        quotationId: data.quotationId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        taxRate: data.taxRate,
        finalUnitPrice: data.finalUnitPrice,
        lineTotal: data.lineTotal,
      },
      include: {
        product: true,
      },
    });
  }

  public async findItemById(
    quotationId: string,
    itemId: string,
    tx?: TransactionClient,
  ): Promise<(QuotationItem & { product: Product }) | null> {
    const client = tx || this.prisma;
    return client.quotationItem.findFirst({
      where: {
        id: itemId,
        quotationId,
      },
      include: {
        product: true,
      },
    });
  }

  public async findItemsByQuotationId(
    quotationId: string,
    tx?: TransactionClient,
  ): Promise<(QuotationItem & { product: Product })[]> {
    const client = tx || this.prisma;
    return client.quotationItem.findMany({
      where: {
        quotationId,
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  public async removeItem(
    quotationId: string,
    itemId: string,
    tx?: TransactionClient,
  ): Promise<QuotationItem> {
    const client = tx || this.prisma;
    return client.quotationItem.delete({
      where: {
        id: itemId,
      },
    });
  }

  public async create(
    data: {
      companyId: string;
      dealId: string;
      salesRepId: string;
      customerId: string;
      quotationNo: string;
      status: QuotationStatus;
      validUntil: Date | null;
      currency: string;
    },
    items: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountType: DiscountType;
      discountValue: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      finalUnitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>,
    revisionData: {
      subtotal: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      totalAmount: Prisma.Decimal;
      customerNote?: string | null;
      internalNote?: string | null;
    },
    tx?: TransactionClient,
  ): Promise<QuotationWithRelations> {
    const client = tx || this.prisma;

    const quotation = await client.quotation.create({
      data: {
        companyId: data.companyId,
        dealId: data.dealId,
        salesRepId: data.salesRepId,
        customerId: data.customerId,
        quotationNo: data.quotationNo,
        status: data.status,
        validUntil: data.validUntil,
        currency: data.currency,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            finalUnitPrice: item.finalUnitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    const revision = await client.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        revisionNo: 1,
        createdById: data.salesRepId,
        revisionType: RevisionType.INITIAL,
        status:
          data.status === QuotationStatus.SENT
            ? RevisionStatus.SENT
            : RevisionStatus.DRAFT,
        subtotal: revisionData.subtotal,
        discountAmount: revisionData.discountAmount,
        taxAmount: revisionData.taxAmount,
        totalAmount: revisionData.totalAmount,
        customerNote: revisionData.customerNote || null,
        internalNote: revisionData.internalNote || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            finalUnitPrice: item.finalUnitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    const updatedQuotation = await client.quotation.update({
      where: { id: quotation.id },
      data: { currentRevisionId: revision.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        currentRevision: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            creator: true,
          },
        },
        deal: true,
        salesRep: true,
        customer: true,
        company: true,
      },
    });

    return updatedQuotation;
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
        currentRevision: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            creator: true,
          },
        },
        deal: true,
        salesRep: true,
        customer: true,
        company: true,
        negotiations: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        salesOrders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            deliveries: true,
            backorders: true,
            invoices: true,
          },
        },
      },
    });
  }

  public async findMany(
    where: Prisma.QuotationWhereInput,
    options: PaginateOptions,
  ): Promise<PaginatedResult<QuotationWithRelations>> {
    const include = {
      items: { include: { product: true } },
      currentRevision: {
        include: {
          items: { include: { product: true } },
          creator: true,
        },
      },
      deal: true,
      salesRep: true,
      customer: true,
      company: true,
      negotiations: {
        orderBy: { createdAt: "desc" as const },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      salesOrders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
          deliveries: true,
          backorders: true,
          invoices: true,
        },
      },
    };

    const prisma = this.prisma;
    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
        include?: object;
      }) =>
        prisma.quotation.findMany({
          ...args,
          include,
        }) as Promise<QuotationWithRelations[]>,
      count: (args: { where?: object }) =>
        prisma.quotation.count(args as { where?: Prisma.QuotationWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
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
        currentRevision: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            creator: true,
          },
        },
        deal: true,
        salesRep: true,
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
        currentRevision: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            creator: true,
          },
        },
        deal: true,
        salesRep: true,
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

  public async createRevision(
    quotationId: string,
    createdById: string,
    revisionType: RevisionType,
    status: RevisionStatus,
    totals: {
      subtotal: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      totalAmount: Prisma.Decimal;
      customerNote?: string | null;
      internalNote?: string | null;
    },
    items: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountType: DiscountType;
      discountValue: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      finalUnitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>,
    tx?: TransactionClient,
  ): Promise<
    QuotationRevision & {
      items: (QuotationRevisionItem & { product: Product })[];
      creator: User;
    }
  > {
    const client = tx || this.prisma;

    const count = await client.quotationRevision.count({
      where: { quotationId },
    });

    const revision = await client.quotationRevision.create({
      data: {
        quotationId,
        revisionNo: count + 1,
        createdById,
        revisionType,
        status,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        customerNote: totals.customerNote || null,
        internalNote: totals.internalNote || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            finalUnitPrice: item.finalUnitPrice,
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
      },
    });

    return revision;
  }

  public async findRevisions(
    quotationId: string,
    tx?: TransactionClient,
  ): Promise<
    (QuotationRevision & {
      items: (QuotationRevisionItem & { product: Product })[];
      creator: User;
    })[]
  > {
    const client = tx || this.prisma;
    return client.quotationRevision.findMany({
      where: { quotationId },
      orderBy: { revisionNo: "asc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: true,
      },
    });
  }

  public async findNegotiationsByQuotationId(
    quotationId: string,
    tx?: TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.negotiation.findMany({
      where: { quotationId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}

export const quotationRepository = new QuotationRepository();
