import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { DealHealthAlert, RiskSeverity } from "@/types/dealhealth";

export interface AttentionRequiredTableProps {
  alerts: DealHealthAlert[];
  onActionClick?: (alert: DealHealthAlert) => void;
  className?: string;
}

const getSeverityBadgeConfig = (severity: RiskSeverity): { variant: BadgeVariant } => {
  switch (severity) {
    case "HIGH":
      return { variant: "danger" };
    case "MEDIUM":
      return { variant: "warning" };
    case "LOW":
      return { variant: "success" };
    default:
      return { variant: "secondary" };
  }
};

export const AttentionRequiredTable: React.FC<AttentionRequiredTableProps> = ({
  alerts,
  onActionClick,
  className,
}) => {
  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">
            Attention Required
          </CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Deals with active risk factors, ranked by severity
          </p>
        </div>
        <span className="text-xs text-text-muted font-medium shrink-0">
          {alerts.length} alerts
        </span>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Severity</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Quote/Order</th>
              <th className="py-3.5 px-4">Issue</th>
              <th className="py-3.5 px-4">Age</th>
              <th className="py-3.5 px-4">Owner</th>
              <th className="py-3.5 px-4">Suggested Action</th>
              <th className="py-3.5 px-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {alerts.map((alert) => {
              const severityConfig = getSeverityBadgeConfig(alert.severity);

              return (
                <tr
                  key={alert.id}
                  className="hover:bg-surface/50 transition-colors duration-150"
                >
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge
                      variant={severityConfig.variant}
                      className="px-3 py-0.5 rounded-full font-bold text-[10px] tracking-wide"
                    >
                      {alert.severity}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-bold text-text-primary whitespace-nowrap max-w-[180px] truncate">
                    {alert.customerName}
                  </td>
                  <td className="py-4 px-4 font-semibold text-brand-600 whitespace-nowrap">
                    <Link
                      href={
                        alert.referenceType === "Order"
                          ? `/fulfillment/${alert.referenceNumber}`
                          : `/quotations`
                      }
                      className="hover:underline transition-colors"
                    >
                      {alert.referenceNumber}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-text-secondary max-w-[320px]">
                    {alert.issueDescription}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full bg-surface border border-border text-xs text-text-secondary font-medium inline-block">
                      {alert.ageDays}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-text-secondary whitespace-nowrap font-medium max-w-[140px] truncate">
                    {alert.ownerName}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActionClick?.(alert)}
                      className="rounded-lg text-xs font-semibold px-3.5 py-1.5 border-border hover:bg-surface text-text-primary"
                    >
                      {alert.suggestedAction}
                    </Button>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onActionClick?.(alert)}
                      title="View deal details"
                      className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer inline-flex items-center"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
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

export default AttentionRequiredTable;
