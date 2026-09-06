"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { InvoiceSummaryCards } from "@/components/modules/invoices/InvoiceSummaryCards";
import { InvoicesTable } from "@/components/modules/invoices/InvoicesTable";
import { RecordPaymentModal } from "@/components/modules/invoices/RecordPaymentModal";
import { InvoiceResponse, InvoiceStatus } from "@/types/invoice";
import {
  useGetInvoicesQuery,
  useGetInvoiceSummaryQuery,
} from "@/store/features/invoice/invoiceApi";
import { Receipt, Filter } from "lucide-react";

export default function InvoicesPage() {
  const params = useParams();
  const companyId = params["company-id"] as string;

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | "ALL">("ALL");

  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<InvoiceResponse | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Invoices
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    isFetching: isFetchingInvoices,
    refetch: refetchInvoices,
  } = useGetInvoicesQuery(
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

  // Query Invoice Summary KPIs
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useGetInvoiceSummaryQuery(
    { companyId },
    { skip: !companyId }
  );

  const invoices = invoicesData?.data?.docs || [];
  const summary = summaryData?.data;

  const handleFilterSelect = (status: InvoiceStatus | "ALL") => {
    setActiveFilter((prev) => (prev === status ? "ALL" : status));
    setPage(1);
  };

  const handlePaymentSuccess = () => {
    refetchInvoices();
    refetchSummary();
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
              <Receipt className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Invoices
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Track customer billings, payment settlements, and delivered item invoices in real-time.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <InvoiceSummaryCards
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
            { id: "ALL", label: "All Invoices" },
            { id: "POSTED", label: "Open / Posted" },
            { id: "PARTIALLY_PAID", label: "Partially Paid" },
            { id: "PAID", label: "Paid" },
            { id: "CANCELLED", label: "Cancelled" },
          ] as const
        ).map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterSelect(tab.id as InvoiceStatus | "ALL")}
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

      {/* Invoices Table */}
      <InvoicesTable
        invoices={invoices}
        companyId={companyId}
        isLoading={isLoadingInvoices || isFetchingInvoices}
        page={invoicesData?.data?.page || page}
        totalPages={invoicesData?.data?.totalPages || 1}
        totalDocs={invoicesData?.data?.total || invoicesData?.data?.totalDocs}
        limit={limit}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        onRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
      />

      {/* Record Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          companyId={companyId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </main>
  );
}
