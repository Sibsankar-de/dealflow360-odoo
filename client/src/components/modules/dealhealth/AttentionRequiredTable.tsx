import React from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Activity } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { DealHealthAlert, RiskSeverity, HealthRiskType } from "@/types/dealhealth";

export interface AttentionRequiredTableProps {
  alerts: DealHealthAlert[];
  companyId?: string;
  isLoading?: boolean;
  currentPage?: number;
  totalPage?: number;
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  riskType?: HealthRiskType;
  onRiskTypeChange?: (val: HealthRiskType) => void;
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
  companyId,
  isLoading = false,
  currentPage = 1,
  totalPage = 1,
  onPageChange,
  searchTerm = "",
  onSearchChange,
  riskType = "ALL",
  onRiskTypeChange,
  onActionClick,
  className,
}) => {
  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">
            Attention Required
          </CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Deals that are idle for an extended period or approaching close/expiry within 2 days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium shrink-0 bg-surface px-3 py-1 rounded-full border border-border">
            {alerts.length} deals shown
          </span>
        </div>
      </CardHeader>

      {/* Filter Toolbar */}
      <div className="p-4 border-b border-border bg-surface/20 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search deals by deal #, title, or customer..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={riskType}
            onChange={(val) => onRiskTypeChange?.(val as HealthRiskType)}
            options={[
              { key: "ALL", value: "All At-Risk Deals" },
              { key: "IDLE", value: "Stalled / Idle Deals" },
              { key: "EXPIRING_SOON", value: "Expiring Soon (<= 2d)" },
              { key: "EXPIRED", value: "Overdue / Expired" },
            ]}
          />
        </div>
      </div>

      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
            <p className="text-sm">Evaluating deal health and risk factors...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-semibold text-text-primary">
              All deals healthy
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
              No deals currently meet the idle stall or critical 2-day expiry risk thresholds.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-4">Deal</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Issue Description</th>
                <th className="py-3.5 px-4">Age / Timeline</th>
                <th className="py-3.5 px-4">Sales Rep</th>
                <th className="py-3.5 px-4">Suggested Action</th>
                <th className="py-3.5 px-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {alerts.map((alert) => {
                const severityConfig = getSeverityBadgeConfig(alert.severity);
                const dealUrl = companyId
                  ? `/company/${companyId}/workspace/deals/${alert.dealId || alert.id}`
                  : `/workspace/deals/${alert.dealId || alert.id}`;

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
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link
                        href={dealUrl}
                        className="font-bold text-brand-600 hover:underline"
                      >
                        {alert.referenceNumber || alert.dealNo}
                      </Link>
                      {alert.dealName && (
                        <div className="text-xs text-text-muted truncate max-w-[150px]">
                          {alert.dealName}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-primary whitespace-nowrap max-w-[180px] truncate">
                      {alert.customerName}
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
                      <Link
                        href={dealUrl}
                        title="View deal details"
                        className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer inline-flex items-center"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPage > 1 && (
          <div className="p-4 border-t border-border flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPage={totalPage}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttentionRequiredTable;
