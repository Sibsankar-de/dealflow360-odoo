import React from "react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FulfillmentOrderItem } from "@/types/fulfillment";

export interface FulfillmentOrderItemsTableProps {
  items: FulfillmentOrderItem[];
  className?: string;
}

export const FulfillmentOrderItemsTable: React.FC<FulfillmentOrderItemsTableProps> = ({
  items,
  className,
}) => {
  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card">
        <CardTitle className="text-lg font-bold text-text-primary">Order Items</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Product</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Required Qty</th>
              <th className="py-3.5 px-6">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-surface/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-text-primary whitespace-nowrap">
                  {item.productName}
                </td>
                <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                  {item.productType}
                </td>
                <td className="py-4 px-4 text-text-primary whitespace-nowrap font-medium">
                  {item.requiredQty}
                </td>
                <td className="py-4 px-6 text-text-secondary whitespace-nowrap">
                  {item.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default FulfillmentOrderItemsTable;
