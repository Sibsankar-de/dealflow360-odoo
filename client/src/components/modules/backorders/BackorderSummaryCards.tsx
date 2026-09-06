"use client";

import React from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { BackorderSummaryResponse, BackorderStatus } from "@/types/backorder";
import { Clock, Layers, CheckCircle2, AlertTriangle } from "lucide-react";

export interface BackorderSummaryCardsProps {
  summary?: BackorderSummaryResponse;
  isLoading?: boolean;
  activeFilter?: BackorderStatus | "ALL";
  onFilterSelect?: (status: BackorderStatus | "ALL") => void;
  className?: string;
}

export const BackorderSummaryCards: React.FC<BackorderSummaryCardsProps> = ({
  summary,
  isLoading = false,
  activeFilter,
  onFilterSelect,
  className,
}) => {
  const cards = [
    {
      id: "ALL" as const,
      title: "Total Backorders",
      value: summary?.totalCount || 0,
      subtext: `${summary?.remainingQuantity || 0} total units outstanding`,
      icon: <Layers className="w-5 h-5 text-brand-600" />,
      borderColor: "border-l-brand-600",
      textColor: "text-brand-600",
      activeBg: "bg-brand-50/40 border-brand-300",
    },
    {
      id: "PENDING" as const,
      title: "Pending Fulfillment",
      value: summary?.pendingCount || 0,
      subtext: "Awaiting warehouse stock",
      icon: <Clock className="w-5 h-5 text-red-600" />,
      borderColor: "border-l-red-500",
      textColor: "text-red-600",
      activeBg: "bg-red-50/40 border-red-300",
    },
    {
      id: "PARTIALLY_FULFILLED" as const,
      title: "Partially Fulfilled",
      value: summary?.partiallyFulfilledCount || 0,
      subtext: "Multiple shipments in progress",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      borderColor: "border-l-amber-500",
      textColor: "text-amber-600",
      activeBg: "bg-amber-50/40 border-amber-300",
    },
    {
      id: "FULFILLED" as const,
      title: "Completed Backorders",
      value: summary?.fulfilledCount || 0,
      subtext: `${summary?.fulfilledQuantity || 0} units fulfilled`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      borderColor: "border-l-emerald-500",
      textColor: "text-emerald-600",
      activeBg: "bg-emerald-50/40 border-emerald-300",
    },
  ];

  return (
    <div
      className={clsx(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
        className
      )}
    >
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;

        return (
          <Card
            key={card.title}
            onClick={() => onFilterSelect?.(card.id)}
            className={clsx(
              "p-6 rounded-2xl border bg-card shadow-xs transition-all",
              card.borderColor,
              "border-l-4",
              onFilterSelect && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
              isSelected ? card.activeBg : "border-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-semibold text-text-secondary">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-surface/80">{card.icon}</div>
            </div>

            <div className="flex flex-col gap-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-surface animate-pulse rounded-lg" />
              ) : (
                <span
                  className={clsx(
                    "text-3xl sm:text-4xl font-bold tracking-tight",
                    card.textColor
                  )}
                >
                  {card.value}
                </span>
              )}
              <span className="text-xs text-text-muted">{card.subtext}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default BackorderSummaryCards;
