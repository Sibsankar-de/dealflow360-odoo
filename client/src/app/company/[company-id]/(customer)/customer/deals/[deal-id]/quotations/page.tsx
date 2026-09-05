"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetDealByIdQuery } from "@/store/features/deal/dealApi";
import { useGetQuotationsQuery } from "@/store/features/quotation/quotationApi";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuotationResponse } from "@/types/quotation";
import {
  ArrowLeft,
  Search,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  Layers,
} from "lucide-react";

const STATUS_BADGES: Record<string, BadgeVariant> = {
  DRAFT: "secondary",
  SENT: "primary",
  NEGOTIATING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  EXPIRED: "outline",
};

export default function CustomerDealQuotationsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";

  const [searchTerm, setSearchTerm] = useState("");

  const { data: dealData, isLoading: isLoadingDeal } = useGetDealByIdQuery(
    { companyId, id: dealId },
    { skip: !companyId || !dealId }
  );
  const deal = dealData?.data?.deal;

  const { data: quoteData, isLoading: isLoadingQuotes } = useGetQuotationsQuery(
    { companyId, params: { dealId } },
    { skip: !companyId || !dealId }
  );

  const rawQuotations: QuotationResponse[] =
    quoteData?.data?.docs ?? [];

  const customerQuotations = rawQuotations;

  const filteredQuotations = customerQuotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      (q.quotationNo && q.quotationNo.toLowerCase().includes(term)) ||
      (q.status && q.status.toLowerCase().includes(term))
    );
  });

  const handleOpenQuotation = (quotationId: string) => {
    router.push(
      `/company/${companyId}/customer/deals/${dealId}/quotations/${quotationId}`
    );
  };

  if (isLoadingDeal) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-text-muted">
        <FileText className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading deal quotations...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-card rounded-2xl border border-border">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-text-primary">
          Deal not found
        </h3>
        <p className="text-xs text-text-muted mt-1">
          The requested deal could not be located.
        </p>
        <Link href={`/company/${companyId}/customer`}>
          <Button variant="outline" size="sm" className="mt-4">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/company/${companyId}/customer`}
            className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {deal.name}
              </h1>
              <Badge variant="primary">Deal #{deal.dealNo || deal.id.substring(0, 8)}</Badge>
              <Badge variant="purple">{deal.stage}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Review received quotations and submit negotiations or approvals.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search quotations by quote number or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-text-muted">
          Found <strong>{filteredQuotations.length}</strong> quotation(s)
        </div>
      </div>

      {/* Quotations List */}
      {isLoadingQuotes ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl border border-border bg-card animate-pulse h-28"
            />
          ))}
        </div>
      ) : filteredQuotations.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">
            No quotations available
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No quotations match your search filter."
              : "No formal quotation proposals have been issued for this deal yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotations.map((quote) => {
            const activeRev = quote.currentRevision;
            const total = Number(activeRev?.totalAmount || quote.totalAmount || 0);
            const revisionCount = quote.revisions?.length || 1;

            return (
              <Card
                key={quote.id}
                className="rounded-2xl border border-border bg-card p-5 hover:border-text-secondary/30 transition-all shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-base text-text-primary">
                        {quote.quotationNo || `Quote #${quote.id.substring(0, 8)}`}
                      </span>
                      <Badge variant={STATUS_BADGES[quote.status] || "secondary"}>
                        {quote.status}
                      </Badge>
                      {quote.status === "SENT" && (
                        <Badge variant="primary" className="text-[10px] px-1.5 py-0">
                          Pending Your Review
                        </Badge>
                      )}
                      {quote.status === "NEGOTIATING" && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0 animate-pulse">
                          In Negotiation
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-semibold text-text-primary text-sm">
                          ${total.toFixed(2)} {quote.currency || "USD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Revision #{activeRev?.revisionNo || revisionCount}</span>
                      </div>

                      {quote.validUntil && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Valid Until: {new Date(quote.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {activeRev?.customerNote && (
                      <p className="text-xs text-text-secondary italic line-clamp-1 bg-surface p-2 rounded-lg border border-border/50">
                        "{activeRev.customerNote}"
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleOpenQuotation(quote.id)}
                      rightIcon={<Eye className="w-4 h-4" />}
                      className="w-full md:w-auto"
                    >
                      {quote.status === "ACCEPTED"
                        ? "View Approved Quotation"
                        : "Review & Negotiate"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
