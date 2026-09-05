"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DealList } from "@/components/modules/deals";
import { useGetDealsQuery } from "@/store/features/deal/dealApi";

export default function DealsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const { data, isLoading } = useGetDealsQuery(
    { companyId },
    { skip: !companyId }
  );

  const deals = React.useMemo(() => {
    if (!data?.data) return [];
    const rawData = data.data;
    if (Array.isArray(rawData)) return rawData;
    if ("docs" in rawData && Array.isArray(rawData.docs)) {
      return rawData.docs;
    }
    if ("deals" in rawData && Array.isArray(rawData.deals)) {
      return rawData.deals;
    }
    return [];
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DealList
        deals={deals}
        companyId={companyId}
        isLoading={isLoading}
      />
    </div>
  );
}
