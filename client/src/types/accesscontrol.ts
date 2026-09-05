import { BackendCompanyRole, CompanyMemberType } from "./company";

export interface RoleDefinition {
  role: BackendCompanyRole;
  name: string;
  description: string;
}

export const INVITABLE_COMPANY_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "SALES_REP",
    name: "Sales Representative",
    description: "Create quotations, manage customer discussions, request approvals, and track quotation progress.",
  },
  {
    role: "SALES_MANAGER",
    name: "Sales Manager",
    description: "Review quotations requiring managerial approval, approve or reject quotations, and escalate high-risk deals.",
  },
  {
    role: "FINANCE_MANAGER",
    name: "Finance Manager",
    description: "Review financially sensitive quotations, review fulfillment feasibility, approve fulfillment, and generate invoices.",
  },
];

export const COMPANY_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "ADMIN",
    name: "Company Admin",
    description: "Manage company configuration, products, approval rules, collaborators, and access all company data.",
  },
  ...INVITABLE_COMPANY_ROLE_DEFINITIONS,
  {
    role: "CUSTOMER",
    name: "Customer",
    description: "Review quotations received as a customer, approve, reject, or negotiate commercial proposals.",
  },
];

export const ROLE_LABELS: Record<BackendCompanyRole, string> = {
  ADMIN: "Company Admin",
  SALES_REP: "Sales Representative",
  SALES_MANAGER: "Sales Manager",
  FINANCE_MANAGER: "Finance Manager",
  CUSTOMER: "Customer",
};

export const ROLE_BADGE_VARIANTS: Record<
  BackendCompanyRole,
  "primary" | "warning" | "purple" | "info" | "secondary"
> = {
  ADMIN: "purple",
  SALES_REP: "primary",
  SALES_MANAGER: "warning",
  FINANCE_MANAGER: "purple",
  CUSTOMER: "secondary",
};

export type { BackendCompanyRole, CompanyMemberType };

