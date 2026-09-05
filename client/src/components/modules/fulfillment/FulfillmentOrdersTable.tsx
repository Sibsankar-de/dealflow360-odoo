import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { FulfillmentOrder, FulfillmentStatus } from "@/types/fulfillment";

export interface FulfillmentOrdersTableProps {
  orders: FulfillmentOrder[];
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
  className,
}) => {
  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card">
        <CardTitle className="text-lg font-bold text-text-primary">Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-187.5">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Order</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Items</th>
              <th className="py-3.5 px-4">Total Qty</th>
              <th className="py-3.5 px-4">Warehouses</th>
              <th className="py-3.5 px-4">Shipments</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Required By</th>
              <th className="py-3.5 px-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((order) => {
              const statusConfig = getStatusBadgeConfig(order.status);
              const isUrgentOrBackordered = order.status === "Backordered" || order.isUrgentDate;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-surface/50 transition-colors duration-150"
                >
                  <td className="py-4 px-6 font-semibold text-brand-600 whitespace-nowrap">
                    <Link
                      href={`/fulfillment/${order.orderNumber}`}
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
                    <Link href={`/fulfillment/${order.orderNumber}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs font-medium px-3.5 py-1.5 border-border hover:bg-surface text-text-primary"
                      >
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default FulfillmentOrdersTable;
