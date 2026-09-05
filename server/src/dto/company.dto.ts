import {
  Company,
  CompanyUser,
  CompanyStatus,
  CompanyUserRole,
  CompanySetting,
} from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";
import { customerDiscountTierConverter } from "../converters/companySetting.converter";
import { CustomerDiscountTierMap } from "../schemas/companySetting.schema";

export interface CompanySettingResponseDto {
  id: string;
  companyId: string;
  customerDiscountTier: CustomerDiscountTierMap;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyResponseDto {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  status: CompanyStatus;
  country: string;
  postalCode: string;
  addressLine: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  owner?: UserResponseDto;
  userRole?: CompanyUserRole;
  settings?: CompanySettingResponseDto;
}

export interface CompanyUserResponseDto {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyUserRole;
  createdAt: Date;
  updatedAt: Date;
  user?: UserResponseDto;
}

export interface CreateCompanyDto {
  name: string;
  currency?: string;
  country: string;
  postalCode: string;
  addressLine: string;
}

export interface UpdateCompanyDto {
  name?: string;
  currency?: string;
  status?: CompanyStatus;
  country?: string;
  postalCode?: string;
  addressLine?: string;
}

export interface AddCompanyUserDto {
  userEmail: string;
  role: CompanyUserRole;
}

export interface UpdateCompanyUserRoleDto {
  userEmail: string;
  role: CompanyUserRole;
}

export const toCompanySettingDto = (
  setting: CompanySetting,
): CompanySettingResponseDto => {
  return {
    id: setting.id,
    companyId: setting.companyId,
    customerDiscountTier: customerDiscountTierConverter(setting.customerDiscountTier),
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
};

export const toCompanyDto = (
  company: Company & {
    owner?: Parameters<typeof toUserDto>[0];
    settings?: CompanySetting | null;
  },
  userRole?: CompanyUserRole,
): CompanyResponseDto => {
  return {
    id: company.id,
    name: company.name,
    ownerId: company.ownerId,
    currency: company.currency,
    status: company.status,
    country: company.country,
    postalCode: company.postalCode,
    addressLine: company.addressLine,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    deletedAt: company.deletedAt,
    owner: company.owner ? toUserDto(company.owner) : undefined,
    userRole,
    settings: company.settings ? toCompanySettingDto(company.settings) : undefined,
  };
};

export const toCompanyUserDto = (
  companyUser: CompanyUser & {
    user?: Parameters<typeof toUserDto>[0];
  },
): CompanyUserResponseDto => {
  return {
    id: companyUser.id,
    companyId: companyUser.companyId,
    userId: companyUser.userId,
    role: companyUser.role,
    createdAt: companyUser.createdAt,
    updatedAt: companyUser.updatedAt,
    user: companyUser.user ? toUserDto(companyUser.user) : undefined,
  };
};
