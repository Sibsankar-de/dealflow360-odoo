import {
  Prisma,
  PrismaClient,
  Deal,
  DealStage,
  DealStatus,
  User,
  Company,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type DealWithRelations = Deal & {
  customer: User;
  salesRep: User;
  company: Company;
};

export class DealRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  private get include() {
    return {
      customer: true,
      salesRep: true,
      company: true,
    } as const;
  }

  public async create(
    data: {
      companyId: string;
      customerId: string;
      salesRepId: string;
      dealNo: string;
      name: string;
      expectedValue: Prisma.Decimal;
      probability: Prisma.Decimal;
      expectedCloseDate: Date | null;
      source: string | null;
      stage: DealStage;
      status: DealStatus;
    },
    tx?: TransactionClient,
  ): Promise<DealWithRelations> {
    const client = tx || this.prisma;
    return client.deal.create({
      data: {
        companyId: data.companyId,
        customerId: data.customerId,
        salesRepId: data.salesRepId,
        dealNo: data.dealNo,
        name: data.name,
        expectedValue: data.expectedValue,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate,
        source: data.source,
        stage: data.stage,
        status: data.status,
      },
      include: this.include,
    });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<DealWithRelations | null> {
    const client = tx || this.prisma;
    return client.deal.findUnique({
      where: { id },
      include: this.include,
    });
  }

  public async findByDealNo(
    dealNo: string,
    tx?: TransactionClient,
  ): Promise<Deal | null> {
    const client = tx || this.prisma;
    return client.deal.findUnique({ where: { dealNo } });
  }

  public async countByCompany(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.deal.count({ where: { companyId } });
  }

  public async update(
    id: string,
    data: Prisma.DealUpdateInput,
    tx?: TransactionClient,
  ): Promise<DealWithRelations> {
    const client = tx || this.prisma;
    return client.deal.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  public async findMany(
    where: Prisma.DealWhereInput,
    options: PaginateOptions,
  ): Promise<PaginatedResult<DealWithRelations>> {
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
        prisma.deal.findMany({
          ...args,
          include,
        }) as Promise<DealWithRelations[]>,
      count: (args: { where?: object }) =>
        prisma.deal.count(args as { where?: Prisma.DealWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }
}

export const dealRepository = new DealRepository();
