"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BackorderSummaryCards } from "@/components/modules/backorders/BackorderSummaryCards";
import { BackordersTable } from "@/components/modules/backorders/BackordersTable";
import { FulfillBackorderModal } from "@/components/modules/backorders/FulfillBackorderModal";
import { BackorderResponse, BackorderStatus } from "@/types/backorder";
import {
  useGetBackordersQuery,
  useGetBackorderSummaryQuery,
} from "@/store/features/backorder/backorderApi";
import { Layers, Filter } from "lucide-react";

export default function BackordersPage() {
  const params = useParams();
  const companyId = params["company-id"] as string;

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<BackorderStatus | "ALL">("ALL");

  const [selectedBackorderForFulfill, setSelectedBackorderForFulfill] =
    useState<BackorderResponse | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Backorders
  const {
    data: backordersData,
    isLoading: isLoadingBackorders,
    isFetching: isFetchingBackorders,
    refetch: refetchBackorders,
  } = useGetBackordersQuery(
    {
      companyId,
      params: {
        page,
        limit,
        status: activeFilter !== "ALL" ? activeFilter : undefined,
        search: debouncedSearch || undefined,
      },
    },
    { skip: !companyId }
  );

  // Query Backorder Summary KPIs
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useGetBackorderSummaryQuery(
    { companyId },
    { skip: !companyId }
  );

  const backorders = backordersData?.data?.docs || [];
  const summary = summaryData?.data;

  const handleFilterSelect = (status: BackorderStatus | "ALL") => {
    setActiveFilter((prev) => (prev === status ? "ALL" : status));
    setPage(1);
  };

  const handleFulfillSuccess = () => {
    refetchBackorders();
    refetchSummary();
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Backorders
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Track unfulfilled quantities, delayed items, and complete fulfillment batches.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <BackorderSummaryCards
        summary={summary}
        isLoading={isLoadingSummary}
        activeFilter={activeFilter}
        onFilterSelect={handleFilterSelect}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-text-muted flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {(
          [
            { id: "ALL", label: "All Backorders" },
            { id: "PENDING", label: "Pending" },
            { id: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
            { id: "FULFILLED", label: "Fulfilled" },
            { id: "CANCELLED", label: "Cancelled" },
          ] as const
        ).map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterSelect(tab.id as BackorderStatus | "ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-brand-600 text-white font-semibold shadow-xs"
                  : "bg-card text-text-secondary border border-border hover:bg-surface hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Backorders Table */}
      <BackordersTable
        backorders={backorders}
        companyId={companyId}
        isLoading={isLoadingBackorders || isFetchingBackorders}
        page={backordersData?.data?.page || page}
        totalPages={backordersData?.data?.totalPages || 1}
        totalDocs={backordersData?.data?.total || backordersData?.data?.totalDocs}
        limit={limit}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        onFulfill={(bo) => setSelectedBackorderForFulfill(bo)}
      />

      {/* Fulfill Backorder Modal */}
      {selectedBackorderForFulfill && (
        <FulfillBackorderModal
          isOpen={!!selectedBackorderForFulfill}
          onClose={() => setSelectedBackorderForFulfill(null)}
          backorder={selectedBackorderForFulfill}
          companyId={companyId}
          onSuccess={handleFulfillSuccess}
        />
      )}
    </main>
  );
}
