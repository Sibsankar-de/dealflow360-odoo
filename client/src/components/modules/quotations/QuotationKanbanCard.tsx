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
  const [isDragging, setIsDragging] = React.useState(false);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: quotation.currency || "USD",
    maximumFractionDigits: 0,
  }).format(quotation.totalAmount);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", quotation.id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick?.(quotation)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(quotation);
        }
      }}
      className={`w-full p-3.5 rounded-xl bg-card border border-border hover:border-brand-500 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none text-left shadow-2xs ${
        isDragging ? "opacity-50 scale-95 border-brand-500 ring-2 ring-brand-500/20" : ""
      }`}
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

