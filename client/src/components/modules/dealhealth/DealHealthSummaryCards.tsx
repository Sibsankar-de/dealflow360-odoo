import React from "react";
import { Activity, AlertTriangle, AlertCircle, Target } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { DealHealthKPI } from "@/types/dealhealth";

export interface DealHealthSummaryCardsProps {
  kpi: DealHealthKPI;
  className?: string;
}

export const DealHealthSummaryCards: React.FC<DealHealthSummaryCardsProps> = ({
  kpi,
  className,
}) => {
  const cards = [
    {
      id: "stalled",
      title: "Stalled Deals",
      count: kpi.stalledDealsCount,
      subtext: "No activity 7d+",
      textColor: "text-amber-500",
      iconBg: "bg-amber-50 text-amber-600 border-amber-200/60",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: "discount",
      title: "Discount Anomalies",
      count: kpi.discountAnomaliesCount,
      subtext: "Above rep average",
      textColor: "text-red-500",
      iconBg: "bg-red-50 text-red-600 border-red-200/60",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: "delivery",
      title: "Delivery Risks",
      count: kpi.deliveryRisksCount,
      subtext: "Backorder warnings",
      textColor: "text-orange-500",
      iconBg: "bg-orange-50 text-orange-600 border-orange-200/60",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "high_risk",
      title: "High - Risk Approvals",
      count: kpi.highRiskApprovalsCount,
      subtext: "Score 70+",
      textColor: "text-indigo-600",
      iconBg: "bg-purple-50 text-purple-600 border-purple-200/60",
      icon: <Target className="w-4 h-4" />,
    },
  ];

  return (
    <div className={clsx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
      {cards.map((card) => (
        <Card
          key={card.id}
          className="p-6 rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-text-secondary">
              {card.title}
            </span>
            <div className={clsx("p-2 rounded-xl border shrink-0", card.iconBg)}>
              {card.icon}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className={clsx("text-4xl font-bold tracking-tight", card.textColor)}>
              {card.count}
            </span>
            <span className="text-xs text-text-muted font-normal">
              {card.subtext}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DealHealthSummaryCards;
