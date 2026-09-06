import { z } from "zod";
import {
  Company,
  CompanyUser,
  CompanyStatus,
  CompanyUserRole,
  CompanySetting,
  CustomerTier,
} from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";
import { customerDiscountTierConverter } from "../converters/companySetting.converter";
import { CustomerDiscountTierMap } from "../schemas/companySetting.schema";
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyUserSchema,
  updateCompanyUserRoleSchema,
  listCompaniesQuerySchema,
} from "../schemas/company.schema";

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
export type AddCompanyUserDto = z.infer<typeof addCompanyUserSchema>;
export type UpdateCompanyUserRoleDto = z.infer<typeof updateCompanyUserRoleSchema>;
export type ListCompaniesDto = z.infer<typeof listCompaniesQuerySchema>;

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
  customerTier?: CustomerTier | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserResponseDto;
}

export interface CompanyRoleResponseDto {
  role: CompanyUserRole;
  name: string;
  description: string;
}

export const COMPANY_ROLE_DEFINITIONS: CompanyRoleResponseDto[] = [
  {
    role: CompanyUserRole.ADMIN,
    name: "Company Admin",
    description: "Manage company configuration, products, approval rules, collaborators, and access all company data.",
  },
  {
    role: CompanyUserRole.SALES_REP,
    name: "Sales Representative",
    description: "Create quotations, manage customer discussions, request approvals, and track quotation progress.",
  },
  {
    role: CompanyUserRole.SALES_MANAGER,
    name: "Sales Manager",
    description: "Review quotations requiring managerial approval, approve or reject quotations, and escalate high-risk deals.",
  },
  {
    role: CompanyUserRole.FINANCE_MANAGER,
    name: "Finance Manager",
    description: "Review financially sensitive quotations, review fulfillment feasibility, approve fulfillment, and generate invoices.",
  },
  {
    role: CompanyUserRole.CUSTOMER,
    name: "Customer",
    description: "Review quotations received as a customer, approve, reject, or negotiate commercial proposals.",
  },
];

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
    customerTier: companyUser.customerTier ?? null,
    createdAt: companyUser.createdAt,
    updatedAt: companyUser.updatedAt,
    user: companyUser.user ? toUserDto(companyUser.user) : undefined,
  };
};
