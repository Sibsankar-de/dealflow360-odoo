"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { WarehouseList } from "@/components/modules/warehouses";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";

export default function WarehousesPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetWarehousesQuery(
    { companyId, params: { page, limit: 10 } },
    { skip: !companyId }
  );

  const warehouses = data?.data?.warehouses ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <WarehouseList
        warehouses={warehouses}
        companyId={companyId}
        isLoading={isLoading}
        currentPage={page}
        totalPage={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

