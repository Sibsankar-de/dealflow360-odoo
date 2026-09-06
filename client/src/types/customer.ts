import { BackendCompanyRole } from "./company";

export type CustomerTier = "BRONZE" | "SILVER" | "GOLD";

export interface CustomerResponseType {
  id: string;
  companyUserId?: string | null;
  companyId: string;
  name: string;
  email: string;
  avatar: string | null;
  customerTier: CustomerTier | null;
  role: BackendCompanyRole;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummaryResponseType {
  id: string;
  companyUserId?: string | null;
  companyId: string;
  name: string;
  email: string;
  avatar: string | null;
  customerTier: CustomerTier | null;
  role: BackendCompanyRole;
}

export interface PaginatedCustomersResponse {
  docs: CustomerResponseType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CustomerListData = PaginatedCustomersResponse;

export interface ListCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  customerTier?: CustomerTier;
}

export interface AddCustomerRequest {
  userEmail: string;
  customerTier?: CustomerTier | null;
  role?: BackendCompanyRole;
}

export interface CustomerDealItem {
  id: string;
  dealNo: string;
  name: string;
  companyName: string;
  expiryDate: string;
  expectedValue: number;
  stage: import("./deal").DealStage;
  status: import("./deal").DealStatus;
  probability: number;
  quotationsCount: number;
  description: string;
}

