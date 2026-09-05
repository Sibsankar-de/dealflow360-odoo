export type QuotationStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Negotiation"
  | "Confirmed";

export interface QuotationItem {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  currency: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt?: string;
  itemCount?: number;
}
