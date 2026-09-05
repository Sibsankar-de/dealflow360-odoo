import { CompanyStatus, CompanyUserRole } from "@prisma/client";
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
  CompanyUserResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  AddCompanyUserDto,
  UpdateCompanyUserRoleDto,
  toCompanyDto,
  toCompanyUserDto,
} from "../dto/company.dto";

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
    const user = await this.userRepo.findById(userId);
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
    );

    return toCompanyDto(company, CompanyUserRole.ADMIN);
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

    const role = membership?.role || (company.ownerId === requestingUserId ? CompanyUserRole.ADMIN : undefined);
    return toCompanyDto(company, role);
  }

  public async getUserCompanies(
    userId: string,
  ): Promise<CompanyResponseDto[]> {
    const results = await this.companyRepo.findUserCompanies(userId);
    return results.map((item) => toCompanyDto(item.company, item.role));
  }

  public async updateCompany(
    companyId: string,
    requestingUserId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    await this.assertCompanyAdmin(companyId, requestingUserId, company.ownerId);

    let deletedAt = company.deletedAt;
    if (dto.status === CompanyStatus.DELETED && company.status !== CompanyStatus.DELETED) {
      deletedAt = new Date();
    } else if (dto.status && dto.status !== CompanyStatus.DELETED && company.status === CompanyStatus.DELETED) {
      deletedAt = null;
    }

    const updatedCompany = await this.companyRepo.update(companyId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.addressLine !== undefined ? { addressLine: dto.addressLine } : {}),
      deletedAt,
    });

    const membership = await this.companyRepo.findCompanyUser(
      companyId,
      requestingUserId,
    );

    return toCompanyDto(updatedCompany, membership?.role || CompanyUserRole.ADMIN);
  }

  public async listCompanyUsers(
    companyId: string,
    requestingUserId: string,
  ): Promise<CompanyUserResponseDto[]> {
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

    const members = await this.companyRepo.listCompanyUsers(companyId);
    return members.map(toCompanyUserDto);
  }

  public async addCompanyUser(
    companyId: string,
    requestingUserId: string,
    dto: AddCompanyUserDto,
  ): Promise<CompanyUserResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    await this.assertCompanyAdmin(companyId, requestingUserId, company.ownerId);

    const targetUser = await this.userRepo.findByEmail(dto.userEmail);
    if (!targetUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User with this email not found");
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
    companyId: string,
    requestingUserId: string,
    dto: UpdateCompanyUserRoleDto,
  ): Promise<CompanyUserResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    await this.assertCompanyAdmin(companyId, requestingUserId, company.ownerId);

    const targetUser = await this.userRepo.findByEmail(dto.userEmail);
    if (!targetUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User with this email not found");
    }

    const membership = await this.companyRepo.findCompanyUser(
      companyId,
      targetUser.id,
    );
    if (!membership) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not a member of this company",
      );
    }

    if (company.ownerId === targetUser.id && dto.role !== CompanyUserRole.ADMIN) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot change role of company owner from ADMIN",
      );
    }

    const updated = await this.companyRepo.updateCompanyUserRole(
      companyId,
      targetUser.id,
      dto.role,
    );

    return toCompanyUserDto(updated);
  }

  public async removeCompanyUser(
    companyId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    if (company.ownerId === targetUserId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot remove the company owner from the company",
      );
    }

    if (requestingUserId !== targetUserId) {
      await this.assertCompanyAdmin(companyId, requestingUserId, company.ownerId);
    }

    const membership = await this.companyRepo.findCompanyUser(
      companyId,
      targetUserId,
    );
    if (!membership) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User is not a member of this company",
      );
    }

    await this.companyRepo.removeCompanyUser(companyId, targetUserId);
  }

  private async assertCompanyAdmin(
    companyId: string,
    userId: string,
    ownerId: string,
  ): Promise<void> {
    if (userId === ownerId) {
      return;
    }

    const membership = await this.companyRepo.findCompanyUser(
      companyId,
      userId,
    );

    if (!membership || membership.role !== CompanyUserRole.ADMIN) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Only company admins can perform this action",
      );
    }
  }
}

export const companyService = new CompanyService();
