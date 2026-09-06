"use client";

import React from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { InvoiceSummaryResponse, InvoiceStatus } from "@/types/invoice";
import { DollarSign, CheckCircle2, Clock, FileText } from "lucide-react";

export interface InvoiceSummaryCardsProps {
  summary?: InvoiceSummaryResponse;
  isLoading?: boolean;
  activeFilter?: InvoiceStatus | "ALL";
  onFilterSelect?: (status: InvoiceStatus | "ALL") => void;
  className?: string;
}

export const InvoiceSummaryCards: React.FC<InvoiceSummaryCardsProps> = ({
  summary,
  isLoading = false,
  activeFilter,
  onFilterSelect,
  className,
}) => {
  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      id: "ALL" as const,
      title: "Total Invoiced",
      amount: formatCurrency(summary?.totalAmount),
      count: `${summary?.totalCount || 0} total invoices`,
      icon: <DollarSign className="w-5 h-5 text-brand-600" />,
      borderColor: "border-l-brand-600",
      textColor: "text-brand-600",
      activeBg: "bg-brand-50/40 border-brand-300",
    },
    {
      id: "PAID" as const,
      title: "Paid Invoices",
      amount: formatCurrency(summary?.paidAmount),
      count: `${summary?.paidCount || 0} fully paid`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      borderColor: "border-l-emerald-500",
      textColor: "text-emerald-600",
      activeBg: "bg-emerald-50/40 border-emerald-300",
    },
    {
      id: "PARTIALLY_PAID" as const,
      title: "Partially Paid",
      amount: formatCurrency(
        (summary?.totalAmount || 0) - (summary?.paidAmount || 0) - (summary?.remainingAmount || 0) > 0
          ? (summary?.totalAmount || 0) - (summary?.paidAmount || 0)
          : summary?.remainingAmount
      ),
      count: `${summary?.partiallyPaidCount || 0} awaiting full balance`,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      borderColor: "border-l-amber-500",
      textColor: "text-amber-600",
      activeBg: "bg-amber-50/40 border-amber-300",
    },
    {
      id: "POSTED" as const,
      title: "Outstanding / Open",
      amount: formatCurrency(summary?.remainingAmount),
      count: `${summary?.postedCount || 0} unpaid posted`,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      borderColor: "border-l-blue-500",
      textColor: "text-blue-600",
      activeBg: "bg-blue-50/40 border-blue-300",
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
                <div className="h-8 w-28 bg-surface animate-pulse rounded-lg" />
              ) : (
                <span
                  className={clsx(
                    "text-2xl sm:text-3xl font-bold tracking-tight",
                    card.textColor
                  )}
                >
                  {card.amount}
                </span>
              )}
              <span className="text-xs text-text-muted">{card.count}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default InvoiceSummaryCards;
