"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetCustomerDealByIdQuery } from "@/store/features/deal/dealApi";
import {
  useGetQuotationByIdQuery,
  useSubmitNegotiationMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
} from "@/store/features/quotation/quotationApi";
import { CustomerQuotationReview } from "@/components/modules/quotations/CustomerQuotationReview";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerQuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";
  const quotationId =
    typeof params?.["quotation-id"] === "string" ? params["quotation-id"] : "";

  const [error, setError] = useState<string | null>(null);

  const { data: dealData, isLoading: isLoadingDeal } = useGetCustomerDealByIdQuery(
    { companyId, id: dealId },
    { skip: !companyId || !dealId }
  );
  const deal = dealData?.data?.deal;

  const { data: quoteData, isLoading: isLoadingQuote } = useGetQuotationByIdQuery(
    { companyId, id: quotationId },
    { skip: !companyId || !quotationId }
  );
  const quotation = quoteData?.data?.quotation;

  const [submitNegotiation, { isLoading: isCounterOffering }] =
    useSubmitNegotiationMutation();
  const [acceptQuotation, { isLoading: isStatusUpdating }] =
    useAcceptQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] =
    useRejectQuotationMutation();

  const handleCustomerApprove = async () => {
    if (!quotation) return;
    try {
      setError(null);
      await acceptQuotation({
        companyId,
        id: quotation.id,
      }).unwrap();
      toast.success("Quotation approved successfully! The deal is now confirmed.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to approve quotation";
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  const handleCustomerReject = async (reason?: string) => {
    if (!quotation) return;
    try {
      setError(null);
      await rejectQuotation({
        companyId,
        id: quotation.id,
        reason,
      }).unwrap();
      toast.success("Quotation rejected.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to reject quotation";
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  const handleCustomerCounterOffer = async (payload: {
    message?: string;
    items: {
      quotationItemId?: string;
      productId: string;
      requestedQuantity: number;
      requestedUnitPrice: number;
      requestedDiscountType: "PERCENTAGE" | "FIXED";
      requestedDiscountValue: number;
    }[];
  }) => {
    if (!quotation) return;
    try {
      setError(null);
      await submitNegotiation({
        companyId,
        id: quotation.id,
        data: {
          message: payload.message,
          items: payload.items,
        },
      }).unwrap();
      toast.success(
        "Counter-offer submitted to the sales team successfully!",
      );
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to submit counter-offer";
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  if (isLoadingDeal || isLoadingQuote) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-text-muted">
        <FileText className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading quotation proposal...</p>
      </div>
    );
  }

  if (!deal || !quotation) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-card rounded-2xl border border-border">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-text-primary">
          Quotation not found
        </h3>
        <p className="text-xs text-text-muted mt-1">
          The requested quotation could not be located.
        </p>
        <Link href={`/company/${companyId}/customer/deals/${dealId}/quotations`}>
          <Button variant="outline" size="sm" className="mt-4">
            Back to Quotations List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href={`/company/${companyId}/customer/deals/${dealId}/quotations`}
          className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs text-text-muted">
          Back to Deal Quotations
        </span>
      </div>

      {/* Customer Quotation Review & Negotiation Interface */}
      <CustomerQuotationReview
        quotation={quotation}
        deal={deal}
        companyId={companyId}
        onApprove={handleCustomerApprove}
        onReject={handleCustomerReject}
        onSendCounterOffer={handleCustomerCounterOffer}
        isLoading={isRejecting || isCounterOffering || isStatusUpdating}
      />
    </div>
  );
}
