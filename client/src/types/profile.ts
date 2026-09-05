export type CompanyRole =
  | "Company Admin"
  | "Sales Representative"
  | "Sales Manager"
  | "Finance Manager"
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
  phone?: string;
  platformRole: string;
  companies: CompanyAffiliation[];
}
