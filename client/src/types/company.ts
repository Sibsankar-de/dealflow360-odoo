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

export interface CreateCompanyRequest {
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
  currency?: string;
}
