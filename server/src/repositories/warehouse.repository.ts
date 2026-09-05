import { Prisma, PrismaClient, Warehouse } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";

export class WarehouseRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async create(
    data: {
      companyId: string;
      name: string;
      country: string;
      postalCode: string;
      addressLine: string;
    },
    tx?: TransactionClient,
  ): Promise<Warehouse> {
    const client = tx || this.prisma;
    return client.warehouse.create({ data });
  }

  public async findById(
    id: string,
    companyId?: string,
    tx?: TransactionClient,
  ): Promise<Warehouse | null> {
    const client = tx || this.prisma;
    return client.warehouse.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });
  }

  public async findMany(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    tx?: TransactionClient,
  ): Promise<{ warehouses: Warehouse[]; total: number }> {
    const client = tx || this.prisma;
    const skip = (page - 1) * limit;

    const [warehouses, total] = await Promise.all([
      client.warehouse.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      client.warehouse.count({ where: { companyId } }),
    ]);

    return { warehouses, total };
  }

  public async update(
    id: string,
    data: Prisma.WarehouseUpdateInput,
    tx?: TransactionClient,
  ): Promise<Warehouse> {
    const client = tx || this.prisma;
    return client.warehouse.update({ where: { id }, data });
  }

  public async delete(id: string, tx?: TransactionClient): Promise<Warehouse> {
    const client = tx || this.prisma;
    return client.warehouse.delete({ where: { id } });
  }
}

export const warehouseRepository = new WarehouseRepository();
