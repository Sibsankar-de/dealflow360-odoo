import React from "react";
import { QuotationItem } from "@/types/quotation";

export interface QuotationKanbanCardProps {
  quotation: QuotationItem;
  onClick?: (quotation: QuotationItem) => void;
}

export const QuotationKanbanCard: React.FC<QuotationKanbanCardProps> = ({
  quotation,
  onClick,
}) => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: quotation.currency || "USD",
    maximumFractionDigits: 0,
  }).format(quotation.totalAmount);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(quotation)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(quotation);
        }
      }}
      className="w-full p-3.5 rounded-xl bg-card border border-border hover:border-brand-500 hover:shadow-xs transition-all cursor-pointer select-none text-left shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary truncate">
          {quotation.customerName} - {formattedAmount}
        </span>
      </div>
    </div>
  );
};

export default QuotationKanbanCard;
