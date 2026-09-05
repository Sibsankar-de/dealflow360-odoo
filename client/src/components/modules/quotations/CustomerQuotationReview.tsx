"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  RotateCcw,
  Send,
  AlertCircle,
  Building2,
  Calendar,
  ShieldAlert,
  History,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QuotationResponse } from "@/types/quotation";
import { DealResponseType } from "@/types/deal";
import {
  useGetNegotiationsQuery,
  useGetRevisionsQuery,
} from "@/store/features/quotation/quotationApi";

export interface CustomerNegotiationLineItem {
  quotationItemId?: string;
  productId: string;
  productName: string;
  baseUnit: string;
  originalUnitPrice: number;
  originalQuantity: number;
  originalDiscountType: "PERCENTAGE" | "FIXED";
  originalDiscountValue: number;
  requestedQuantity: number;
  requestedUnitPrice: number;
  requestedDiscountType: "PERCENTAGE" | "FIXED";
  requestedDiscountValue: number;
}

export interface CustomerQuotationReviewProps {
  quotation: QuotationResponse;
  deal?: DealResponseType | null;
  companyId: string;
  onApprove: () => Promise<void> | void;
  onReject: (reason?: string) => Promise<void> | void;
  onSendCounterOffer: (payload: {
    message?: string;
    items: {
      quotationItemId?: string;
      productId: string;
      requestedQuantity: number;
      requestedUnitPrice: number;
      requestedDiscountType: "PERCENTAGE" | "FIXED";
      requestedDiscountValue: number;
    }[];
  }) => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
}

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

