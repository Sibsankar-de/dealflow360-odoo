import React, { useState } from "react";
import { QuotationItem, QuotationStatus } from "@/types/quotation";
import { QuotationKanbanCard } from "./QuotationKanbanCard";

export interface QuotationKanbanColumnProps {
  status: QuotationStatus;
  quotations: QuotationItem[];
  onSelectQuotation?: (quotation: QuotationItem) => void;
  onUpdateQuotationStatus?: (id: string, status: QuotationStatus) => void;
}

export const QuotationKanbanColumn: React.FC<QuotationKanbanColumnProps> = ({
  status,
  quotations,
  onSelectQuotation,
  onUpdateQuotationStatus,
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isOver) {
      setIsOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only remove highlight if dragging leaves the column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const quotationId = e.dataTransfer.getData("text/plain");
    if (quotationId && onUpdateQuotationStatus) {
      onUpdateQuotationStatus(quotationId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[220px] flex-1 rounded-2xl p-4 min-h-[420px] transition-all duration-150 ${
        isOver
          ? "bg-brand-50/50 border-2 border-dashed border-brand-500 shadow-md"
          : "bg-surface border border-border/80 shadow-2xs"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">{status}</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-card border border-border text-text-secondary">
          {quotations.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {quotations.map((item) => (
          <QuotationKanbanCard
            key={item.id}
            quotation={item}
            onClick={onSelectQuotation}
          />
        ))}

        {quotations.length === 0 && (
          <div
            className={`h-28 flex items-center justify-center border border-dashed rounded-xl transition-colors ${
              isOver ? "border-brand-400 bg-brand-50/30" : "border-border"
            }`}
          >
            <span className="text-xs text-text-muted">
              {isOver ? "Drop quotation here" : "No quotations"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationKanbanColumn;

