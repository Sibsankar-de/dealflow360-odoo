import { Prisma, PrismaClient, Category } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type CategoryWithRelations = Category & {
  _count?: {
    products?: number;
  };
};

export class CategoryRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  private get include() {
    return {
      _count: {
        select: {
          products: true,
        },
      },
    } as const;
  }

  public async create(
    data: {
      companyId: string;
      name: string;
      description?: string | null;
    },
    tx?: TransactionClient,
  ): Promise<CategoryWithRelations> {
    const client = tx || this.prisma;
    return client.category.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description ?? null,
      },
      include: this.include,
    });
  }

  public async findById(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<CategoryWithRelations | null> {
    const client = tx || this.prisma;
    return client.category.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: this.include,
    });
  }

  public async findByName(
    companyId: string,
    name: string,
    tx?: TransactionClient,
  ): Promise<Category | null> {
    const client = tx || this.prisma;
    return client.category.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    });
  }

  public async findByIds(
    ids: string[],
    companyId: string,
    tx?: TransactionClient,
  ): Promise<Category[]> {
    const client = tx || this.prisma;
    if (ids.length === 0) {
      return [];
    }
    return client.category.findMany({
      where: {
        id: { in: ids },
        companyId,
      },
    });
  }

  public async update(
    id: string,
    data: Prisma.CategoryUpdateInput,
    tx?: TransactionClient,
  ): Promise<CategoryWithRelations> {
    const client = tx || this.prisma;
    return client.category.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  public async delete(
    id: string,
    tx?: TransactionClient,
  ): Promise<Category> {
    const client = tx || this.prisma;
    return client.category.delete({
      where: { id },
    });
  }

  public async findMany(
    where: Prisma.CategoryWhereInput,
    options: PaginateOptions,
  ): Promise<PaginatedResult<CategoryWithRelations>> {
    const include = this.include;
    const prisma = this.prisma;

    const model = {
      findMany: (args: {
        where?: object;
        orderBy?: object | object[];
        skip?: number;
        take?: number;
        include?: object;
      }) =>
        prisma.category.findMany({
          ...args,
          include,
        }) as Promise<CategoryWithRelations[]>,
      count: (args: { where?: object }) =>
        prisma.category.count(args as { where?: Prisma.CategoryWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const categoryRepository = new CategoryRepository();