export const CustomerQuotationReview: React.FC<CustomerQuotationReviewProps> = ({
  quotation,
  deal,
  companyId,
  onApprove,
  onReject,
  onSendCounterOffer,
  isLoading = false,
  className,
}) => {
  const activeRev = quotation.currentRevision;
  const rawItems = activeRev?.items || quotation.items || [];

  const initialLineItems: CustomerNegotiationLineItem[] = rawItems.map((it) => ({
    quotationItemId: it.id,
    productId: it.productId,
    productName: it.productName || "Product Item",
    baseUnit: "Unit",
    originalUnitPrice: Number(it.unitPrice) || 0,
    originalQuantity: Number(it.quantity) || 1,
    originalDiscountType: (it.discountType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
    originalDiscountValue: Number(it.discountValue) || 0,
    requestedQuantity: Number(it.quantity) || 1,
    requestedUnitPrice: Number(it.unitPrice) || 0,
    requestedDiscountType: (it.discountType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
    requestedDiscountValue: Number(it.discountValue) || 0,
  }));

  const [isNegotiating, setIsNegotiating] = useState(false);
  const [items, setItems] = useState<CustomerNegotiationLineItem[]>(initialLineItems);
  const [negotiatorMessage, setNegotiatorMessage] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: negotiationsData } = useGetNegotiationsQuery(
    { companyId, id: quotation.id },
    { skip: !companyId || !quotation.id }
  );

  const { data: revisionsData } = useGetRevisionsQuery(
    { companyId, id: quotation.id },
    { skip: !companyId || !quotation.id }
  );

  const negotiations = negotiationsData?.data?.negotiations ?? quotation.negotiations ?? [];
  const revisions = revisionsData?.data?.revisions ?? quotation.revisions ?? [];

  const isFinalStatus =
    quotation.status === "ACCEPTED" ||
    quotation.status === "Approved" ||
    quotation.status === "REJECTED" ||
    quotation.status === "CANCELLED" ||
    quotation.status === "EXPIRED";

  const handleFieldChange = (
    index: number,
    field: keyof CustomerNegotiationLineItem,
    value: unknown
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDiscardNegotiation = () => {
    setItems(initialLineItems);
    setNegotiatorMessage("");
    setIsNegotiating(false);
    setActionError(null);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const qty = Number(item.requestedQuantity) || 0;
      const price = Number(item.requestedUnitPrice) || 0;
      const discVal = Number(item.requestedDiscountValue) || 0;

      const gross = qty * price;
      const discount =
        item.requestedDiscountType === "PERCENTAGE"
          ? (gross * discVal) / 100
          : Math.min(gross, discVal);
      const lineTotal = Math.max(0, gross - discount);

      subtotal += gross;
      totalDiscount += discount;
      grandTotal += lineTotal;
    });

    return { subtotal, totalDiscount, grandTotal };
  };

  const totals = calculateTotals();

  const handleConfirmReject = async () => {
    try {
      setActionError(null);
      await onReject(rejectReason.trim() || undefined);
      setIsRejectModalOpen(false);
      setRejectReason("");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to reject quotation.";
      setActionError(msg);
    }
  };

  const handleSendCounterOffer = async () => {
    try {
      setActionError(null);
      const payloadItems = items.map((it) => ({
        quotationItemId: it.quotationItemId,
        productId: it.productId,
        requestedQuantity: Number(it.requestedQuantity) || 1,
        requestedUnitPrice: Number(it.requestedUnitPrice) || 0,
        requestedDiscountType: it.requestedDiscountType,
        requestedDiscountValue: Number(it.requestedDiscountValue) || 0,
      }));

      await onSendCounterOffer({
        message: negotiatorMessage.trim() || undefined,
        items: payloadItems,
      });

      setIsNegotiating(false);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to submit counter offer.";
      setActionError(msg);
    }
  };

  return (
    <div className={clsx("space-y-6 max-w-5xl mx-auto", className)}>
      {/* Header Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Quotation {quotation.quotationNo}
            </h1>
            <Badge variant={STATUS_BADGES[quotation.status] || "secondary"}>
              {quotation.status}
            </Badge>
            {isNegotiating && (
              <Badge variant="warning" className="animate-pulse">
                Negotiation Mode Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Review product quotation terms, proposed pricing, and delivery conditions.
          </p>
        </div>

        {/* Top Actions for Customer */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowHistory(!showHistory)}
            leftIcon={<History className="w-4 h-4" />}
          >
            {showHistory ? "Hide Timeline" : "Negotiation History"}
          </Button>

          {!isFinalStatus && (
            <>
              {!isNegotiating ? (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isLoading}
                    className="text-danger hover:bg-red-50 hover:border-red-200"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsNegotiating(true)}
                    disabled={isLoading}
                    leftIcon={<MessageSquareQuote className="w-4 h-4" />}
                  >
                    Negotiate
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onApprove()}
                    isLoading={isLoading}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Approve Quotation
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleDiscardNegotiation}
                    disabled={isLoading}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendCounterOffer}
                    isLoading={isLoading}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Send Counter-Offer
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Overview Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Company Workspace
              </span>
              <p className="text-sm font-bold text-text-primary truncate">
                {deal?.company?.name || "DealFlow360 Partner"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Associated Deal
              </span>
              <p className="text-sm font-bold text-text-primary truncate">
                {deal?.name || "Quotation Opportunity"}
              </p>
              {deal?.dealNo && (
                <span className="text-[11px] text-text-muted">#{deal.dealNo}</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Offer Valid Until
              </span>
              <p className="text-sm font-bold text-text-primary truncate">
                {quotation.validUntil
                  ? new Date(quotation.validUntil).toLocaleDateString()
                  : "Until Further Notice"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Negotiation History & Revisions Timeline Section */}
      {showHistory && (
        <Card className="rounded-2xl border border-border bg-card overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border bg-surface/30 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <span>Negotiation Offers & Revisions Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {revisions.length === 0 && negotiations.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                No past negotiation cycles recorded for this quotation yet.
              </p>
            ) : (
              <div className="space-y-4">
                {revisions.map((rev, i) => (
                  <div
                    key={rev.id || i}
                    className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">
                          Revision #{rev.revisionNo}
                        </span>
                        <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                          {rev.revisionType}
                        </Badge>
                        <Badge variant={STATUS_BADGES[rev.status] || "secondary"} className="text-[10px] px-1.5 py-0">
                          {rev.status}
                        </Badge>
                      </div>
                      <span className="text-text-muted text-[11px]">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="text-text-secondary">
                        {rev.customerNote && (
                          <p className="italic text-text-primary">"{rev.customerNote}"</p>
                        )}
                      </div>
                      <div className="font-bold text-text-primary">
                        Total: ${Number(rev.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Negotiation Guidance Alert */}
      {isNegotiating && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <MessageSquareQuote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">You are adjusting quotation parameters for counter-negotiation.</p>
            <p className="mt-0.5 text-amber-700">
              Edit the desired quantities or discount values in the line items table below, provide notes for the sales representative, and click "Send Counter-Offer" to submit.
            </p>
          </div>
        </div>
      )}

      {/* Quotation Line Items Table */}
      <Card className="rounded-2xl border border-border bg-card overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary">
              Proposed Products & Services
            </CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Itemized list of products with unit prices, requested quantities, and approved discounts.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-150">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/40">
                <th className="py-3 px-6">Product / Item</th>
                <th className="py-3 px-4 w-28 text-center">Quantity</th>
                <th className="py-3 px-4 w-32 text-right">Unit Price</th>
                <th className="py-3 px-4 w-40 text-center">Discount</th>
                <th className="py-3 px-6 w-36 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, idx) => {
                const qty = Number(item.requestedQuantity) || 0;
                const price = Number(item.requestedUnitPrice) || 0;
                const discVal = Number(item.requestedDiscountValue) || 0;
                const gross = qty * price;
                const discount =
                  item.requestedDiscountType === "PERCENTAGE"
                    ? (gross * discVal) / 100
                    : Math.min(gross, discVal);
                const lineTotal = Math.max(0, gross - discount);

                return (
                  <tr key={idx} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-text-primary">
                      {item.productName}
                    </td>

                    {/* Quantity Field: Transparent / Readonly by default, editable in Negotiation */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={!isNegotiating}
                        value={item.requestedQuantity}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            "requestedQuantity",
                            Number(e.target.value) || 1
                          )
                        }
                        className={clsx(
                          "w-20 text-center text-xs font-semibold rounded-lg py-1.5 transition-all outline-none",
                          isNegotiating
                            ? "bg-surface border border-border focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-text-primary shadow-xs"
                            : "bg-transparent border-transparent text-text-primary cursor-default opacity-100"
                        )}
                      />
                    </td>

                    {/* Unit Price Field */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-text-muted text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!isNegotiating}
                          value={item.requestedUnitPrice}
                          onChange={(e) =>
                            handleFieldChange(
                              idx,
                              "requestedUnitPrice",
                              Number(e.target.value) || 0
                            )
                          }
                          className={clsx(
                            "w-24 text-right text-xs font-semibold rounded-lg py-1.5 transition-all outline-none",
                            isNegotiating
                              ? "bg-surface border border-border focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-text-primary shadow-xs"
                              : "bg-transparent border-transparent text-text-primary cursor-default opacity-100"
                          )}
                        />
                      </div>
                    </td>

                    {/* Discount Field */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isNegotiating ? (
                          <>
                            <select
                              value={item.requestedDiscountType}
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "requestedDiscountType",
                                  e.target.value as "PERCENTAGE" | "FIXED"
                                )
                              }
                              className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-text-primary outline-none focus:border-brand-500"
                            >
                              <option value="PERCENTAGE">%</option>
                              <option value="FIXED">$</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.requestedDiscountValue}
                              placeholder="0"
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "requestedDiscountValue",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-16 text-center text-xs font-semibold rounded-lg py-1.5 bg-surface border border-border focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-text-primary shadow-xs outline-none"
                            />
                          </>
                        ) : (
                          <span className="text-xs font-medium text-text-secondary">
                            {item.originalDiscountValue > 0
                              ? `${item.originalDiscountValue}${
                                  item.originalDiscountType === "PERCENTAGE" ? "%" : "$"
                                } off`
                              : "-"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Line Total */}
                    <td className="py-3.5 px-6 text-right font-bold text-text-primary">
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pricing Summary Block */}
          <div className="p-6 bg-surface/50 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-text-muted">
              <span>All amounts denominated in </span>
              <strong className="text-text-primary">{quotation.currency || "USD"}</strong>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal:</span>
                <span className="font-semibold text-text-primary">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Total Discount:</span>
                <span className="font-semibold text-danger">
                  -${totals.totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between text-sm font-bold text-text-primary">
                <span>Total Due:</span>
                <span className="text-base text-brand-600 font-bold">
                  ${totals.grandTotal.toFixed(2)} {quotation.currency || "USD"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Negotiator Message Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proposal / Terms Note */}
        <Card className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <CardTitle className="text-sm font-bold text-text-primary">
            Proposal Notes & Terms
          </CardTitle>
          <div className="p-3.5 rounded-xl bg-surface border border-border/70 text-xs text-text-secondary min-h-24">
            {activeRev?.customerNote || (
              <span className="text-text-muted italic">No specific conditions attached.</span>
            )}
          </div>
        </Card>

        {/* Customer Negotiation Note */}
        <Card className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <MessageSquareQuote className="w-4 h-4 text-brand-600" />
            <span>Note for Negotiator / Sales Representative</span>
          </CardTitle>
          <textarea
            rows={3}
            disabled={!isNegotiating}
            value={negotiatorMessage}
            onChange={(e) => setNegotiatorMessage(e.target.value)}
            placeholder={
              isNegotiating
                ? "Describe your requested adjustments, budget constraints, or timeline requirements..."
                : "Enter negotiation mode above to add comments for the sales representative."
            }
            className={clsx(
              "w-full rounded-xl p-3 text-xs shadow-xs resize-none transition-all outline-none",
              isNegotiating
                ? "bg-surface border border-border focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-text-primary"
                : "bg-surface/50 border-border/50 text-text-muted cursor-not-allowed opacity-75"
            )}
          />
        </Card>
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Quotation"
        description="Please confirm if you wish to reject this quotation. You may provide a reason for the sales team."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-danger text-xs font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              Rejecting this quotation will conclude this proposal cycle.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Reason for Rejection (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., pricing outside target budget, chosen alternative solution..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger shadow-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmReject}
              isLoading={isLoading}
              className="bg-danger hover:bg-red-700 text-white border-transparent"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerQuotationReview;
