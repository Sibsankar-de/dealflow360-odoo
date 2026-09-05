"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGetQuotationsQuery } from "@/store/features/quotation/quotationApi";
import { QuotationTable } from "@/components/modules/quotations/QuotationTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Plus, Search, FileText, CheckCircle2 } from "lucide-react";
import { QuotationResponse } from "@/types/quotation";

export default function CompanyQuotationsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const { data: quotationsData, isLoading } = useGetQuotationsQuery(
    {
      companyId,
      params: {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      },
    },
    { skip: !companyId }
  );

  const quotations: QuotationResponse[] = quotationsData?.data?.docs || [];
  const totalPages = quotationsData?.data?.totalPages ?? 1;

  const showNotification = (msg: string) => {
    setSelectedNotification(msg);
    setTimeout(() => setSelectedNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Quotations
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage, track, and review all commercial quotations across deals
          </p>
        </div>

        <Link href={`/company/${companyId}/app/deals`}>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            Create Quotation via Deal
          </Button>
        </Link>
      </div>

      {selectedNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{selectedNotification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search quotation number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-text-muted" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { key: "ALL", value: "All Statuses" },
              { key: "DRAFT", value: "Draft" },
              { key: "SENT", value: "Sent" },
              { key: "NEGOTIATING", value: "Negotiating" },
              { key: "ACCEPTED", value: "Accepted" },
              { key: "REJECTED", value: "Rejected" },
              { key: "CANCELLED", value: "Cancelled" },
            ]}
          />
        </div>
      </div>

      {/* Quotations Table */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted">
          <FileText className="w-8 h-8 animate-pulse mx-auto mb-2 text-brand-600" />
          <p className="text-xs">Loading company quotations...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <QuotationTable
            quotations={quotations}
            companyId={companyId}
            onSelectQuotation={(q) => showNotification(`Selected quotation ${q.quotationNo}`)}
          />

          {totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination
                currentPage={page}
                totalPage={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
