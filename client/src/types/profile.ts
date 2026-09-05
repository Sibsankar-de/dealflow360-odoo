import { BackendCompanyRole, CompanyResponseType } from "./company";

export type CompanyRole =
  | "Company Admin"
  | "Sales Representative"
  | "Sales Manager"
  | "Finance Manager"
  | "Customer"
  | "User";

export interface CompanyAffiliation {
  id: string;
  name: string;
  role: CompanyRole;
  code?: string;
  country?: string;
  postalCode?: string;
  addressLine?: string;
  currency?: string;
  joinedAt?: string;
  status?: "Active" | "Pending" | "Inactive";
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  platformRole: string;
  companies: CompanyAffiliation[];
}

export const BACKEND_TO_FRONTEND_ROLE: Record<BackendCompanyRole, CompanyRole> = {
  ADMIN: "Company Admin",
  SALES_REP: "Sales Representative",
  SALES_MANAGER: "Sales Manager",
  FINANCE_MANAGER: "Finance Manager",
  CUSTOMER: "Customer",
};

export const mapCompanyResponseToAffiliation = (
  company: CompanyResponseType
): CompanyAffiliation => {
  const role = company.userRole
    ? BACKEND_TO_FRONTEND_ROLE[company.userRole] || "User"
    : "Company Admin";

  const code = company.name
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 6)
    .toUpperCase();

  const joinedAt = company.createdAt
    ? new Date(company.createdAt).toISOString().split("T")[0]
    : undefined;

  const status: "Active" | "Pending" | "Inactive" =
    company.status === "ACTIVE"
      ? "Active"
      : company.status === "INACTIVE"
      ? "Inactive"
      : "Pending";

  return {
    id: company.id,
    name: company.name,
    role,
    code,
    country: company.country,
    postalCode: company.postalCode,
    addressLine: company.addressLine,
    currency: company.currency,
    joinedAt,
    status,
  };
};

