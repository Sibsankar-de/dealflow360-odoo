import { CompanyStatus, CompanyUserRole, CompanySetting } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepository,
} from "../repositories/company.repository";
import {
  UserRepository,
  userRepository as defaultUserRepository,
} from "../repositories/user.repository";
import { ApiError } from "../utils/apiErrorHandler";
import {
  CompanyResponseDto,
  CompanySettingResponseDto,
  CompanyUserResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  AddCompanyUserDto,
  UpdateCompanyUserRoleDto,
  toCompanyDto,
  toCompanySettingDto,
  toCompanyUserDto,
} from "../dto/company.dto";
import { UpdateCompanySettingInput } from "../schemas/companySetting.schema";
import { customerDiscountTierConverter } from "../converters/companySetting.converter";
import { prismaTransaction } from "../utils/transactionHandler";
import { CompanyWithRelations } from "../types/express";

export class CompanyService {
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;

  public constructor(
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
  ) {
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
  }

  public async createCompany(
    userId: string,
    dto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return prismaTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
      }

      const company = await this.companyRepo.createWithAdmin(
        {
          name: dto.name,
          ownerId: userId,
          currency: dto.currency || "USD",
          country: dto.country,
          postalCode: dto.postalCode,
          addressLine: dto.addressLine,
        },
        userId,
        tx,
      );

      return toCompanyDto(company, CompanyUserRole.ADMIN);
    });
  }

  public getCompanyDetails(
    company: CompanyWithRelations,
    userRole?: CompanyUserRole,
  ): CompanyResponseDto {
    return toCompanyDto(company, userRole);
  }

  public async getCompanyById(
    companyId: string,
    requestingUserId: string,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const membership = await this.companyRepo.findCompanyUser(
      companyId,
      requestingUserId,
    );

    if (!membership && company.ownerId !== requestingUserId) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You do not have access to this company",
      );
    }

    const role =
      membership?.role ||
      (company.ownerId === requestingUserId
        ? CompanyUserRole.ADMIN
        : undefined);
    return toCompanyDto(company, role);
  }

  public async getUserCompanies(userId: string): Promise<CompanyResponseDto[]> {
    const results = await this.companyRepo.findUserCompanies(userId);
    return results.map((item) => toCompanyDto(item.company, item.role));
  }

  public async updateCompany(
    company: CompanyWithRelations,
    dto: UpdateCompanyDto,
    userRole: CompanyUserRole = CompanyUserRole.ADMIN,
  ): Promise<CompanyResponseDto> {
    let deletedAt = company.deletedAt;
    if (
      dto.status === CompanyStatus.DELETED &&
      company.status !== CompanyStatus.DELETED
    ) {
      deletedAt = new Date();
    } else if (
      dto.status &&
      dto.status !== CompanyStatus.DELETED &&
      company.status === CompanyStatus.DELETED
    ) {
      deletedAt = null;
    }

    const updatedCompany = await this.companyRepo.update(company.id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.addressLine !== undefined
        ? { addressLine: dto.addressLine }
        : {}),
      deletedAt,
    });

    return toCompanyDto(updatedCompany, userRole);
  }

  public async listCompanyUsers(
    companyId: string,
  ): Promise<CompanyUserResponseDto[]> {
    const members = await this.companyRepo.listCompanyUsers(companyId);
    return members.map(toCompanyUserDto);
  }

  public async addCompanyUser(
    companyId: string,
    dto: AddCompanyUserDto,
  ): Promise<CompanyUserResponseDto> {
    const targetUser = await this.userRepo.findByEmail(dto.userEmail);
    if (!targetUser) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User with this email not found",
      );
    }

    const existingMembership = await this.companyRepo.findCompanyUser(
      companyId,
      targetUser.id,
    );
    if (existingMembership) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "User is already a member of this company",
      );
    }

    const member = await this.companyRepo.addCompanyUser(
      companyId,
      targetUser.id,
      dto.role,
    );

    return toCompanyUserDto(member);
  }

  public async updateCompanyUserRole(
    company: CompanyWithRelations,
    dto: UpdateCompanyUserRoleDto,
  ): Promise<CompanyUserResponseDto> {
    const targetUser = await this.userRepo.findByEmail(dto.userEmail);
    if (!targetUser) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User with this email not found",
      );
    }

    const membership = await this.companyRepo.findCompanyUser(
      company.id,
      targetUser.id,
    );
    if (!membership) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not a member of this company",
      );
    }

    if (
      company.ownerId === targetUser.id &&
      dto.role !== CompanyUserRole.ADMIN
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot change role of company owner from ADMIN",
      );
    }

    const updated = await this.companyRepo.updateCompanyUserRole(
      company.id,
      targetUser.id,
      dto.role,
    );

    return toCompanyUserDto(updated);
  }

  public async removeCompanyUser(
    company: CompanyWithRelations,
    targetUserId: string,
    requestingUserId: string,
    userRole?: CompanyUserRole,
  ): Promise<void> {
    if (company.ownerId === targetUserId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot remove the company owner from the company",
      );
    }

    if (
      requestingUserId !== targetUserId &&
      userRole !== CompanyUserRole.ADMIN
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Only company admins can remove other members",
      );
    }

    const membership = await this.companyRepo.findCompanyUser(
      company.id,
      targetUserId,
    );
    if (!membership) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not a member of this company",
      );
    }

    await this.companyRepo.removeCompanyUser(company.id, targetUserId);
  }

  public async getCompanySettings(
    companyId: string,
    initialSettings?: CompanySetting | null,
  ): Promise<CompanySettingResponseDto> {
    let settings =
      initialSettings || (await this.companyRepo.findSettings(companyId));
    if (!settings) {
      settings = await this.companyRepo.updateSettings(companyId, {
        customerDiscountTier: {},
      });
    }

    return toCompanySettingDto(settings);
  }

  public async updateCompanySettings(
    companyId: string,
    dto: UpdateCompanySettingInput,
  ): Promise<CompanySettingResponseDto> {
    const existingSettings = await this.companyRepo.findSettings(companyId);
    const existingTierMap = existingSettings
      ? customerDiscountTierConverter(existingSettings.customerDiscountTier)
      : {};

    const mergedTierMap = {
      ...existingTierMap,
      ...(dto.customerDiscountTier || {}),
    };

    const updated = await this.companyRepo.updateSettings(companyId, {
      customerDiscountTier: mergedTierMap,
    });

    return toCompanySettingDto(updated);
  }
}

export const companyService = new CompanyService();
