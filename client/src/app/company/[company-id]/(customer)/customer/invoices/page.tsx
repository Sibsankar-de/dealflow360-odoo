"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import {
  useGetInvoicesQuery,
  useGetInvoiceSummaryQuery,
  useRecordInvoicePaymentMutation,
} from "@/store/features/invoice/invoiceApi";
import { InvoiceResponse, InvoiceStatus } from "@/types/invoice";
import {
  Receipt,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const getStatusConfig = (
  status: InvoiceStatus
): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "PAID":
      return { variant: "success", label: "Paid", dotClass: "bg-emerald-500" };
    case "PARTIALLY_PAID":
      return {
        variant: "warning",
        label: "Partially Paid",
        dotClass: "bg-amber-500",
      };
    case "POSTED":
      return { variant: "info", label: "Open / Posted", dotClass: "bg-blue-500" };
    case "DRAFT":
      return { variant: "secondary", label: "Draft", dotClass: "bg-slate-400" };
    case "CANCELLED":
    case "VOID":
      return { variant: "danger", label: status, dotClass: "bg-red-500" };
    default:
      return {
        variant: "secondary",
        label: status,
        dotClass: "bg-slate-400",
      };
  }
};

export default function CustomerInvoicesPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceResponse | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Live queries
  const { data: invoicesData, isLoading: isLoadingInvoices } = useGetInvoicesQuery(
    {
      companyId,
      params: {
        search: search.trim() || undefined,
        status: activeFilter !== "ALL" ? activeFilter : undefined,
        page,
        limit: 10,
      },
    },
    { skip: !companyId }
  );

  const { data: summaryData, isLoading: isLoadingSummary } =
    useGetInvoiceSummaryQuery({ companyId }, { skip: !companyId });

  const [recordPayment, { isLoading: isProcessingPayment }] =
    useRecordInvoicePaymentMutation();

  const invoices = invoicesData?.data?.docs || [];
  const totalPages = invoicesData?.data?.totalPages || 1;
  const summary = summaryData?.data;

  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const handlePayInvoice = (inv: InvoiceResponse) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !companyId) return;

    try {
      await recordPayment({
        companyId,
        invoiceId: selectedInvoice.id,
        data: {
          amount: selectedInvoice.remainingAmount,
          paymentMethod: "Online Payment",
          notes: "Customer portal online payment",
        },
      }).unwrap();

      toast.success(
        `Payment receipt generated for ${selectedInvoice.invoiceNo}. Balance settled successfully!`
      );
      setIsPayModalOpen(false);
      setSelectedInvoice(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      toast.error(
        errorObj?.data?.message ||
          errorObj?.message ||
          "Payment processing failed. Please try again."
      );
    }
  };

  const handleDownloadInvoice = (invoiceNo: string) => {
    toast.success(`Downloading PDF statement for ${invoiceNo}...`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface border border-border text-brand-600 shadow-2xs">
              <Receipt className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Invoices & Billing
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Review delivery-backed invoices, inspect item line billings, and manage payments.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-brand-600 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Total Invoiced
            </span>
            <div className="p-2 rounded-xl bg-surface border border-border text-brand-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {isLoadingSummary ? (
              <div className="h-8 w-28 bg-surface animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-600">
                {formatCurrency(summary?.totalAmount ?? 0)}
              </span>
            )}
            <span className="text-xs text-text-muted">
              {summary?.totalCount ?? 0} invoices issued to date
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Total Paid
            </span>
            <div className="p-2 rounded-xl bg-surface border border-border text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {isLoadingSummary ? (
              <div className="h-8 w-28 bg-surface animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(summary?.paidAmount ?? 0)}
              </span>
            )}
            <span className="text-xs text-text-muted">
              {summary?.paidCount ?? 0} invoices fully settled
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-blue-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Balance Outstanding
            </span>
            <div className="p-2 rounded-xl bg-surface border border-border text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {isLoadingSummary ? (
              <div className="h-8 w-28 bg-surface animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600">
                {formatCurrency(summary?.remainingAmount ?? 0)}
              </span>
            )}
            <span className="text-xs text-text-muted">
              {(summary?.postedCount ?? 0) + (summary?.partiallyPaidCount ?? 0)} awaiting full settlement
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "ALL", label: "All Invoices" },
              { id: "POSTED", label: "Open / Unpaid" },
              { id: "PARTIALLY_PAID", label: "Partially Paid" },
              { id: "PAID", label: "Paid" },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id as InvoiceStatus | "ALL");
                  setPage(1);
                }}
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

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice number..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted shadow-xs"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-border bg-card">
          <CardTitle className="text-lg font-bold text-text-primary">
            Invoice Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-4">Sales Order / Delivery</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingInvoices ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                      <span className="text-xs text-text-muted">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary">
                    <Receipt className="w-8 h-8 text-text-muted opacity-60 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-text-primary">
                      No invoices found
                    </p>
                    <p className="text-xs text-text-muted">
                      No invoices match your current search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const badge = getStatusConfig(inv.status);
                  const isPending = inv.remainingAmount > 0 && inv.status !== "CANCELLED" && inv.status !== "VOID";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-brand-600 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {inv.invoiceNo}
                        </button>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap max-w-xs">
                        <div className="font-semibold text-text-primary truncate">
                          {inv.orderNo || "Sales Order"}
                        </div>
                        {inv.deliveryNo && (
                          <div className="text-xs text-text-muted">
                            Delivery: {inv.deliveryNo}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-text-secondary whitespace-nowrap text-xs">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-4 px-4 text-text-secondary whitespace-nowrap text-xs">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                        {formatCurrency(inv.paidAmount, inv.currency)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(inv.remainingAmount, inv.currency)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge
                          variant={badge.variant}
                          icon={
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dotClass}`}
                            />
                          }
                        >
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-text-muted hover:text-text-primary"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(inv.invoiceNo)}
                            className="p-1.5 text-text-muted hover:text-text-primary"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {isPending && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handlePayInvoice(inv)}
                              className="text-xs"
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && !isPayModalOpen && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNo}`}
          description={`Issued against ${selectedInvoice.orderNo || "Sales Order"}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="p-4 bg-surface rounded-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-text-muted block">Issue Date</span>
                <span className="font-semibold text-text-primary">
                  {selectedInvoice.issueDate
                    ? new Date(selectedInvoice.issueDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Due Date</span>
                <span className="font-semibold text-text-primary">
                  {selectedInvoice.dueDate
                    ? new Date(selectedInvoice.dueDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Payment Status</span>
                <span className="font-semibold text-text-primary">
                  {selectedInvoice.status}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Balance Due</span>
                <span className="font-bold text-brand-600">
                  {formatCurrency(
                    selectedInvoice.remainingAmount,
                    selectedInvoice.currency
                  )}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-border text-text-muted font-semibold uppercase">
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Discount</th>
                    <th className="py-2.5 px-4 text-right">Tax</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!selectedInvoice.items || selectedInvoice.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-text-muted">
                        No line items recorded on this invoice.
                      </td>
                    </tr>
                  ) : (
                    selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-surface/30">
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {item.productName || "Delivered Product"}
                        </td>
                        <td className="py-3 px-4 text-right text-text-secondary">
                          {item.deliveredQuantity}
                        </td>
                        <td className="py-3 px-4 text-right text-text-secondary">
                          {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-secondary">
                          {formatCurrency(item.discount, selectedInvoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-secondary">
                          {formatCurrency(item.tax, selectedInvoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-text-primary">
                          {formatCurrency(item.lineTotal, selectedInvoice.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(
                      selectedInvoice.subtotal,
                      selectedInvoice.currency
                    )}
                  </span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Discount</span>
                    <span className="text-amber-600">
                      -{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}
                    </span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Tax</span>
                    <span>
                      +{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span>Paid to Date</span>
                  <span className="text-emerald-600 font-medium">
                    -
                    {formatCurrency(
                      selectedInvoice.paidAmount,
                      selectedInvoice.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-text-primary pt-2 border-t border-border">
                  <span>Remaining Due</span>
                  <span className="text-brand-600">
                    {formatCurrency(
                      selectedInvoice.remainingAmount,
                      selectedInvoice.currency
                    )}
                  </span>
                </div>
              </div>
            </div>

            <ModalFooter className="px-0 pb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNo)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF
              </Button>
              {selectedInvoice.remainingAmount > 0 && selectedInvoice.status !== "CANCELLED" && selectedInvoice.status !== "VOID" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPayModalOpen(true)}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  Pay Balance
                </Button>
              )}
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Payment Gateway Modal */}
      {isPayModalOpen && selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pay Invoice ${selectedInvoice.invoiceNo}`}
          description="Complete your invoice payment securely via authorized banking channels."
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-text-muted block">Amount Due</span>
                <span className="text-xl font-bold text-brand-600">
                  {formatCurrency(
                    selectedInvoice.remainingAmount,
                    selectedInvoice.currency
                  )}
                </span>
              </div>
              <Badge variant="primary">Online Payment</Badge>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-primary block">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface border-2 border-brand-600 rounded-xl flex items-center gap-3 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Credit Card
                    </span>
                    <span className="text-[10px] text-text-muted">
                      Instant Settlement
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-surface border border-border rounded-xl flex items-center gap-3 cursor-pointer opacity-75 hover:opacity-100">
                  <Building2 className="w-5 h-5 text-text-muted" />
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Wire Transfer
                    </span>
                    <span className="text-[10px] text-text-muted">
                      ACH / SEPA Wire
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter className="px-0 pb-0 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessingPayment}
                loadingText="Authorizing Payment..."
                onClick={handleConfirmPayment}
              >
                Confirm & Pay{" "}
                {formatCurrency(
                  selectedInvoice.remainingAmount,
                  selectedInvoice.currency
                )}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
