import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { FulfillmentOrderDetail, FulfillmentStatus } from "@/types/fulfillment";

export interface FulfillmentDetailHeaderProps {
  order: FulfillmentOrderDetail;
  companyId?: string;
  className?: string;
}

const getStatusConfig = (status: FulfillmentStatus): { variant: BadgeVariant; dotClass: string } => {
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

export const FulfillmentDetailHeader: React.FC<FulfillmentDetailHeaderProps> = ({
  order,
  companyId,
  className,
}) => {
  const statusConfig = getStatusConfig(order.status);
  const backHref = companyId ? `/company/${companyId}/workspace/fulfillment` : "/fulfillment";

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Back to Fulfillment Link */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors select-none"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Fulfillment</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs p-6">
        <CardContent className="p-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {order.orderNumber}
            </h1>
            <Badge
              variant={statusConfig.variant}
              icon={<span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", statusConfig.dotClass)} />}
            >
              {order.status}
            </Badge>
          </div>

          <p className="text-sm font-medium text-text-secondary">
            {order.customerName} <span className="text-text-muted font-normal">· From {order.quotationRef}</span>
          </p>

          <p className="text-xs text-text-muted">
            Required by: {order.requiredBy}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FulfillmentDetailHeader;
