"use client";

import React from "react";
import { useParams } from "next/navigation";
import { WarehouseList } from "@/components/modules/warehouses";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";

export default function WarehousesPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const { data, isLoading } = useGetWarehousesQuery(
    { companyId },
    { skip: !companyId }
  );

  const warehouses = React.useMemo(() => {
    if (!data?.data) return [];
    const rawData = data.data;
    if (Array.isArray(rawData)) return rawData;
    if ("warehouses" in rawData && Array.isArray(rawData.warehouses)) {
      return rawData.warehouses;
    }
    return [];
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <WarehouseList
        warehouses={warehouses}
        companyId={companyId}
        isLoading={isLoading}
      />
    </div>
  );
}
