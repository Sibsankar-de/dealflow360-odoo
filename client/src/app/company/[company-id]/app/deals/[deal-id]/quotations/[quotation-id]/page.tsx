"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetDealByIdQuery } from "@/store/features/deal/dealApi";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import {
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useSendQuotationMutation,
  useGetNegotiationsQuery,
  useGetRevisionsQuery,
  useApproveNegotiationMutation,
  useRejectNegotiationMutation,
} from "@/store/features/quotation/quotationApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageSquareQuote,
  Check,
  X,
  ShieldAlert,
  History,
  Clock,
  ExternalLink,
  Hourglass,
  Truck,
} from "lucide-react";
import { NegotiationDetail } from "@/types/quotation";

interface LineItemState {
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number | string;
  taxRate: number | string;
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

const NEGOTIATION_STATUS_BADGES: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default function QuotationEditorPage() {
  const router = useRouter();
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";
  const quotationId =
    typeof params?.["quotation-id"] === "string" ? params["quotation-id"] : "";

  const isNew = quotationId === "new";

  const [createQuotation, { isLoading: isCreating }] =
    useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();
  const [sendQuotation, { isLoading: isSending }] = useSendQuotationMutation();
  const [approveNegotiation, { isLoading: isApprovingNeg }] =
    useApproveNegotiationMutation();
  const [rejectNegotiation, { isLoading: isRejectingNeg }] =
    useRejectNegotiationMutation();

  const { data: dealData, isLoading: isLoadingDeal } = useGetDealByIdQuery(
    { companyId, id: dealId },
    { skip: !companyId || !dealId }
  );
  const deal = dealData?.data?.deal;

  const {
    data: quoteData,
    isLoading: isLoadingQuote,
  } = useGetQuotationByIdQuery(
    { companyId, id: quotationId },
    {
      skip: isNew || !quotationId || !companyId,
    }
  );
  const existingQuotation = quoteData?.data?.quotation;

  const { data: productData, isLoading: isLoadingProducts } =
    useGetProductsQuery({ companyId }, { skip: !companyId });

  const products = productData?.data?.products ?? [];

  const { data: negotiationsData } = useGetNegotiationsQuery(
    { companyId, id: quotationId },
    { skip: isNew || !quotationId || !companyId }
  );
  const negotiations: NegotiationDetail[] =
    negotiationsData?.data?.negotiations ?? existingQuotation?.negotiations ?? [];

  const { data: revisionsData } = useGetRevisionsQuery(
    { companyId, id: quotationId },
    { skip: isNew || !quotationId || !companyId }
  );
  const revisions = revisionsData?.data?.revisions ?? existingQuotation?.revisions ?? [];

  const pendingNegotiation = negotiations.find((n) => n.status === "PENDING");

  const [items, setItems] = useState<LineItemState[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals for Negotiation Review
  const [isApproveNegModalOpen, setIsApproveNegModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [isRejectNegModalOpen, setIsRejectNegModalOpen] = useState(false);
  const [rejectNegReason, setRejectNegReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const isReadOnly =
    !isNew &&
    existingQuotation &&
    existingQuotation.status !== "DRAFT";

  useEffect(() => {
    if (isNew && deal) {
      setCurrency("USD");
    }
  }, [isNew, deal]);

  useEffect(() => {
    if (!isNew && existingQuotation) {
      setCurrency(existingQuotation.currency || "USD");
      if (existingQuotation.validUntil) {
        setValidUntil(
          new Date(existingQuotation.validUntil).toISOString().split("T")[0]
        );
      }
      const activeRev = existingQuotation.currentRevision;
      setCustomerNote(activeRev?.customerNote || "");
      setInternalNote(activeRev?.internalNote || "");

      const lineItems =
        activeRev?.items || existingQuotation.items || [];

      if (lineItems.length > 0) {
        setItems(
          lineItems.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            discountType:
              (item.discountType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
            discountValue: item.discountValue !== 0 ? item.discountValue : "",
            taxRate: Number(item.taxRate) || 0,
          }))
        );
      }
    }
  }, [isNew, existingQuotation]);

  const handleAddItem = () => {
    if (products.length === 0 || isReadOnly) return;
    const defaultProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        quantity: 1,
        unitPrice: Number(defaultProduct.price) || 0,
        discountType: "PERCENTAGE",
        discountValue: "",
        taxRate: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (isReadOnly) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    if (isReadOnly) return;
    const selectedProd = products.find((p) => p.id === prodId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: prodId,
              unitPrice: selectedProd
                ? Number(selectedProd.price) || 0
                : item.unitPrice,
            }
          : item
      )
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof LineItemState,
    value: unknown
  ) => {
    if (isReadOnly) return;
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discVal = Number(item.discountValue) || 0;
      const taxRate = Number(item.taxRate) || 0;

      const gross = qty * price;
      const discount =
        item.discountType === "PERCENTAGE"
          ? (gross * discVal) / 100
          : Math.min(gross, discVal);
      const taxable = Math.max(0, gross - discount);
      const tax = taxable * (taxRate / 100);
      const lineTotal = taxable + tax;

      subtotal += gross;
      totalDiscount += discount;
      totalTax += tax;
      grandTotal += lineTotal;
    });

