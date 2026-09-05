import {
  Prisma,
  PrismaClient,
  Company,
  CompanyUser,
  CompanyUserRole,
  User,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";

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
  ): Promise<Company & { owner?: User }> {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
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

      await tx.companyUser.create({
        data: {
          companyId: company.id,
          userId: adminUserId,
          role: CompanyUserRole.ADMIN,
        },
      });

      return company;
    });
  }

  public async findById(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<(Company & { owner?: User }) | null> {
    return this.prisma.company.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        owner: true,
      },
    });
  }

  public async findUserCompanies(userId: string): Promise<
    Array<{
      company: Company & { owner?: User };
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
  ): Promise<Company & { owner?: User }> {
    return this.prisma.company.update({
      where: { id },
      data,
      include: {
        owner: true,
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
}

export const companyRepository = new CompanyRepository();
