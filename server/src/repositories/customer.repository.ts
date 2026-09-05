import {
  Prisma,
  PrismaClient,
  User,
  CompanyUser,
  CustomerTier,
  CompanyUserRole,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { paginate, PaginatedResult, PaginateOptions } from "../utils/paginate";

export type CustomerWithRelations = User & {
  companyUsers: CompanyUser[];
};

export class CustomerRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async findCustomers(
    companyId: string,
    filters: { search?: string; customerTier?: CustomerTier },
    options: PaginateOptions,
  ): Promise<PaginatedResult<CustomerWithRelations>> {
    const where: Prisma.UserWhereInput = {
      OR: [
        {
          companyUsers: {
            some: {
              companyId,
              role: CompanyUserRole.CUSTOMER,
              ...(filters.customerTier
                ? { customerTier: filters.customerTier }
                : {}),
            },
          },
        },
        {
          dealsAsCustomer: {
            some: {
              companyId,
            },
          },
        },
        {
          receivedQuotations: {
            some: {
              companyId,
            },
          },
        },
      ],
    };

    if (filters.search) {
      where.AND = [
        {
          OR: [
            {
              userName: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      ];
    }

    const include = {
      companyUsers: {
        where: { companyId },
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
        prisma.user.findMany({
          ...args,
          include,
        }) as Promise<CustomerWithRelations[]>,
      count: (args: { where?: object }) =>
        prisma.user.count(args as { where?: Prisma.UserWhereInput }),
    };

    return paginate(model, where, { createdAt: "desc" }, options);
  }

  public async findById(
    companyId: string,
    customerId: string,
  ): Promise<CustomerWithRelations | null> {
    return this.prisma.user.findFirst({
      where: {
        id: customerId,
        OR: [
          {
            companyUsers: {
              some: {
                companyId,
                role: CompanyUserRole.CUSTOMER,
              },
            },
          },
          {
            dealsAsCustomer: {
              some: {
                companyId,
              },
            },
          },
          {
            receivedQuotations: {
              some: {
                companyId,
              },
            },
          },
        ],
      },
      include: {
        companyUsers: {
          where: { companyId },
        },
      },
    });
  }
}

export const customerRepository = new CustomerRepository();
