"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { DealHealthSummaryCards } from "@/components/modules/dealhealth/DealHealthSummaryCards";
import { AttentionRequiredTable } from "@/components/modules/dealhealth/AttentionRequiredTable";
import { DealHealthKPI, DealHealthAlert } from "@/types/dealhealth";
import { CheckCircle2 } from "lucide-react";

const INITIAL_KPI: DealHealthKPI = {
  stalledDealsCount: 2,
  discountAnomaliesCount: 3,
  deliveryRisksCount: 1,
  highRiskApprovalsCount: 2,
};

const INITIAL_ALERTS: DealHealthAlert[] = [
  {
    id: "alert_01",
    severity: "HIGH",
    customerName: "Acme Corp",
    referenceNumber: "QT-1042",
    referenceType: "Quotation",
    issueDescription: "No customer activity for 8 days",
    ageDays: "8d",
    ownerName: "Rahul Sharma",
    suggestedAction: "Nudge Customer",
  },
  {
    id: "alert_02",
    severity: "MEDIUM",
    customerName: "Beta Industries",
    referenceNumber: "QT-1045",
    referenceType: "Quotation",
    issueDescription: "Discount 6 pts above rep historical average",
    ageDays: "3d",
    ownerName: "Priya Nair",
    suggestedAction: "Review Discount",
  },
  {
    id: "alert_03",
    severity: "HIGH",
    customerName: "Nova Systems",
    referenceNumber: "SO-1092",
    referenceType: "Order",
    issueDescription: "Delivery promise at risk - 3 units backordered",
    ageDays: "2d",
    ownerName: "Arjun Mehta",
    suggestedAction: "Check Fulfillment",
  },
  {
    id: "alert_04",
    severity: "LOW",
    customerName: "Vertex Solutions",
    referenceNumber: "QT-1035",
    referenceType: "Quotation",
    issueDescription: "Approval waiting over 48 hours",
    ageDays: "2d",
    ownerName: "Rahul Sharma",
    suggestedAction: "Escalate",
  },
];

export default function DealHealthPage() {
  const [kpi] = useState<DealHealthKPI>(INITIAL_KPI);
  const [alerts] = useState<DealHealthAlert[]>(INITIAL_ALERTS);
  const [notification, setNotification] = useState<string | null>(null);

  const mockUser = {
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    platformRole: "User",
  };

  const handleActionClick = (alertItem: DealHealthAlert) => {
    setNotification(
      `Triggered action "${alertItem.suggestedAction}" for deal ${alertItem.referenceNumber} (${alertItem.customerName})`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Deal Health
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Identify deals that need immediate intervention before they stall or deteriorate.
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Summary Risk KPI Cards */}
      <DealHealthSummaryCards kpi={kpi} />

      {/* Attention Required Table */}
      <AttentionRequiredTable alerts={alerts} onActionClick={handleActionClick} />
    </div>
  );
}
