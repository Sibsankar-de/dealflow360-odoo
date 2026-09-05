export type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface DealHealthKPI {
  stalledDealsCount: number;
  discountAnomaliesCount: number;
  deliveryRisksCount: number;
  highRiskApprovalsCount: number;
}

export interface DealHealthAlert {
  id: string;
  severity: RiskSeverity;
  customerName: string;
  referenceNumber: string;
  referenceType: "Quotation" | "Order";
  issueDescription: string;
  ageDays: string;
  ownerName: string;
  suggestedAction: string;
}
