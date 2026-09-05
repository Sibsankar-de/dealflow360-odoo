import React from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { FulfillmentKPI } from "@/types/fulfillment";

export interface FulfillmentSummaryCardsProps {
  kpi: FulfillmentKPI;
  className?: string;
}

export const FulfillmentSummaryCards: React.FC<FulfillmentSummaryCardsProps> = ({
  kpi,
  className,
}) => {
  const cards = [
    {
      id: "ready",
      title: "Ready to Fulfill",
      count: kpi.readyToFulfillCount,
      borderColor: "border-l-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      id: "partial",
      title: "Partially Fulfilled",
      count: kpi.partiallyFulfilledCount,
      borderColor: "border-l-amber-500",
      textColor: "text-amber-600",
    },
    {
      id: "backordered",
      title: "Backordered",
      count: kpi.backorderedCount,
      borderColor: "border-l-red-500",
      textColor: "text-red-600",
    },
    {
      id: "completed",
      title: "Completed",
      count: kpi.completedCount,
      borderColor: "border-l-slate-400",
      textColor: "text-slate-700",
    },
  ];

  return (
    <div className={clsx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
      {cards.map((card) => (
        <Card
          key={card.id}
          className={clsx(
            "p-6 rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md",
            card.borderColor,
            "border-l-4"
          )}
        >
          <div className="flex flex-col gap-2">
            <span className={clsx("text-4xl font-bold tracking-tight", card.textColor)}>
              {card.count}
            </span>
            <span className="text-xs sm:text-sm font-medium text-text-secondary">
              {card.title}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FulfillmentSummaryCards;
