"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useGetDealByIdQuery,
  useGetDealQuotationsQuery,
} from "@/store/features/deal/dealApi";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { ReQuotationModal } from "@/components/modules/quotations/ReQuotationModal";
import { DealModal } from "@/components/modules/deals/DealModal";
import { QuotationResponse } from "@/types/quotation";
import { DealStage } from "@/types/deal";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Clock,
  RotateCcw,
  Edit3,
  Edit2,
  ExternalLink,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";

const STAGE_COLORS: Record<DealStage, BadgeVariant> = {
  NEW: "info",
  QUALIFICATION: "secondary",
  REQUIREMENT: "purple",
  QUOTATION: "warning",
  NEGOTIATION: "primary",
  WON: "success",
  LOST: "danger",
};

const STATUS_BADGES: Record<string, BadgeVariant> = {
  DRAFT: "secondary",
  Draft: "secondary",
  SENT: "primary",
  NEGOTIATING: "warning",
  Negotiation: "warning",
  ACCEPTED: "success",
  Confirmed: "success",
  Approved: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  EXPIRED: "outline",
};

export default function DealQuotationsListPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isEditDealOpen, setIsEditDealOpen] = useState(false);
  const [reQuotationTarget, setReQuotationTarget] =
    useState<QuotationResponse | null>(null);

  const { data: dealData, isLoading: isDealLoading } = useGetDealByIdQuery(
    { companyId, id: dealId },
    { skip: !companyId || !dealId }
  );
  const deal = dealData?.data?.deal;

  const {
    data: quotationsData,
    isLoading: isQuotesLoading,
  } = useGetDealQuotationsQuery(
    {
      companyId,
      dealId,
      params: {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      },
    },
    { skip: !companyId || !dealId }
  );

  const quotations: QuotationResponse[] =
    quotationsData?.data?.docs || deal?.quotations || [];
  const totalPages = quotationsData?.data?.totalPages ?? 1;

  const totalValue = quotations.reduce((acc, q) => {
    const revTotal = q.currentRevision?.totalAmount ?? q.totalAmount ?? 0;
    return acc + (Number(revTotal) || 0);
  }, 0);

  if (isDealLoading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-text-muted">
        <FileText className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading quotations...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center bg-card rounded-2xl border border-border">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-text-primary">
          Deal not found
        </h3>
        <p className="text-xs text-text-muted mt-1">
          The deal requested could not be located.
        </p>
        <Link href={`/company/${companyId}/app/deals`}>
          <Button variant="outline" size="sm" className="mt-4">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/company/${companyId}/app/deals`}
            className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            title="Back to Deals"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {deal.name}
              </h1>
              <Badge variant="primary">Deal #{deal.dealNo}</Badge>
              <Badge variant={STAGE_COLORS[deal.stage] || "secondary"}>
                {deal.stage}
              </Badge>
              <Badge variant="outline">{deal.status}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Customer:{" "}
              <span className="font-semibold text-text-primary">{deal.customer?.userName || "Customer"}</span>{" "}
              ({deal.customer?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={() => setIsEditDealOpen(true)}
          >
            Edit Deal
          </Button>
          <Link
            href={`/company/${companyId}/app/deals/${deal.id}/quotations/new`}
          >
            <Button size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Quotations</p>
            <p className="text-lg font-bold text-text-primary">
              {quotations.length}
            </p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-success">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Quotation Value</p>
            <p className="text-lg font-bold text-text-primary">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Deal Opportunity Value</p>
            <p className="text-lg font-bold text-text-primary">
              ${Number(deal.expectedValue).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search quotation number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-muted" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
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

      {/* Quotations List */}
      {isQuotesLoading ? (
        <div className="p-12 text-center text-text-muted">
          <FileText className="w-6 h-6 animate-pulse mx-auto mb-2 text-brand-600" />
          <p className="text-xs">Fetching deal quotations...</p>
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">
            No quotations found
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No quotations match your filter criteria."
              : "Generate a commercial proposal for this deal to get started."}
          </p>
          <Link
            href={`/company/${companyId}/app/deals/${deal.id}/quotations/new`}
          >
            <Button
              className="mt-4"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Quotation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quote) => {
            const currentRev = quote.currentRevision;
            const lineItems = currentRev?.items || quote.items || [];
            const revisionsList = quote.revisions || [];
            const isEditable =
              quote.status === "DRAFT" || quote.status === "NEGOTIATING";

            return (
              <div
                key={quote.id}
                className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-2xs hover:border-brand-500/40 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/company/${companyId}/app/deals/${deal.id}/quotations/${quote.id}`}
                          className="font-bold text-text-primary text-base hover:text-brand-600 transition-colors"
                        >
                          {quote.quotationNo}
                        </Link>
                        <Badge
                          variant={STATUS_BADGES[quote.status] || "secondary"}
                        >
                          {quote.status}
                        </Badge>
                        {currentRev && (
                          <Badge variant="outline">
                            Rev {currentRev.revisionNo}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Created {new Date(quote.createdAt).toLocaleDateString()}
                        {quote.validUntil && (
                          <span>
                            {" "}
                            • Valid until{" "}
                            {new Date(quote.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditable ? (
                      <Link
                        href={`/company/${companyId}/app/deals/${deal.id}/quotations/${quote.id}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Edit Quotation
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href={`/company/${companyId}/app/deals/${deal.id}/quotations/${quote.id}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                      </Link>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={() => setReQuotationTarget(quote)}
                    >
                      Re-Quote
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                {lineItems.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-muted uppercase font-semibold">
                          <th className="py-2 px-3">Product / Service</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3">Unit Price</th>
                          <th className="py-2 px-3">Discount</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {lineItems.map((item, idx) => (
                          <tr key={idx} className="text-text-secondary">
                            <td className="py-2 px-3 font-medium text-text-primary">
                              {item.productName || item.productId}
                            </td>
                            <td className="py-2 px-3">{item.quantity}</td>
                            <td className="py-2 px-3">
                              ${Number(item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2 px-3">
                              {item.discountValue > 0
                                ? `${item.discountValue}${
                                    item.discountType === "PERCENTAGE"
                                      ? "%"
                                      : "$"
                                  }`
                                : "-"}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-text-primary">
                              ${Number(item.lineTotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Summary & Revision History Footer */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-text-muted flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {revisionsList.length > 0
                        ? `${revisionsList.length} revision cycle(s)`
                        : "Initial Version"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-bold text-text-primary">
                    <span>Total:</span>
                    <span className="text-base text-brand-600">
                      $
                      {Number(
                        currentRev?.totalAmount ?? quote.totalAmount ?? 0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {quote.currency}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Pagination */}
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

      {/* Re-Quotation Modal */}
      {reQuotationTarget && (
        <ReQuotationModal
          isOpen={!!reQuotationTarget}
          onClose={() => setReQuotationTarget(null)}
          companyId={companyId}
          dealId={deal.id}
          quotation={reQuotationTarget}
        />
      )}

      {/* Edit Deal Modal */}
      <DealModal
        isOpen={isEditDealOpen}
        onClose={() => setIsEditDealOpen(false)}
        companyId={companyId}
        deal={deal}
      />
    </div>
  );
}

