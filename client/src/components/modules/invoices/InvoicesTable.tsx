"use client";

import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { InvoiceResponse, InvoiceStatus } from "@/types/invoice";
import { Search, Receipt, CreditCard, Eye, ArrowUpRight } from "lucide-react";

export interface InvoicesTableProps {
  invoices: InvoiceResponse[];
  companyId: string;
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  totalDocs?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  onRecordPayment?: (invoice: InvoiceResponse) => void;
  className?: string;
}

const getStatusBadgeConfig = (status: InvoiceStatus): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "PAID":
      return { variant: "success", label: "Paid", dotClass: "bg-emerald-500" };
    case "PARTIALLY_PAID":
      return { variant: "warning", label: "Partially Paid", dotClass: "bg-amber-500" };
    case "POSTED":
      return { variant: "info", label: "Posted", dotClass: "bg-blue-500" };
    case "DRAFT":
      return { variant: "secondary", label: "Draft", dotClass: "bg-slate-400" };
    case "CANCELLED":
      return { variant: "danger", label: "Cancelled", dotClass: "bg-red-500" };
    case "VOID":
      return { variant: "danger", label: "Void", dotClass: "bg-red-500" };
    default:
      return { variant: "secondary", label: status, dotClass: "bg-slate-400" };
  }
};

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  companyId,
  isLoading = false,
  page = 1,
  totalPages = 1,
  totalDocs,
  onPageChange,
  search = "",
  onSearchChange,
  onRecordPayment,
  className,
}) => {
  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card
      className={clsx(
        "rounded-2xl border border-border bg-card shadow-xs overflow-hidden",
        className
      )}
    >
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">Invoices</CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">
            {totalDocs !== undefined
              ? `${totalDocs} total invoices issued for delivered goods`
              : "Invoices generated from delivered fulfillment batches"}
          </p>
        </div>

        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by invoice number..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Invoice #</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Order / Delivery</th>
              <th className="py-3.5 px-4 text-right">Total Amount</th>
              <th className="py-3.5 px-4 text-right">Paid</th>
              <th className="py-3.5 px-4 text-right">Balance Due</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-surface rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-surface rounded ml-auto" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-surface rounded ml-auto" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-surface rounded ml-auto" /></td>
                  <td className="py-4 px-4"><div className="h-6 w-20 bg-surface rounded-full" /></td>
                  <td className="py-4 px-6 text-right"><div className="h-7 w-20 bg-surface rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="w-8 h-8 text-text-muted opacity-60" />
                    <p className="text-sm font-semibold text-text-primary">No invoices found</p>
                    <p className="text-xs text-text-muted">
                      {search
                        ? "No invoices match your search query."
                        : "Invoices will be automatically created whenever orders are fulfilled."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const badge = getStatusBadgeConfig(inv.status);
                const detailHref = `/company/${companyId}/workspace/invoices/${inv.id}`;
                const canRecordPayment =
                  inv.status !== "PAID" &&
                  inv.status !== "CANCELLED" &&
                  inv.status !== "VOID" &&
                  inv.remainingAmount > 0;

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-surface/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-semibold text-brand-600 whitespace-nowrap">
                      <Link
                        href={detailHref}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {inv.invoiceNo}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                      <div className="font-medium text-text-primary">
                        {formatDate(inv.issueDate)}
                      </div>
                      {inv.dueDate && (
                        <span className="text-[11px] text-text-muted">
                          Due {formatDate(inv.dueDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-primary whitespace-nowrap max-w-[180px] truncate">
                      <div>{inv.customerName || "Customer"}</div>
                      {inv.customerEmail && (
                        <div className="text-xs font-normal text-text-muted truncate">
                          {inv.customerEmail}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                      {inv.orderNo && (
                        <div className="font-medium text-text-primary">{inv.orderNo}</div>
                      )}
                      {inv.deliveryNo && (
                        <div className="text-[11px] text-text-muted">{inv.deliveryNo}</div>
                      )}
                      {!inv.orderNo && !inv.deliveryNo && "-"}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-text-primary">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap font-medium text-emerald-600">
                      {formatCurrency(inv.paidAmount, inv.currency)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-brand-600">
                      {formatCurrency(inv.remainingAmount, inv.currency)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={badge.variant}
                        icon={<span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", badge.dotClass)} />}
                      >
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {canRecordPayment && onRecordPayment && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onRecordPayment(inv)}
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            className="text-xs px-2.5 py-1"
                          >
                            Pay
                          </Button>
                        )}
                        <Link href={detailHref}>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            className="text-xs px-2.5 py-1 border-border"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 py-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Pagination
            currentPage={page}
            totalPage={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </Card>
  );
};

export default InvoicesTable;
