import {
  Prisma,
  PrismaClient,
  Company,
  CompanyUser,
  CompanyUserRole,
  CompanySetting,
  CompanyConfig,
  User,
  CustomerTier,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";
import { paginate, PaginateOptions, PaginatedResult } from "../utils/paginate";

export class CompanyRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async createWithAdmin(
    companyData: {
      name: string;
      ownerId: string;
      currency?: string;
      country: string;
      postalCode: string;
      addressLine: string;
    },
    adminUserId: string,
    tx?: TransactionClient,
  ): Promise<Company & { owner?: User; settings?: CompanySetting | null }> {
    const execute = async (client: TransactionClient | PrismaClient) => {
      const company = await client.company.create({
        data: {
          name: companyData.name,
          ownerId: companyData.ownerId,
          currency: companyData.currency || "USD",
          country: companyData.country,
          postalCode: companyData.postalCode,
          addressLine: companyData.addressLine,
        },
        include: {
          owner: true,
        },
      });

      await client.companyUser.create({
        data: {
          companyId: company.id,
          userId: adminUserId,
          role: CompanyUserRole.ADMIN,
        },
      });

      const settings = await client.companySetting.create({
        data: {
          companyId: company.id,
          customerDiscountTier: {},
        },
      });

      return {
        ...company,
        settings,
      };
    };

    if (tx) {
      return execute(tx);
    }
    return prismaTransaction(async (transactionClient) => execute(transactionClient));
  }

  public async findById(
    id: string,
    includeDeleted: boolean = false,
    tx?: TransactionClient,
  ): Promise<(Company & { owner?: User; settings?: CompanySetting | null }) | null> {
    const client = tx || this.prisma;
    return client.company.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        owner: true,
        settings: true,
      },
    });
  }

  public async findPaginated(
    where: Prisma.CompanyWhereInput,
    orderBy: Prisma.CompanyOrderByWithRelationInput | Prisma.CompanyOrderByWithRelationInput[],
    options: PaginateOptions,
    tx?: TransactionClient,
  ): Promise<
    PaginatedResult<
      Company & {
        owner?: User;
        settings?: CompanySetting | null;
      }
    >
  > {
    const client = tx || this.prisma;
    return paginate<
      Company & {
        owner?: User;
        settings?: CompanySetting | null;
      }
    >(
      client.company,
      where,
      orderBy,
      options,
      {
        owner: true,
        settings: true,
      },
    );
  }

  public async findUserCompanies(userId: string): Promise<
    Array<{
      company: Company & { owner?: User; settings?: CompanySetting | null };
      role: CompanyUserRole;
    }>
  > {
    const memberships = await this.prisma.companyUser.findMany({
      where: {
        userId,
        company: {
          deletedAt: null,
        },
      },
      include: {
        company: {
          include: {
            owner: true,
            settings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return memberships.map((membership) => ({
      company: membership.company,
      role: membership.role,
    }));
  }

  public async findUserCompanyMemberships(
    userId: string,
    companyIds: string[],
    tx?: TransactionClient,
  ): Promise<CompanyUser[]> {
    const client = tx || this.prisma;
    if (companyIds.length === 0) {
      return [];
    }
    return client.companyUser.findMany({
      where: {
        userId,
        companyId: { in: companyIds },
      },
    });
  }

  public async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
    tx?: TransactionClient,
  ): Promise<Company & { owner?: User; settings?: CompanySetting | null }> {
    const client = tx || this.prisma;
    return client.company.update({
      where: { id },
      data,
      include: {
        owner: true,
        settings: true,
      },
    });
  }

  public async findCompanyUser(
    companyId: string,
    userId: string,
    tx?: TransactionClient,
  ): Promise<CompanyUser | null> {
    const client = tx || this.prisma;
    return client.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
  }

  public async listCompanyUsers(
    companyId: string,
  ): Promise<Array<CompanyUser & { user: User }>> {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  public async findCompanyUsersByRole(
    companyId: string,
    roles: CompanyUserRole | CompanyUserRole[],
    tx?: TransactionClient,
  ): Promise<Array<CompanyUser & { user: User }>> {
    const client = tx || this.prisma;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return client.companyUser.findMany({
      where: {
        companyId,
        role: { in: roleList },
      },
      include: {
        user: true,
      },
    });
  }

  public async addCompanyUser(
    companyId: string,
    userId: string,
    role: CompanyUserRole,
    customerTier?: CustomerTier | null,
  ): Promise<CompanyUser & { user: User }> {
    return this.prisma.companyUser.create({
      data: {
        companyId,
        userId,
        role,
        customerTier:
          customerTier ??
          (role === CompanyUserRole.CUSTOMER ? CustomerTier.BRONZE : null),
      },
      include: {
        user: true,
      },
    });
  }

  public async updateCompanyUserCustomerTier(
    companyId: string,
    userId: string,
    customerTier: CustomerTier,
  ): Promise<CompanyUser & { user: User }> {
    return this.prisma.companyUser.update({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      data: {
        customerTier,
      },
      include: {
        user: true,
      },
    });
  }

  public async updateCompanyUserRole(
    companyId: string,
    userId: string,
    role: CompanyUserRole,
    customerTier?: CustomerTier | null,
  ): Promise<CompanyUser & { user: User }> {
    return this.prisma.companyUser.update({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      data: {
        role,
        ...(customerTier !== undefined ? { customerTier } : {}),
      },
      include: {
        user: true,
      },
    });
  }

  public async removeCompanyUser(
    companyId: string,
    userId: string,
  ): Promise<CompanyUser> {
    return this.prisma.companyUser.delete({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
  }

  public async findSettings(
    companyId: string,
    tx?: TransactionClient,
  ): Promise<CompanySetting | null> {
    const client = tx || this.prisma;
    return client.companySetting.findUnique({
      where: { companyId },
    });
  }

  public async updateSettings(
    companyId: string,
    data: Prisma.CompanySettingUpdateInput,
    tx?: TransactionClient,
  ): Promise<CompanySetting> {
    const client = tx || this.prisma;
    return client.companySetting.upsert({
      where: { companyId },
      update: data,
      create: {
        companyId,
        customerDiscountTier: (data.customerDiscountTier as Prisma.InputJsonValue) || {},
      },
    });
  }

  public async findConfig(
    companyId: string,
    configKey: string,
    tx?: TransactionClient,
  ): Promise<CompanyConfig | null> {
    const client = tx || this.prisma;
    return client.companyConfig.findUnique({
      where: {
        companyId_configKey: {
          companyId,
          configKey,
        },
      },
    });
  }

  public async upsertConfig(
    companyId: string,
    configKey: string,
    configValue: string,
    tx?: TransactionClient,
  ): Promise<CompanyConfig> {
    const client = tx || this.prisma;
    return client.companyConfig.upsert({
      where: {
        companyId_configKey: {
          companyId,
          configKey,
        },
      },
      update: { configValue },
      create: { companyId, configKey, configValue },
    });
  }
}

export const companyRepository = new CompanyRepository();
