"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { DealHealthSummaryCards } from "@/components/modules/dealhealth/DealHealthSummaryCards";
import { AttentionRequiredTable } from "@/components/modules/dealhealth/AttentionRequiredTable";
import { DealHealthAlert, HealthRiskType, DealHealthKPI } from "@/types/dealhealth";
import { useGetDealHealthQuery } from "@/store/features/deal/dealApi";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_KPI: DealHealthKPI = {
  stalledDealsCount: 0,
  expiringDealsCount: 0,
  expiredDealsCount: 0,
  totalAtRiskCount: 0,
  discountAnomaliesCount: 0,
  deliveryRisksCount: 0,
  highRiskApprovalsCount: 0,
};

export default function DealHealthPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riskType, setRiskType] = useState<HealthRiskType>("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  const { data, isLoading } = useGetDealHealthQuery(
    {
      companyId,
      params: {
        page,
        limit: 10,
        search: search.trim() || undefined,
        riskType,
      },
    },
    { skip: !companyId }
  );

  const alerts = data?.data?.docs ?? [];
  const kpi = data?.data?.kpi ?? DEFAULT_KPI;
  const totalPages = data?.data?.totalPages ?? 1;

  const handleActionClick = (alertItem: DealHealthAlert) => {
    const msg = `Triggered action "${alertItem.suggestedAction}" for deal ${alertItem.referenceNumber} (${alertItem.customerName})`;
    setNotification(msg);
    toast.success(msg);
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
          Monitor stalled opportunities without activity and deals with closing deadlines within 2 days.
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
      <AttentionRequiredTable
        alerts={alerts}
        companyId={companyId}
        isLoading={isLoading}
        currentPage={page}
        totalPage={totalPages}
        onPageChange={setPage}
        searchTerm={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        riskType={riskType}
        onRiskTypeChange={(val) => {
          setRiskType(val);
          setPage(1);
        }}
        onActionClick={handleActionClick}
      />
    </div>
  );
}
