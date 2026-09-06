export type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";
export type HealthRiskType = "ALL" | "IDLE" | "EXPIRING_SOON" | "EXPIRED";

export interface DealHealthKPI {
  stalledDealsCount: number;
  expiringDealsCount?: number;
  expiredDealsCount?: number;
  totalAtRiskCount?: number;
  discountAnomaliesCount: number;
  deliveryRisksCount: number;
  highRiskApprovalsCount: number;
}

export interface DealHealthAlert {
  id: string;
  dealId?: string;
  dealNo?: string;
  dealName?: string;
  severity: RiskSeverity;
  riskType?: HealthRiskType;
  customerName: string;
  customerId?: string;
  customerEmail?: string;
  referenceNumber: string;
  referenceType?: "Deal" | "Quotation" | "Order";
  issueDescription: string;
  ageDays: string;
  ownerName: string;
  salesRepId?: string;
  suggestedAction: string;
  expectedValue?: number;
  stage?: string;
  status?: string;
  expectedCloseDate?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface DealHealthQuery {
  page?: number;
  limit?: number;
  search?: string;
  riskType?: HealthRiskType;
  idleDays?: number;
  idleMonths?: number;
  expiringDays?: number;
}

export interface DealHealthResponse {
  docs: DealHealthAlert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  kpi: DealHealthKPI;
}
