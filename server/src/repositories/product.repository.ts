import {
  Prisma,
  PrismaClient,
  Product,
  ProductStock,
  ProductDiscountTier,
  ProductType,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";

export type ProductWithRelations = Product & {
  productStocks: ProductStock[];
  discountTiers: ProductDiscountTier[];
};

export class ProductRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async create(
    data: {
      companyId: string;
      name: string;
      description?: string | null;
      price: Prisma.Decimal;
      baseUnit?: string;
      type?: ProductType;
    },
    stocks: Array<{ warehouseId: string; stockQty: Prisma.Decimal }> = [],
    tx?: TransactionClient,
  ): Promise<ProductWithRelations> {
    const client = tx || this.prisma;

    const product = await client.product.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        baseUnit: data.baseUnit ?? "UNIT",
        type: data.type ?? ProductType.ONE_TIME,
        productStocks: {
          create: stocks.map((s) => ({
            warehouseId: s.warehouseId,
            stockQty: s.stockQty,
          })),
        },
      },
      include: {
        productStocks: true,
        discountTiers: true,
      },
    });

    return product;
  }

  public async findById(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<ProductWithRelations | null> {
    const client = tx || this.prisma;
    return client.product.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        productStocks: true,
        discountTiers: true,
      },
    });
  }

  public async findMany(
    companyId: string,
    filters: { type?: ProductType; search?: string },
    page: number = 1,
    limit: number = 20,
    tx?: TransactionClient,
  ): Promise<{ products: ProductWithRelations[]; total: number }> {
    const client = tx || this.prisma;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      companyId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.search
        ? {
            name: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      client.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          productStocks: true,
          discountTiers: true,
        },
      }),
      client.product.count({ where }),
    ]);

    return { products, total };
  }

  public async update(
    id: string,
    data: Prisma.ProductUpdateInput,
    tx?: TransactionClient,
  ): Promise<ProductWithRelations> {
    const client = tx || this.prisma;
    return client.product.update({
      where: { id },
      data,
      include: {
        productStocks: true,
        discountTiers: true,
      },
    });
  }

  public async delete(id: string, tx?: TransactionClient): Promise<Product> {
    const client = tx || this.prisma;
    return client.product.delete({ where: { id } });
  }

  public async upsertStock(
    productId: string,
    warehouseId: string,
    stockQty: Prisma.Decimal,
    tx?: TransactionClient,
  ): Promise<ProductStock> {
    const client = tx || this.prisma;
    return client.productStock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { stockQty },
      create: { productId, warehouseId, stockQty },
    });
  }

  public async deleteStock(
    productId: string,
    warehouseId: string,
    tx?: TransactionClient,
  ): Promise<ProductStock> {
    const client = tx || this.prisma;
    return client.productStock.delete({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
  }
}

export const productRepository = new ProductRepository();
