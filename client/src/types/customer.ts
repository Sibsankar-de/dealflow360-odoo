import { QuotationItem } from "./quotation";

export type CustomerStatus = "Active" | "Pending" | "Inactive";

export interface CustomerItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  status: CustomerStatus;
  createdAt: string;
  associatedQuotations: QuotationItem[];
}
