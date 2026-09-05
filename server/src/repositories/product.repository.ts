import {
  Prisma,
  PrismaClient,
  Product,
  ProductStock,
  ProductDiscountTier,
  ProductType,
  Category,
  CategoryProduct,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";

export type ProductWithRelations = Product & {
  productStocks: ProductStock[];
  discountTiers: ProductDiscountTier[];
  categories: (CategoryProduct & { category: Category })[];
};

export class ProductRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  private get include() {
    return {
      productStocks: true,
      discountTiers: true,
      categories: {
        include: {
          category: true,
        },
      },
    } as const;
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
    categoryIds: string[] = [],
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
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
      include: this.include,
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
      include: this.include,
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
        include: this.include,
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
      include: this.include,
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

  public async addOrRemoveCategories(
    productId: string,
    categoryIdList: string[],
    tx?: TransactionClient,
  ): Promise<(CategoryProduct & { category: Category })[]> {
    const client = tx || this.prisma;

    const existing = await client.categoryProduct.findMany({
      where: { productId },
      select: { categoryId: true },
    });
    const existingIds = existing.map((e) => e.categoryId);

    const toAdd = categoryIdList.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !categoryIdList.includes(id));

    if (toRemove.length > 0) {
      await client.categoryProduct.deleteMany({
        where: {
          productId,
          categoryId: { in: toRemove },
        },
      });
    }

    if (toAdd.length > 0) {
      await client.categoryProduct.createMany({
        data: toAdd.map((categoryId) => ({
          productId,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    return client.categoryProduct.findMany({
      where: { productId },
      include: { category: true },
    });
  }
}

export const productRepository = new ProductRepository();
