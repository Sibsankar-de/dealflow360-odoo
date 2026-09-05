import React from "react";
import { QuotationItem, QuotationStatus } from "@/types/quotation";
import { Select, SelectOptionType } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";

export interface QuotationTableProps {
  quotations: QuotationItem[];
  onSelectQuotation?: (quotation: QuotationItem) => void;
  onUpdateQuotationStatus?: (id: string, status: QuotationStatus) => void;
}

const STATUS_OPTIONS: SelectOptionType[] = [
  { key: "Draft", value: "Draft" },
  { key: "Pending Approval", value: "Pending Approval" },
  { key: "Approved", value: "Approved" },
  { key: "Negotiation", value: "Negotiation" },
  { key: "Confirmed", value: "Confirmed" },
];

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  onSelectQuotation,
  onUpdateQuotationStatus,
}) => {
  const formatAmount = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (quotations.length === 0) {
    return (
      <div className="p-12 border border-border rounded-2xl bg-card text-center">
        <p className="text-sm text-text-secondary">No quotations found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <th className="py-3.5 px-4">Quotation #</th>
            <th className="py-3.5 px-4">Customer</th>
            <th className="py-3.5 px-4">Amount</th>
            <th className="py-3.5 px-4">Created Date</th>
            <th className="py-3.5 px-4 min-w-[200px]">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {quotations.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-surface/50 transition-colors"
            >
              <td className="py-3.5 px-4 font-semibold text-text-primary">
                {item.quotationNumber}
              </td>
              <td className="py-3.5 px-4 font-medium text-text-primary">
                {item.customerName}
              </td>
              <td className="py-3.5 px-4 font-semibold text-text-primary">
                {formatAmount(item.totalAmount, item.currency)}
              </td>
              <td className="py-3.5 px-4 text-text-secondary text-xs">
                {item.createdAt}
              </td>
              <td className="py-3.5 px-4">
                <div className="w-44">
                  <Select
                    value={item.status}
                    options={STATUS_OPTIONS}
                    onChange={(newStatus) => {
                      if (onUpdateQuotationStatus && newStatus) {
                        onUpdateQuotationStatus(
                          item.id,
                          newStatus as QuotationStatus
                        );
                      }
                    }}
                  />
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectQuotation?.(item)}
                  rightIcon={<ExternalLink className="w-3.5 h-3.5 text-text-muted" />}
                  className="text-xs text-text-primary hover:text-brand-600"
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuotationTable;
