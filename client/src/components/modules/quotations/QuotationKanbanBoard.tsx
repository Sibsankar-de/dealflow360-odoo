import React from "react";
import { QuotationItem, QuotationStatus } from "@/types/quotation";
import { QuotationKanbanColumn } from "./QuotationKanbanColumn";

export interface QuotationKanbanBoardProps {
  quotations: QuotationItem[];
  onSelectQuotation?: (quotation: QuotationItem) => void;
}

const KANBAN_COLUMNS: QuotationStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Negotiation",
  "Confirmed",
];

export const QuotationKanbanBoard: React.FC<QuotationKanbanBoardProps> = ({
  quotations,
  onSelectQuotation,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnQuotations = quotations.filter((q) => q.status === status);
        return (
          <QuotationKanbanColumn
            key={status}
            status={status}
            quotations={columnQuotations}
            onSelectQuotation={onSelectQuotation}
          />
        );
      })}
    </div>
  );
};

export default QuotationKanbanBoard;
