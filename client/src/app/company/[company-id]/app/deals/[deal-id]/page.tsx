"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGetDealByIdQuery } from "@/store/features/deal/dealApi";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreateQuotationModal } from "@/components/modules/quotations/CreateQuotationModal";
import { ReQuotationModal } from "@/components/modules/quotations/ReQuotationModal";
import { DealModal } from "@/components/modules/deals/DealModal";
import { QuotationResponse, QuotationStatus } from "@/types/quotation";
import { DealStage } from "@/types/deal";
import {
  Briefcase,
  ArrowLeft,
  Plus,
  Edit2,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Clock,
  CheckCircle2,
  FileText,
  RotateCcw,
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

export default function DealDetailPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";

  const { data, isLoading } = useGetDealByIdQuery(
    { companyId, id: dealId },
    { skip: !companyId || !dealId }
  );

  const deal = data?.data?.deal;

  const [isEditDealOpen, setIsEditDealOpen] = useState(false);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [reviseQuotation, setReviseQuotation] =
    useState<QuotationResponse | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-text-muted">
        <Briefcase className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading deal details...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center bg-card rounded-xl border border-border">
        <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
        <h3 className="text-base font-semibold text-text-primary">
          Deal not found
        </h3>
        <p className="text-xs text-text-muted mt-1">
          The requested deal could not be located or may have been deleted.
        </p>
        <Link href={`/company/${companyId}/app/deals`}>
          <Button variant="outline" size="sm" className="mt-4">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  const quotations = deal.quotations || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/company/${companyId}/app/deals`}
            className="p-2 rounded-lg bg-card border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {deal.name}
              </h1>
              <Badge variant={STAGE_COLORS[deal.stage] || "secondary"}>
                {deal.stage}
              </Badge>
              <Badge variant="outline">{deal.status}</Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Deal #{deal.dealNo} • Created on{" "}
              {new Date(deal.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditDealOpen(true)}
          >
            Edit Deal
          </Button>
          <Link href={`/company/${companyId}/app/deals/${deal.id}/quotations/new`}>
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Generate Quotation
            </Button>
          </Link>
        </div>
      </div>


      {/* Deal Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-success">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Expected Value</p>
            <p className="text-lg font-bold text-text-primary">
              ${Number(deal.expectedValue).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Win Probability</p>
            <p className="text-lg font-bold text-text-primary">
              {deal.probability}%
            </p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Customer Account</p>
            <p className="text-sm font-semibold text-text-primary truncate max-w-[150px]">
              {deal.customer?.userName || "Customer"}
            </p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-info">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Target Close Date</p>
            <p className="text-sm font-semibold text-text-primary">
              {deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toLocaleDateString()
                : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {/* Quotations inside this Deal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Deal Quotations & Revisions
            </h2>
            <p className="text-xs text-text-muted">
              Commercial proposals, customer negotiation cycles, and revision history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/company/${companyId}/app/deals/${deal.id}/quotations`}>
              <Button size="sm" variant="outline">
                View All Quotations
              </Button>
            </Link>
            <Link href={`/company/${companyId}/app/deals/${deal.id}/quotations/new`}>
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Quotation
              </Button>
            </Link>
          </div>
        </div>

        {quotations.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-text-primary">
              No quotations yet
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              Generate a formal commercial quotation for this customer to begin negotiations.
            </p>
            <Link href={`/company/${companyId}/app/deals/${deal.id}/quotations/new`}>
              <Button
                className="mt-4"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Generate First Quotation
              </Button>
            </Link>
          </div>
        ) : (

          <div className="space-y-4">
            {quotations.map((quote) => {
              const currentRev = quote.currentRevision;
              const lineItems = currentRev?.items || quote.items || [];
              const revisionsList = quote.revisions || [];

              return (
                <div
                  key={quote.id}
                  className="bg-card rounded-xl border border-border p-5 space-y-4"
                >
                  {/* Quotation Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
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
                            variant={
                              STATUS_BADGES[quote.status] || "secondary"
                            }
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
                      <Link
                        href={`/company/${companyId}/app/deals/${deal.id}/quotations/${quote.id}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          {quote.status === "DRAFT" || quote.status === "NEGOTIATING"
                            ? "Edit / View"
                            : "View Details"}
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => setReviseQuotation(quote)}
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
                            <th className="py-2 px-3">Item</th>
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

                  {/* Summary & Revision History Strip */}
                  <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-text-muted flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {revisionsList.length > 0
                          ? `${revisionsList.length} revision iteration(s)`
                          : "Initial version"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-bold text-text-primary">
                      <span>Total Amount:</span>
                      <span className="text-base text-brand-600">
                        $
                        {Number(
                          currentRev?.totalAmount ?? 0
                        ).toLocaleString()}{" "}
                        {quote.currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <DealModal
        isOpen={isEditDealOpen}
        onClose={() => setIsEditDealOpen(false)}
        companyId={companyId}
        deal={deal}
      />

      <CreateQuotationModal
        isOpen={isCreateQuoteOpen}
        onClose={() => setIsCreateQuoteOpen(false)}
        companyId={companyId}
        dealId={deal.id}
        customerId={deal.customerId}
      />

      <ReQuotationModal
        isOpen={Boolean(reviseQuotation)}
        onClose={() => setReviseQuotation(null)}
        companyId={companyId}
        dealId={deal.id}
        quotation={reviseQuotation}
      />
    </div>
  );
}