    return { subtotal, totalDiscount, totalTax, grandTotal };
  };

  const productOptions = products.map((p) => ({
    key: p.id,
    value: `${p.name} ($${Number(p.price).toFixed(2)})`,
  }));

  const totals = calculateTotals();

  const handleSaveQuotation = async (action: "draft" | "send") => {
    if (!deal) return;
    setError(null);

    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }

    try {
      const lineItemPayload = items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountType: it.discountType,
        discountValue: Number(it.discountValue) || 0,
        taxRate: Number(it.taxRate) || 0,
      }));

      if (isNew) {
        const payload = {
          companyId,
          dealId: deal.id,
          customerId: deal.customerId,
          currency,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          customerNote: customerNote.trim() || null,
          internalNote: internalNote.trim() || null,
          items: lineItemPayload,
        };

        const response = await createQuotation({
          companyId,
          data: payload,
        }).unwrap();

        const createdQuotation = response.data?.quotation;

        if (createdQuotation?.id) {
          await updateQuotation({
            companyId,
            id: createdQuotation.id,
            data: {
              currency,
              validUntil: validUntil ? new Date(validUntil).toISOString() : null,
              customerNote: customerNote.trim() || null,
              internalNote: internalNote.trim() || null,
              items: lineItemPayload,
            },
          }).unwrap();

          if (action === "send") {
            await sendQuotation({ companyId, id: createdQuotation.id }).unwrap();
            setNotification("Quotation created and sent successfully!");
          } else {
            setNotification("Quotation draft saved successfully!");
          }
        }
      } else {
        const updatePayload = {
          currency,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          customerNote: customerNote.trim() || null,
          internalNote: internalNote.trim() || null,
          items: lineItemPayload,
        };

        await updateQuotation({
          companyId,
          id: quotationId,
          data: updatePayload,
        }).unwrap();

        if (action === "send") {
          await sendQuotation({ companyId, id: quotationId }).unwrap();
          setNotification("Quotation updated and sent successfully!");
        } else {
          setNotification("Quotation changes saved successfully!");
        }
      }

      setTimeout(() => {
        router.push(
          `/company/${companyId}/app/deals/${deal.id}/quotations`
        );
      }, 1200);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save quotation";
      setError(errorMsg);
    }
  };

  const handleApproveNegotiation = async () => {
    if (!pendingNegotiation) return;
    try {
      setError(null);
      await approveNegotiation({
        companyId,
        quotationId,
        negotiationId: pendingNegotiation.id,
        data: { notes: approveNotes.trim() || undefined },
      }).unwrap();
      setIsApproveNegModalOpen(false);
      setApproveNotes("");
      setNotification("Customer counter-offer approved! The quotation has been updated and presented to the customer.");
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to approve negotiation";
      setError(errorMsg);
    }
  };

  const handleRejectNegotiation = async () => {
    if (!pendingNegotiation) return;
    try {
      setError(null);
      await rejectNegotiation({
        companyId,
        quotationId,
        negotiationId: pendingNegotiation.id,
        data: { reason: rejectNegReason.trim() || "Rejected by reviewer" },
      }).unwrap();
      setIsRejectNegModalOpen(false);
      setRejectNegReason("");
      setNotification("Customer counter-offer rejected. Original proposal terms have been restored.");
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to reject negotiation";
      setError(errorMsg);
    }
  };

  if (isLoadingDeal || isLoadingProducts || (!isNew && isLoadingQuote)) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-text-muted">
        <FileText className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading quotation editor...</p>
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
        <Link href={`/company/${companyId}/app/deals`}>
          <Button variant="outline" size="sm" className="mt-4">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Notifications and Alerts */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/company/${companyId}/app/deals/${deal.id}/quotations`}
            className="p-2 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {isNew
                  ? "Create Quotation"
                  : `Quotation ${existingQuotation?.quotationNo || ""}`}
              </h1>
              <Badge variant="primary">Deal #{deal.dealNo}</Badge>
              {!isNew && existingQuotation && (
                <Badge
                  variant={
                    STATUS_BADGES[existingQuotation.status] || "secondary"
                  }
                >
                  {existingQuotation.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Target Customer:{" "}
              <span className="font-semibold text-text-primary">
                {deal.customer?.userName || "Customer"}
              </span>{" "}
              ({deal.customer?.email})
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSaveQuotation("draft")}
              isLoading={(isCreating || isUpdating) && !isSending}
              disabled={isCreating || isUpdating || isSending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveQuotation("send")}
              isLoading={isSending}
              disabled={isCreating || isUpdating || isSending}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Quotation
            </Button>
          </div>
        )}

        {existingQuotation?.status === "ACCEPTED" && (
          <Link href={`/company/${companyId}/app/fulfillment/${existingQuotation.id}`}>
            <Button variant="primary" size="md" leftIcon={<Truck className="w-4 h-4" />}>
              Fulfill Quotation
            </Button>
          </Link>
        )}
      </div>

      {/* Pending Negotiation Review Section (Manager Review) */}
      {existingQuotation?.status === "NEGOTIATING" && pendingNegotiation && (
        <Card className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <MessageSquareQuote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  Customer Counter-Offer Awaiting Approval
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  The customer has proposed adjusted terms requiring commercial review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={pendingNegotiation.riskLevel === "HIGH" ? "danger" : "warning"}>
                Risk Level: {pendingNegotiation.riskLevel || "MID"}
              </Badge>
              {pendingNegotiation.requiredRole && (
                <Badge variant="purple">
                  Required Role: {pendingNegotiation.requiredRole}
                </Badge>
              )}
            </div>
          </div>

          {/* Customer Message */}
          {pendingNegotiation.message && (
            <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-text-primary">
              <span className="font-semibold block text-text-secondary text-[11px] uppercase mb-1">
                Customer Note:
              </span>
              <p className="italic">"{pendingNegotiation.message}"</p>
            </div>
          )}

          {/* Proposed Items Comparison Table */}
          {pendingNegotiation.items && pendingNegotiation.items.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-xl border border-amber-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase font-semibold bg-surface/30">
                    <th className="py-2.5 px-4">Product / Item</th>
                    <th className="py-2.5 px-3 text-center">Requested Qty</th>
                    <th className="py-2.5 px-3 text-right">Requested Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Requested Discount</th>
                    <th className="py-2.5 px-4 text-right">Requested Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pendingNegotiation.items.map((item) => (
                    <tr key={item.id} className="text-text-primary">
                      <td className="py-2.5 px-4 font-semibold">
                        {item.productName || item.productId}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {item.requestedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        ${Number(item.requestedUnitPrice).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.requestedDiscountValue > 0
                          ? `${item.requestedDiscountValue}${
                              item.requestedDiscountType === "PERCENTAGE" ? "%" : "$"
                            }`
                          : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-brand-600">
                        ${Number(item.requestedLineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reviewer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectNegModalOpen(true)}
              className="text-danger border-danger/30 hover:bg-danger/10"
              leftIcon={<X className="w-4 h-4" />}
            >
              Reject Counter-Offer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsApproveNegModalOpen(true)}
              className="bg-success text-white hover:bg-emerald-700"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Approve Counter-Offer
            </Button>
          </div>
        </Card>
      )}

      {/* Deal Context Summary Card */}
      <Card className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-text-muted uppercase font-semibold block">
              Deal Opportunity
            </span>
            <p className="font-bold text-text-primary mt-0.5">{deal.name}</p>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase font-semibold block">
              Customer Account
            </span>
            <p className="font-bold text-text-primary mt-0.5">
              {deal.customer?.userName}
            </p>
            <span className="text-xs text-text-muted">{deal.customer?.email}</span>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase font-semibold block">
              Deal Stage
            </span>
            <div className="mt-1">
              <Badge variant="purple">{deal.stage}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Quotation Parameters */}
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <CardTitle className="text-base font-bold text-text-primary">
          Quotation Settings
        </CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Valid Until"
            type="date"
            value={validUntil}
            disabled={isReadOnly}
            onChange={(e) => setValidUntil(e.target.value)}
          />

          <CurrencySelector
            label="Currency"
            value={currency}
            disabled={isReadOnly}
            onChange={(val) => setCurrency(val)}
          />
        </div>
      </Card>

      {/* Line Items Card */}
      <Card className="rounded-2xl border border-border bg-card overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary">
              Quotation Line Items
            </CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Select catalog products, define quantities, and set unit discounts.
            </p>
          </div>
          {!isReadOnly && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleAddItem}
              disabled={products.length === 0}
            >
              Add Line Item
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl bg-surface/40">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary font-medium">
                No items added to this quotation yet.
              </p>
              {!isReadOnly && (
                <>
                  <p className="text-xs text-text-muted mt-1">
                    Click "Add Line Item" to select products and configure pricing.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAddItem}
                    disabled={products.length === 0}
                  >
                    Add Line Item
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface rounded-xl border border-border space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Select
                        label="Product"
                        value={item.productId}
                        disabled={isReadOnly}
                        onChange={(val) => handleProductChange(idx, val)}
                        options={productOptions}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        disabled={isReadOnly}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        label="Unit Price ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isReadOnly}
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            "unitPrice",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    {!isReadOnly && (
                      <div className="pt-6">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-text-muted hover:text-danger hover:bg-card rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <Select
                          label="Discount Type"
                          value={item.discountType}
                          disabled={isReadOnly}
                          onChange={(val) =>
                            handleItemFieldChange(
                              idx,
                              "discountType",
                              val as "PERCENTAGE" | "FIXED"
                            )
                          }
                          options={[
                            { key: "PERCENTAGE", value: "Percent (%)" },
                            { key: "FIXED", value: "Fixed ($)" },
                          ]}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label="Discount Value"
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={isReadOnly}
                          value={item.discountValue}
                          placeholder="0.00"
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "discountValue",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end font-bold text-text-primary text-sm pt-4">
                      Line Total: $
                      {(
                        (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) -
                        (item.discountType === "PERCENTAGE"
                          ? ((Number(item.quantity) || 0) *
                              (Number(item.unitPrice) || 0) *
                              (Number(item.discountValue) || 0)) /
                            100
                          : Number(item.discountValue) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing Summary Calculation */}
          {items.length > 0 && (
            <div className="p-4 bg-surface rounded-xl border border-border flex flex-col gap-2 max-w-sm ml-auto text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Gross Subtotal:</span>
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
                <span>Grand Total:</span>
                <span className="text-base text-brand-600">
                  ${totals.grandTotal.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <CardTitle className="text-base font-bold text-text-primary">
          Proposal Notes & Terms
        </CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5 uppercase">
              Customer Note (Visible to Customer)
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Add payment terms, validity context, or greetings..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5 uppercase">
              Internal Note (Private / Audit)
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Internal pricing reasoning or approval remarks..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Revision & Negotiation History Section */}
      {!isNew && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-bold text-text-primary">
                Revision & Negotiation History
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              leftIcon={<History className="w-3.5 h-3.5" />}
            >
              {showHistory ? "Hide History" : "View History"}
            </Button>
          </div>

          {showHistory && (
            <div className="space-y-4">
              {/* Negotiations List */}
              {negotiations.length > 0 && (
                <Card className="rounded-2xl border border-border bg-card overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b border-border bg-surface/30">
                    <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-brand-600" />
                      <span>Negotiation Records ({negotiations.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {negotiations.map((neg) => (
                      <div
                        key={neg.id}
                        className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">
                              Negotiation Cycle
                            </span>
                            <Badge
                              variant={NEGOTIATION_STATUS_BADGES[neg.status] || "secondary"}
                            >
                              {neg.status}
                            </Badge>
                            {neg.riskLevel && (
                              <Badge variant={neg.riskLevel === "LOW" ? "success" : "warning"}>
                                Risk: {neg.riskLevel}
                              </Badge>
                            )}
                            {neg.requiredRole && (
                              <Badge variant="purple">
                                Approver: {neg.requiredRole}
                              </Badge>
                            )}
                          </div>
                          <span className="text-text-muted text-[11px]">
                            {new Date(neg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {neg.message && (
                          <p className="italic text-text-secondary">"{neg.message}"</p>
                        )}

                        {neg.rejectionReason && (
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-danger text-[11px]">
                            <strong>Rejection Reason:</strong> {neg.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Revisions List */}
              <Card className="rounded-2xl border border-border bg-card overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-border bg-surface/30">
                  <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Versioned Revisions ({revisions.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {revisions.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-2">
                      No revisions recorded yet.
                    </p>
                  ) : (
                    revisions.map((rev, i) => (
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
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/company/${companyId}/app/deals/${deal.id}/quotations`}
        >
          <Button variant="outline" size="md">
            {isReadOnly ? "Back to Quotations" : "Cancel"}
          </Button>
        </Link>
        {!isReadOnly && (
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSaveQuotation("draft")}
              isLoading={(isCreating || isUpdating) && !isSending}
              disabled={isCreating || isUpdating || isSending || items.length === 0}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveQuotation("send")}
              isLoading={isSending}
              disabled={isCreating || isUpdating || isSending || items.length === 0}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Quotation
            </Button>
          </>
        )}
      </div>

      {/* Approve Negotiation Modal */}
      <Modal
        isOpen={isApproveNegModalOpen}
        onClose={() => setIsApproveNegModalOpen(false)}
        title="Approve Customer Counter-Offer"
        description="Approving will replace quotation items with the negotiated terms, create a new revision, and present final terms to the customer for acceptance."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-success shrink-0" />
            <span>The quotation status will transition to <strong>SENT</strong>.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Internal Approval Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="E.g., Approved as per manager margin guidelines..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveNegModalOpen(false)}
              disabled={isApprovingNeg}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApproveNegotiation}
              isLoading={isApprovingNeg}
              className="bg-success hover:bg-emerald-700 text-white border-transparent"
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Negotiation Modal */}
      <Modal
        isOpen={isRejectNegModalOpen}
        onClose={() => setIsRejectNegModalOpen(false)}
        title="Reject Customer Counter-Offer"
        description="Rejecting will preserve original quotation terms and allow the customer to re-negotiate or accept the original proposal."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger shrink-0" />
            <span>The customer will be notified of the rejection reason.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Reason for Rejection
            </label>
            <textarea
              rows={3}
              value={rejectNegReason}
              onChange={(e) => setRejectNegReason(e.target.value)}
              placeholder="E.g., Requested discount exceeds maximum policy threshold..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger shadow-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectNegModalOpen(false)}
              disabled={isRejectingNeg}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRejectNegotiation}
              isLoading={isRejectingNeg}
              className="bg-danger hover:bg-red-700 text-white border-transparent"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
