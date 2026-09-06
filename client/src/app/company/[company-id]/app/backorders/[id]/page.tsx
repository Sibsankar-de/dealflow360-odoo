"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { FulfillBackorderModal } from "@/components/modules/backorders/FulfillBackorderModal";
import { BackorderStatus } from "@/types/backorder";
import {
  useGetBackorderByIdQuery,
} from "@/store/features/backorder/backorderApi";
import {
  ArrowLeft,
  Layers,
  Truck,
  Calendar,
  Clock,
  PackageCheck,
  AlertTriangle,
  AlertCircle,
  FileText,
  Boxes,
} from "lucide-react";

const getStatusBadgeConfig = (status?: BackorderStatus): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "PENDING":
      return { variant: "danger", label: "Pending Stock Allocation", dotClass: "bg-red-500" };
    case "PARTIALLY_FULFILLED":
      return { variant: "warning", label: "Partially Fulfilled", dotClass: "bg-amber-500" };
    case "FULFILLED":
      return { variant: "success", label: "Completely Fulfilled", dotClass: "bg-emerald-500" };
    case "CANCELLED":
      return { variant: "secondary", label: "Cancelled", dotClass: "bg-slate-400" };
    default:
      return { variant: "secondary", label: status || "Unknown", dotClass: "bg-slate-400" };
  }
};

export default function BackorderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params["company-id"] as string;
  const id = params["id"] as string;

  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);

  const {
    data: backorderData,
    isLoading,
    error,
    refetch,
  } = useGetBackorderByIdQuery(
    { companyId, id },
    { skip: !companyId || !id }
  );

  const backorder = backorderData?.data?.backorder;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  if (error || !backorder) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Backorder Not Found</h2>
        <p className="text-sm text-text-secondary">
          The backorder you are looking for does not exist or you do not have permission to view it.
        </p>
        <Link href={`/company/${companyId}/app/backorders`}>
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Backorders
          </Button>
        </Link>
      </div>
    );
  }

  const badgeConfig = getStatusBadgeConfig(backorder.status);
  const canFulfill =
    backorder.status !== "FULFILLED" &&
    backorder.status !== "CANCELLED" &&
    backorder.remainingQuantity > 0;

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/company/${companyId}/app/backorders`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Backorders
        </Link>

        {canFulfill && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFulfillModalOpen(true)}
            leftIcon={<Truck className="w-4 h-4" />}
            className="text-xs"
          >
            Fulfill Backorder
          </Button>
        )}
      </div>

      {/* Main Backorder Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Backorder Header */}
        <div className="p-6 sm:p-8 border-b border-border bg-surface/30 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                  {backorder.backorderNo}
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Originated from Sales Order {backorder.orderNo || "N/A"}
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
            {backorder.expectedDate && (
              <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Target Date: {formatDate(backorder.expectedDate)}
              </span>
            )}
          </div>
        </div>

        {/* Metric Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border bg-surface/10">
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Units Backordered
            </span>
            <span className="text-3xl font-bold text-text-primary">
              {backorder.totalQuantity} <span className="text-sm font-normal text-text-muted">units</span>
            </span>
          </div>

          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Units Fulfilled
            </span>
            <span className="text-3xl font-bold text-emerald-600">
              {backorder.fulfilledQuantity} <span className="text-sm font-normal text-text-muted">units</span>
            </span>
          </div>

          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Remaining Outstanding
            </span>
            <span className="text-3xl font-bold text-red-600">
              {backorder.remainingQuantity} <span className="text-sm font-normal text-text-muted">units</span>
            </span>
          </div>
        </div>

        {/* Backorder Line Items Table */}
        <div className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
            Backordered Item Lines
          </h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
                  <th className="py-3.5 px-6">Product Line Item</th>
                  <th className="py-3.5 px-4 text-center">Ordered Qty</th>
                  <th className="py-3.5 px-4 text-center">Fulfilled</th>
                  <th className="py-3.5 px-6 text-center">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(backorder.items || []).map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-text-primary">
                      {item.productName || "Product Line Item"}
                    </td>
                    <td className="py-4 px-4 text-center text-text-secondary font-medium">
                      {item.orderedQuantity} units
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-emerald-600">
                      {item.fulfilledQuantity} units
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-red-600">
                      {item.remainingQuantity} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Linked Deliveries Section (if any) */}
        {backorder.deliveries && backorder.deliveries.length > 0 && (
          <div className="p-6 sm:p-8 border-t border-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-600" />
              Associated Fulfillment Deliveries
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {backorder.deliveries.map((del) => (
                <div
                  key={del.id}
                  className="p-4 bg-surface/50 border border-border rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-text-primary">{del.deliveryNo}</div>
                    <div className="text-text-muted mt-0.5">
                      {del.deliveredAt
                        ? `Delivered on ${formatDate(del.deliveredAt)}`
                        : del.shippedAt
                        ? `Shipped on ${formatDate(del.shippedAt)}`
                        : "Processed"}
                    </div>
                    {del.trackingNumber && (
                      <div className="text-brand-600 font-medium mt-0.5">
                        Tracking: {del.trackingNumber}
                      </div>
                    )}
                  </div>
                  <Badge variant="success">Delivered</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {backorder.notes && (
          <div className="p-6 sm:p-8 border-t border-border space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Internal Backorder Notes
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed p-4 bg-surface/40 rounded-xl border border-border">
              {backorder.notes}
            </p>
          </div>
        )}
      </Card>

      {/* Fulfill Backorder Modal */}
      {isFulfillModalOpen && (
        <FulfillBackorderModal
          isOpen={isFulfillModalOpen}
          onClose={() => setIsFulfillModalOpen(false)}
          backorder={backorder}
          companyId={companyId}
          onSuccess={() => refetch()}
        />
      )}
    </main>
  );
}
