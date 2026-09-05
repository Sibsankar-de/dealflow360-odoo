import React from "react";
import { QuotationItem, QuotationStatus } from "@/types/quotation";
import { QuotationKanbanCard } from "./QuotationKanbanCard";

export interface QuotationKanbanColumnProps {
  status: QuotationStatus;
  quotations: QuotationItem[];
  onSelectQuotation?: (quotation: QuotationItem) => void;
}

export const QuotationKanbanColumn: React.FC<QuotationKanbanColumnProps> = ({
  status,
  quotations,
  onSelectQuotation,
}) => {
  return (
    <div className="flex flex-col min-w-[220px] flex-1 rounded-2xl bg-surface border border-border/80 p-4 min-h-[420px] shadow-2xs">
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
          <div className="h-28 flex items-center justify-center border border-dashed border-border rounded-xl">
            <span className="text-xs text-text-muted">No quotations</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationKanbanColumn;
