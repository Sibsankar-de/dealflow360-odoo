"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { FulfillmentSummaryCards } from "@/components/modules/fulfillment/FulfillmentSummaryCards";
import { FulfillmentOrdersTable } from "@/components/modules/fulfillment/FulfillmentOrdersTable";
import { FulfillmentKPI, FulfillmentOrder, FulfillmentStatus } from "@/types/fulfillment";
import {
  useGetQuotationsQuery,
  useGetFulfillmentSummaryQuery,
} from "@/store/features/quotation/quotationApi";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";

export default function FulfillmentPage() {
  const params = useParams();
  const companyId = params["company-id"] as string;

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query quotations pending fulfillment (ACCEPTED status)
  const {
    data: quotationsData,
    isLoading: isLoadingQuotations,
    isFetching: isFetchingQuotations,
  } = useGetQuotationsQuery(
    {
      companyId,
      params: {
        status: "ACCEPTED",
        page,
        limit,
        search: debouncedSearch || undefined,
      },
    },
    { skip: !companyId }
  );

  // Query real-time fulfillment KPI metrics
  const { data: summaryData, isLoading: isLoadingSummary } =
    useGetFulfillmentSummaryQuery(
      { companyId },
      { skip: !companyId }
    );

  // Query company warehouses for accurate warehouse count
  const { data: warehousesData } = useGetWarehousesQuery(
    { companyId },
    { skip: !companyId }
  );

  const totalWarehousesCount = warehousesData?.data?.warehouses?.length || 0;

  // Transform live quotations into FulfillmentOrder models
  const orders: FulfillmentOrder[] = useMemo(() => {
    const rawDocs = quotationsData?.data?.docs || [];

    return rawDocs.map((q) => {
      const totalQty = (q.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );

      const latestSalesOrder = q.salesOrders?.[0];
      let status: FulfillmentStatus = "Ready to Fulfill";

      if (latestSalesOrder?.status === "DELIVERED") {
        status = "Fulfilled";
      } else if ((latestSalesOrder?.backordersCount || 0) > 0) {
        status = "Backordered";
      } else if (latestSalesOrder?.status === "PARTIALLY_DELIVERED") {
        status = "Partially Fulfilled";
      }

      let requiredBy = "Not specified";
      let isUrgentDate = false;

      if (q.validUntil) {
        const validDate = new Date(q.validUntil);
        requiredBy = validDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const diffMs = validDate.getTime() - Date.now();
        if (diffMs > 0 && diffMs < 3 * 24 * 60 * 60 * 1000) {
          isUrgentDate = true;
        }
      }

      return {
        id: q.id,
        orderNumber: q.quotationNo,
        customerName:
          q.customer?.userName ||
          q.customer?.email ||
          "Customer",
        itemsCount: q.items?.length || 0,
        totalQty,
        qtyUnit: "units",
        warehousesCount: totalWarehousesCount || 1,
        shipmentsCount: latestSalesOrder?.deliveriesCount || 1,
        status,
        requiredBy,
        isUrgentDate,
      };
    });
  }, [quotationsData?.data?.docs, totalWarehousesCount]);

  // Filter orders client-side if a specific KPI filter is selected
  const filteredOrders = useMemo(() => {
    if (!activeFilter) return orders;

    switch (activeFilter) {
      case "ready":
        return orders.filter((o) => o.status === "Ready to Fulfill");
      case "partial":
        return orders.filter((o) => o.status === "Partially Fulfilled");
      case "backordered":
        return orders.filter((o) => o.status === "Backordered");
      case "completed":
        return orders.filter((o) => o.status === "Fulfilled");
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  const kpi: FulfillmentKPI = {
    readyToFulfillCount: summaryData?.data?.readyToFulfillCount || 0,
    partiallyFulfilledCount: summaryData?.data?.partiallyFulfilledCount || 0,
    backorderedCount: summaryData?.data?.backorderedCount || 0,
    completedCount: summaryData?.data?.completedCount || 0,
  };

  const handleFilterSelect = (filterId: string) => {
    setActiveFilter((prev) => (prev === filterId ? undefined : filterId));
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Fulfillment
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Warehouse allocation, shipment tracking, and delivery fulfillment for accepted quotations.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <FulfillmentSummaryCards
        kpi={kpi}
        isLoading={isLoadingSummary}
        activeFilter={activeFilter}
        onFilterSelect={handleFilterSelect}
      />

      {/* Orders Table Container */}
      <FulfillmentOrdersTable
        orders={filteredOrders}
        companyId={companyId}
        isLoading={isLoadingQuotations || isFetchingQuotations}
        page={quotationsData?.data?.page || page}
        totalPages={quotationsData?.data?.totalPages || 1}
        totalDocs={quotationsData?.data?.total || quotationsData?.data?.totalDocs}
        limit={limit}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
      />
    </main>
  );
}
