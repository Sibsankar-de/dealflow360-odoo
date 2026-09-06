"use client";

import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackorderResponse, BackorderStatus } from "@/types/backorder";
import { Search, Layers, Truck, Eye, ArrowUpRight } from "lucide-react";

export interface BackordersTableProps {
  backorders: BackorderResponse[];
  companyId: string;
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  totalDocs?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  onFulfill?: (backorder: BackorderResponse) => void;
  className?: string;
}

const getStatusBadgeConfig = (status: BackorderStatus): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "PENDING":
      return { variant: "danger", label: "Pending", dotClass: "bg-red-500" };
    case "PARTIALLY_FULFILLED":
      return { variant: "warning", label: "Partially Fulfilled", dotClass: "bg-amber-500" };
    case "FULFILLED":
      return { variant: "success", label: "Fulfilled", dotClass: "bg-emerald-500" };
    case "CANCELLED":
      return { variant: "secondary", label: "Cancelled", dotClass: "bg-slate-400" };
    default:
      return { variant: "secondary", label: status, dotClass: "bg-slate-400" };
  }
};

export const BackordersTable: React.FC<BackordersTableProps> = ({
  backorders,
  companyId,
  isLoading = false,
  page = 1,
  totalPages = 1,
  totalDocs,
  onPageChange,
  search = "",
  onSearchChange,
  onFulfill,
  className,
}) => {
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
          <CardTitle className="text-lg font-bold text-text-primary">
            Backorders
          </CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">
            {totalDocs !== undefined
              ? `${totalDocs} total backorder logs awaiting stock fulfillment`
              : "Undelivered quantities linked to originating sales orders"}
          </p>
        </div>

        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by backorder number..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Backorder #</th>
              <th className="py-3.5 px-4">Sales Order</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4">Expected Date</th>
              <th className="py-3.5 px-4 text-center">Total Qty</th>
              <th className="py-3.5 px-4 text-center">Fulfilled</th>
              <th className="py-3.5 px-4 text-center">Remaining</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-surface rounded" /></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-surface rounded mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-surface rounded mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-surface rounded mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-6 w-20 bg-surface rounded-full" /></td>
                  <td className="py-4 px-6 text-right"><div className="h-7 w-20 bg-surface rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : backorders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-text-muted opacity-60" />
                    <p className="text-sm font-semibold text-text-primary">
                      No backorders found
                    </p>
                    <p className="text-xs text-text-muted">
                      {search
                        ? "No backorders match your search query."
                        : "Backorders are automatically generated when partial quantities are fulfilled."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              backorders.map((bo) => {
                const badge = getStatusBadgeConfig(bo.status);
                const detailHref = `/company/${companyId}/app/backorders/${bo.id}`;
                const canFulfill =
                  bo.status !== "FULFILLED" &&
                  bo.status !== "CANCELLED" &&
                  bo.remainingQuantity > 0;

                return (
                  <tr
                    key={bo.id}
                    className="hover:bg-surface/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-semibold text-brand-600 whitespace-nowrap">
                      <Link
                        href={detailHref}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {bo.backorderNo}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-text-primary whitespace-nowrap">
                      {bo.orderNo || "Sales Order"}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap font-medium">
                      {formatDate(bo.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap font-medium">
                      {formatDate(bo.expectedDate)}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap font-medium text-text-primary">
                      {bo.totalQuantity} units
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap font-semibold text-emerald-600">
                      {bo.fulfilledQuantity}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap font-bold text-red-600">
                      {bo.remainingQuantity}
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
                        {canFulfill && onFulfill && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onFulfill(bo)}
                            leftIcon={<Truck className="w-3.5 h-3.5" />}
                            className="text-xs px-2.5 py-1"
                          >
                            Fulfill
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

export default BackordersTable;
