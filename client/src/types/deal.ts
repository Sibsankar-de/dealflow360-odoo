import { UserResponseType } from "./auth";
import { QuotationResponse } from "./quotation";

export type DealStage =
  | "NEW"
  | "QUALIFICATION"
  | "REQUIREMENT"
  | "QUOTATION"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type DealStatus = "OPEN" | "WON" | "LOST" | "CANCELLED";

export interface DealResponseType {
  id: string;
  companyId: string;
  dealNo: string;
  customerId: string;
  salesRepId: string;
  name: string;
  stage: DealStage;
  status: DealStatus;
  expectedValue: number;
  probability: number;
  expectedCloseDate: string | null;
  source: string | null;
  quotationsCount?: number;
  quotations?: QuotationResponse[];
  customer?: UserResponseType;
  salesRep?: UserResponseType;
  company?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDealsResponse {
  docs: DealResponseType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DealListData = PaginatedDealsResponse;

export interface CreateDealRequest {
  customerId: string;
  name: string;
  expectedValue?: number;
  probability?: number;
  expectedCloseDate?: string | null;
  source?: string | null;
}

export interface UpdateDealRequest {
  customerId?: string;
  salesRepId?: string;
  name?: string;
  stage?: DealStage;
  status?: DealStatus;
  expectedValue?: number;
  probability?: number;
  expectedCloseDate?: string | null;
  source?: string | null;
}

export interface ListDealsQuery {
  customerId?: string;
  salesRepId?: string;
  stage?: DealStage;
  status?: DealStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDealQuotationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

