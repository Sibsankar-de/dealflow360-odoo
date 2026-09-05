import {
  Prisma,
  PrismaClient,
  Company,
  CompanyUser,
  CompanyUserRole,
  CompanySetting,
  User,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";

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
  ): Promise<(Company & { owner?: User; settings?: CompanySetting | null }) | null> {
    return this.prisma.company.findFirst({
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

  public async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
  ): Promise<Company & { owner?: User; settings?: CompanySetting | null }> {
    return this.prisma.company.update({
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
  ): Promise<CompanyUser | null> {
    return this.prisma.companyUser.findUnique({
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

  public async addCompanyUser(
    companyId: string,
    userId: string,
    role: CompanyUserRole,
  ): Promise<CompanyUser & { user: User }> {
    return this.prisma.companyUser.create({
      data: {
        companyId,
        userId,
        role,
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
}

export const companyRepository = new CompanyRepository();
