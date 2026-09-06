import { z } from "zod";
import { Deal, DealStage, DealStatus, User, Company } from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";
import {
  createDealSchema,
  updateDealSchema,
  dealFilterSchema,
  customerDealFilterSchema,
  dealHealthQuerySchema,
} from "../schemas/deal.schema";

export type CreateDealDto = z.infer<typeof createDealSchema>;
export type UpdateDealDto = z.infer<typeof updateDealSchema>;
export type DealFilterDto = z.infer<typeof dealFilterSchema>;
export type CustomerDealFilterDto = z.infer<typeof customerDealFilterSchema>;
export type DealHealthQueryDto = z.infer<typeof dealHealthQuerySchema>;

export type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";
export type HealthRiskType = "IDLE" | "EXPIRING_SOON" | "EXPIRED";

export interface DealHealthAlertDto {
  id: string;
  dealId: string;
  dealNo: string;
  dealName: string;
  severity: RiskSeverity;
  riskType: HealthRiskType;
  customerName: string;
  customerId: string;
  customerEmail?: string;
  referenceNumber: string;
  referenceType: "Deal" | "Quotation" | "Order";
  issueDescription: string;
  ageDays: string;
  ownerName: string;
  salesRepId: string;
  suggestedAction: string;
  expectedValue: number;
  stage: DealStage;
  status: DealStatus;
  expectedCloseDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface DealHealthKPIDto {
  stalledDealsCount: number;
  expiringDealsCount: number;
  expiredDealsCount: number;
  totalAtRiskCount: number;
  discountAnomaliesCount: number;
  deliveryRisksCount: number;
  highRiskApprovalsCount: number;
}

export interface DealHealthResponseDto {
  docs: DealHealthAlertDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  kpi: DealHealthKPIDto;
}

export interface DealResponseDto {
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
  expectedCloseDate: Date | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: UserResponseDto;
  salesRep?: UserResponseDto;
  company?: {
    id: string;
    name: string;
  };
}

export const toDealDto = (
  deal: Deal & {
    customer?: User;
    salesRep?: User;
    company?: Company;
  },
): DealResponseDto => {
  return {
    id: deal.id,
    companyId: deal.companyId,
    dealNo: deal.dealNo,
    customerId: deal.customerId,
    salesRepId: deal.salesRepId,
    name: deal.name,
    stage: deal.stage,
    status: deal.status,
    expectedValue: Number(deal.expectedValue),
    probability: Number(deal.probability),
    expectedCloseDate: deal.expectedCloseDate,
    source: deal.source,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    customer: deal.customer ? toUserDto(deal.customer) : undefined,
    salesRep: deal.salesRep ? toUserDto(deal.salesRep) : undefined,
    company: deal.company
      ? { id: deal.company.id, name: deal.company.name }
      : undefined,
  };
};

export const toDealHealthAlertDto = (
  deal: Deal & {
    customer?: User;
    salesRep?: User;
    company?: Company;
  },
  now: Date = new Date(),
  idleDaysThreshold: number = 30,
  expiringDaysThreshold: number = 2,
): DealHealthAlertDto => {
  const idleDaysDiff = Math.max(
    0,
    Math.floor((now.getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  let daysUntilClose: number | null = null;
  if (deal.expectedCloseDate) {
    daysUntilClose = Math.ceil(
      (new Date(deal.expectedCloseDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  let severity: RiskSeverity = "LOW";
  let riskType: HealthRiskType = "IDLE";
  let issueDescription = "Deal requires progress review";
  let ageDays = `${idleDaysDiff}d`;
  let suggestedAction = "Review Deal";

  if (daysUntilClose !== null && daysUntilClose < 0) {
    const overdueDays = Math.abs(daysUntilClose);
    severity = "HIGH";
    riskType = "EXPIRED";
    issueDescription = `Expected close date was ${overdueDays} day${overdueDays === 1 ? "" : "s"} ago (${new Date(deal.expectedCloseDate!).toLocaleDateString()})`;
    ageDays = `${overdueDays}d overdue`;
    suggestedAction = "Update Close Date";
  } else if (daysUntilClose !== null && daysUntilClose <= expiringDaysThreshold) {
    severity = daysUntilClose <= 1 ? "HIGH" : "MEDIUM";
    riskType = "EXPIRING_SOON";
    issueDescription = `Deal close date in ${daysUntilClose === 0 ? "today" : `${daysUntilClose} day${daysUntilClose === 1 ? "" : "s"}`} (${new Date(deal.expectedCloseDate!).toLocaleDateString()})`;
    ageDays = `${daysUntilClose}d left`;
    suggestedAction = "Close Deal / Follow Up";
  } else if (idleDaysDiff >= idleDaysThreshold) {
    severity = idleDaysDiff >= 60 ? "HIGH" : "MEDIUM";
    riskType = "IDLE";
    const idleMonths = Math.floor(idleDaysDiff / 30);
    issueDescription = `No deal activity for ${idleDaysDiff >= 60 ? `${idleMonths} months` : `${idleDaysDiff} days`}`;
    ageDays = `${idleDaysDiff >= 60 ? `${idleMonths}mo` : `${idleDaysDiff}d`}`;
    suggestedAction = "Nudge Customer";
  }

  return {
    id: deal.id,
    dealId: deal.id,
    dealNo: deal.dealNo,
    dealName: deal.name,
    severity,
    riskType,
    customerName: deal.customer?.userName || "Customer",
    customerId: deal.customerId,
    customerEmail: deal.customer?.email,
    referenceNumber: deal.dealNo,
    referenceType: "Deal",
    issueDescription,
    ageDays,
    ownerName: deal.salesRep?.userName || "Sales Rep",
    salesRepId: deal.salesRepId,
    suggestedAction,
    expectedValue: Number(deal.expectedValue),
    stage: deal.stage,
    status: deal.status,
    expectedCloseDate: deal.expectedCloseDate,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
  };
};
