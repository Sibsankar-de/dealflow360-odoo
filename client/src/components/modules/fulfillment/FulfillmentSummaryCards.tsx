import React from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { FulfillmentKPI } from "@/types/fulfillment";

export interface FulfillmentSummaryCardsProps {
  kpi: FulfillmentKPI;
  isLoading?: boolean;
  activeFilter?: string;
  onFilterSelect?: (filterId: string) => void;
  className?: string;
}

export const FulfillmentSummaryCards: React.FC<FulfillmentSummaryCardsProps> = ({
  kpi,
  isLoading = false,
  activeFilter,
  onFilterSelect,
  className,
}) => {
  const cards = [
    {
      id: "ready",
      title: "Ready to Fulfill",
      count: kpi.readyToFulfillCount,
      borderColor: "border-l-emerald-500",
      textColor: "text-emerald-600",
      activeBg: "bg-emerald-50/40 border-emerald-300",
    },
    {
      id: "partial",
      title: "Partially Fulfilled",
      count: kpi.partiallyFulfilledCount,
      borderColor: "border-l-amber-500",
      textColor: "text-amber-600",
      activeBg: "bg-amber-50/40 border-amber-300",
    },
    {
      id: "backordered",
      title: "Backordered",
      count: kpi.backorderedCount,
      borderColor: "border-l-red-500",
      textColor: "text-red-600",
      activeBg: "bg-red-50/40 border-red-300",
    },
    {
      id: "completed",
      title: "Completed",
      count: kpi.completedCount,
      borderColor: "border-l-slate-400",
      textColor: "text-slate-700",
      activeBg: "bg-slate-50 border-slate-300",
    },
  ];

  return (
    <div className={clsx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;

        return (
          <Card
            key={card.id}
            onClick={() => onFilterSelect?.(card.id)}
            className={clsx(
              "p-6 rounded-2xl border bg-card shadow-xs transition-all",
              card.borderColor,
              "border-l-4",
              onFilterSelect && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
              isSelected ? card.activeBg : "border-border"
            )}
          >
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="h-9 w-16 bg-surface animate-pulse rounded-lg" />
              ) : (
                <span className={clsx("text-4xl font-bold tracking-tight", card.textColor)}>
                  {card.count}
                </span>
              )}
              <span className="text-xs sm:text-sm font-medium text-text-secondary">
                {card.title}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default FulfillmentSummaryCards;
