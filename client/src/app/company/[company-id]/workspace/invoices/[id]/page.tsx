"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { RecordPaymentModal } from "@/components/modules/invoices/RecordPaymentModal";
import { InvoiceStatus } from "@/types/invoice";
import {
  useGetInvoiceByIdQuery,
} from "@/store/features/invoice/invoiceApi";
import {
  ArrowLeft,
  Receipt,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  User,
  Package,
  FileCheck,
  AlertCircle,
} from "lucide-react";

const getStatusBadgeConfig = (status?: InvoiceStatus): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "PAID":
      return { variant: "success", label: "Paid in Full", dotClass: "bg-emerald-500" };
    case "PARTIALLY_PAID":
      return { variant: "warning", label: "Partially Paid", dotClass: "bg-amber-500" };
    case "POSTED":
      return { variant: "info", label: "Posted / Awaiting Payment", dotClass: "bg-blue-500" };
    case "DRAFT":
      return { variant: "secondary", label: "Draft", dotClass: "bg-slate-400" };
    case "CANCELLED":
      return { variant: "danger", label: "Cancelled", dotClass: "bg-red-500" };
    case "VOID":
      return { variant: "danger", label: "Void", dotClass: "bg-red-500" };
    default:
      return { variant: "secondary", label: status || "Unknown", dotClass: "bg-slate-400" };
  }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params["company-id"] as string;
  const id = params["id"] as string;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const {
    data: invoiceData,
    isLoading,
    error,
    refetch,
  } = useGetInvoiceByIdQuery(
    { companyId, id },
    { skip: !companyId || !id }
  );

  const invoice = invoiceData?.data?.invoice;

  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-surface rounded-lg" />
        <div className="h-40 bg-surface rounded-2xl" />
        <div className="h-64 bg-surface rounded-2xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Invoice Not Found</h2>
        <p className="text-sm text-text-secondary">
          The invoice you are looking for does not exist or you do not have permission to view it.
        </p>
        <Link href={`/company/${companyId}/workspace/invoices`}>
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const badgeConfig = getStatusBadgeConfig(invoice.status);
  const canRecordPayment =
    invoice.status !== "PAID" &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "VOID" &&
    invoice.remainingAmount > 0;

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6 print:p-0 print:m-0">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/company/${companyId}/workspace/invoices`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs border-border"
          >
            Print / PDF
          </Button>
          {canRecordPayment && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              leftIcon={<CreditCard className="w-4 h-4" />}
              className="text-xs"
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Main Invoice Sheet */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Invoice Header */}
        <div className="p-6 sm:p-8 border-b border-border bg-surface/30 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 print:hidden">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                  {invoice.invoiceNo}
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Issued on {formatDate(invoice.issueDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <Badge
              variant={badgeConfig.variant}
              icon={<span className={clsx("w-2 h-2 rounded-full shrink-0", badgeConfig.dotClass)} />}
              className="text-xs px-3 py-1 font-semibold"
            >
              {badgeConfig.label}
            </Badge>
            {invoice.paymentTerms && (
              <span className="text-xs text-text-muted font-medium">
                Terms: {invoice.paymentTerms}
              </span>
            )}
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-border text-xs">
          <div className="space-y-1">
            <span className="text-text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <User className="w-3.5 h-3.5 text-text-muted" />
              Customer Details
            </span>
            <div className="font-bold text-text-primary text-sm">
              {invoice.customerName || "Customer"}
            </div>
            {invoice.customerEmail && (
              <div className="text-text-secondary">{invoice.customerEmail}</div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Package className="w-3.5 h-3.5 text-text-muted" />
              Order / Delivery Ref
            </span>
            <div className="font-semibold text-text-primary">
              Order: {invoice.orderNo || "N/A"}
            </div>
            {invoice.deliveryNo && (
              <div className="text-text-secondary">Delivery: {invoice.deliveryNo}</div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              Payment Due Date
            </span>
            <div className="font-bold text-text-primary text-sm">
              {formatDate(invoice.dueDate)}
            </div>
            {invoice.paidAt && (
              <div className="text-emerald-600 font-medium">
                Paid at: {formatDate(invoice.paidAt)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <FileCheck className="w-3.5 h-3.5 text-text-muted" />
              Outstanding Balance
            </span>
            <div className="font-bold text-brand-600 text-base">
              {formatCurrency(invoice.remainingAmount, invoice.currency)}
            </div>
            <div className="text-[11px] text-text-muted">
              Paid: {formatCurrency(invoice.paidAmount, invoice.currency)} of {formatCurrency(invoice.total, invoice.currency)}
            </div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
                <th className="py-3 px-6">Product / Description</th>
                <th className="py-3 px-4 text-center">Delivered Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(invoice.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-text-primary">
                    {item.productName || "Product Line Item"}
                  </td>
                  <td className="py-4 px-4 text-center font-medium text-text-primary">
                    {item.deliveredQuantity}
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {item.discount > 0
                      ? `-${formatCurrency(item.discount, invoice.currency)}`
                      : "-"}
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {item.tax > 0
                      ? formatCurrency(item.tax, invoice.currency)
                      : "-"}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-text-primary">
                    {formatCurrency(item.lineTotal, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Notes Section */}
        <div className="p-6 sm:p-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Payment Instructions & Notes
            </h3>
            <div className="p-4 bg-surface/50 border border-border rounded-xl text-xs text-text-secondary leading-relaxed">
              {invoice.notes || "Standard 30-day payment term applies. Please reference the invoice number in wire/transfer descriptions."}
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2.5 max-w-sm ml-auto w-full text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex items-center justify-between text-text-secondary">
                <span>Total Discount:</span>
                <span className="font-semibold text-emerald-600">
                  -{formatCurrency(invoice.discount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.tax > 0 && (
              <div className="flex items-center justify-between text-text-secondary">
                <span>Tax:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-bold text-text-primary">
              <span>Total Invoice Amount:</span>
              <span className="text-base">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-text-secondary">
              <span>Paid Amount:</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(invoice.paidAmount, invoice.currency)}
              </span>
            </div>

            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-sm font-bold text-brand-600 bg-brand-50/50 p-3 rounded-xl">
              <span>Balance Due:</span>
              <span className="text-lg">
                {formatCurrency(invoice.remainingAmount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice}
          companyId={companyId}
          onSuccess={() => refetch()}
        />
      )}
    </main>
  );
}
