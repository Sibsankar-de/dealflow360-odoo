import { CompanyUserRole } from "@prisma/client";

export enum RiskLevel {
  LOW = "LOW",
  MID = "MID",
  HIGH = "HIGH",
}

export interface DiscountLineItemInput {
  productId?: string;
  actualDiscountPercentage: number;
  allowedDiscountPercentage: number;
  preDiscountValue: number;
}

export interface LineViolationResult {
  productId?: string;
  actualDiscountPercentage: number;
  allowedDiscountPercentage: number;
  violationPercentage: number;
  preDiscountValue: number;
  weightedViolation: number;
}

export interface DiscountViolationEvaluation {
  lineViolations: LineViolationResult[];
  maxLineViolation: number;
  blendedViolationScore: number;
  totalPreDiscountValue: number;
  threshold: number;
  hasLineLevelViolation: boolean;
  hasBlendedViolation: boolean;
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  requiredApprovalRole: CompanyUserRole | null;
}

export function calculateDiscountViolations(
  items: DiscountLineItemInput[],
  blendedThreshold: number = 0,
  midThreshold: number = 15,
): DiscountViolationEvaluation {
  let totalPreDiscountValue = 0;
  let sumWeightedViolations = 0;
  let maxLineViolation = 0;

  const lineViolations: LineViolationResult[] = items.map((item) => {
    const actual = Math.max(0, item.actualDiscountPercentage || 0);
    const allowed = Math.max(0, item.allowedDiscountPercentage || 0);
    const violationPercentage = Math.max(0, actual - allowed);
    const preDiscountValue = Math.max(0, item.preDiscountValue || 0);
    const weightedViolation = preDiscountValue * violationPercentage;

    if (violationPercentage > maxLineViolation) {
      maxLineViolation = violationPercentage;
    }

    totalPreDiscountValue += preDiscountValue;
    sumWeightedViolations += weightedViolation;

    return {
      productId: item.productId,
      actualDiscountPercentage: actual,
      allowedDiscountPercentage: allowed,
      violationPercentage,
      preDiscountValue,
      weightedViolation,
    };
  });

  const blendedViolationScore =
    totalPreDiscountValue > 0
      ? sumWeightedViolations / totalPreDiscountValue
      : 0;

  const hasLineLevelViolation = maxLineViolation > 0;
  const hasBlendedViolation = blendedViolationScore > blendedThreshold;
  const requiresApproval = hasLineLevelViolation || hasBlendedViolation;

  let riskLevel = RiskLevel.LOW;
  let requiredApprovalRole: CompanyUserRole | null = null;

  if (requiresApproval) {
    if (blendedViolationScore <= midThreshold) {
      riskLevel = RiskLevel.MID;
      requiredApprovalRole = CompanyUserRole.SALES_MANAGER;
    } else {
      riskLevel = RiskLevel.HIGH;
      requiredApprovalRole = CompanyUserRole.FINANCE_MANAGER;
    }
  }

  return {
    lineViolations,
    maxLineViolation: Number(maxLineViolation.toFixed(4)),
    blendedViolationScore: Number(blendedViolationScore.toFixed(4)),
    totalPreDiscountValue: Number(totalPreDiscountValue.toFixed(2)),
    threshold: blendedThreshold,
    hasLineLevelViolation,
    hasBlendedViolation,
    requiresApproval,
    riskLevel,
    requiredApprovalRole,
  };
}
