"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { DealList } from "@/components/modules/deals";
import { useGetDealsQuery } from "@/store/features/deal/dealApi";

export default function DealsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetDealsQuery(
    { companyId, params: { page, limit: 10 } },
    { skip: !companyId }
  );

  const deals = data?.data?.docs ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DealList
        deals={deals}
        companyId={companyId}
        isLoading={isLoading}
        currentPage={page}
        totalPage={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

