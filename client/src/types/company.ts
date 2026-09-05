export type BackendCompanyRole =
  | "ADMIN"
  | "SALES_REP"
  | "SALES_MANAGER"
  | "FINANCE_MANAGER"
  | "CUSTOMER";

export type CompanyStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export interface CompanySettingType {
  id: string;
  companyId: string;
  customerDiscountTier: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyResponseType {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  status: CompanyStatusType;
  country: string;
  postalCode: string;
  addressLine: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userRole?: BackendCompanyRole;
  settings?: CompanySettingType;
}

export interface PaginatedCompaniesResponse {
  docs: CompanyResponseType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserCompaniesData =
  | { companies: CompanyResponseType[] }
  | PaginatedCompaniesResponse
  | CompanyResponseType[];

export interface CompanyMemberType {
  id: string;
  companyId: string;
  userId: string;
  role: BackendCompanyRole;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    userName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

export interface CreateCompanyRequest {
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
  currency?: string;
}

export interface AddCompanyUserRequest {
  userEmail: string;
  role: BackendCompanyRole;
}

export interface UpdateCompanyUserRoleRequest {
  userEmail: string;
  role: BackendCompanyRole;
}

