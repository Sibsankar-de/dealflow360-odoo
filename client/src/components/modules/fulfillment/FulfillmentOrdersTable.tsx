import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { FulfillmentOrder, FulfillmentStatus } from "@/types/fulfillment";
import { Search, PackageOpen } from "lucide-react";

export interface FulfillmentOrdersTableProps {
  orders: FulfillmentOrder[];
  companyId?: string;
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  totalDocs?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  className?: string;
}

const getStatusBadgeConfig = (status: FulfillmentStatus): { variant: BadgeVariant; dotClass: string } => {
  switch (status) {
    case "Ready to Fulfill":
      return { variant: "success", dotClass: "bg-emerald-500" };
    case "Partially Fulfilled":
      return { variant: "warning", dotClass: "bg-amber-500" };
    case "Fulfilled":
      return { variant: "success", dotClass: "bg-emerald-500" };
    case "Backordered":
      return { variant: "danger", dotClass: "bg-red-500" };
    default:
      return { variant: "secondary", dotClass: "bg-slate-400" };
  }
};

export const FulfillmentOrdersTable: React.FC<FulfillmentOrdersTableProps> = ({
  orders,
  companyId,
  isLoading = false,
  page = 1,
  totalPages = 1,
  totalDocs,
  onPageChange,
  search = "",
  onSearchChange,
  className,
}) => {
  const getFulfillmentHref = (order: FulfillmentOrder) => {
    return companyId
      ? `/company/${companyId}/workspace/fulfillment/${order.id}`
      : `/fulfillment/${order.id}`;
  };

  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">Orders</CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">
            {totalDocs !== undefined ? `${totalDocs} total quotations / orders` : "Quotations ready or in fulfillment"}
          </p>
        </div>

        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by order or customer..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-187.5">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Order / Quotation</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Items</th>
              <th className="py-3.5 px-4">Total Qty</th>
              <th className="py-3.5 px-4">Warehouses</th>
              <th className="py-3.5 px-4">Shipments</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Required By</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-surface rounded" /></td>
                  <td className="py-4 px-4"><div className="h-6 w-24 bg-surface rounded-full" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-surface rounded" /></td>
                  <td className="py-4 px-6 text-right"><div className="h-7 w-16 bg-surface rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageOpen className="w-8 h-8 text-text-muted opacity-60" />
                    <p className="text-sm font-semibold text-text-primary">No fulfillment orders found</p>
                    <p className="text-xs text-text-muted">
                      {search ? "No orders match your search query." : "There are currently no accepted quotations pending fulfillment."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusBadgeConfig(order.status);
                const isUrgentOrBackordered = order.status === "Backordered" || order.isUrgentDate;
                const href = getFulfillmentHref(order);

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-surface/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-semibold text-brand-600 whitespace-nowrap">
                      <Link
                        href={href}
                        className="hover:underline transition-colors"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-primary whitespace-nowrap max-w-55 truncate">
                      {order.customerName}
                    </td>
                    <td className="py-4 px-4 text-text-secondary whitespace-nowrap font-medium">
                      {order.itemsCount}
                    </td>
                    <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-text-primary">{order.totalQty}</span>
                        <span className="text-xs text-text-muted">{order.qtyUnit}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-text-secondary whitespace-nowrap font-medium">
                      {order.warehousesCount}
                    </td>
                    <td className="py-4 px-4 text-text-secondary whitespace-nowrap font-medium">
                      {order.shipmentsCount}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={statusConfig.variant}
                        icon={<span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", statusConfig.dotClass)} />}
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td
                      className={clsx(
                        "py-4 px-4 text-xs whitespace-nowrap font-medium",
                        isUrgentOrBackordered ? "text-red-500 font-semibold" : "text-text-secondary"
                      )}
                    >
                      {order.requiredBy}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {order.status !== "Fulfilled" ? (
                        <Link href={href}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs font-medium px-3.5 py-1.5 border-border hover:bg-surface text-text-primary"
                          >
                            Manage
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-text-muted font-medium px-2 py-1">
                          Completed
                        </span>
                      )}
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

export default FulfillmentOrdersTable;
