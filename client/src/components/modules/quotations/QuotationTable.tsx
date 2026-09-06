import React from "react";
import Link from "next/link";
import { QuotationResponse, QuotationStatus } from "@/types/quotation";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExternalLink, FileText } from "lucide-react";

export interface QuotationTableProps {
  quotations: QuotationResponse[];
  companyId?: string;
  onSelectQuotation?: (quotation: QuotationResponse) => void;
}

const STATUS_BADGES: Record<string, BadgeVariant> = {
  DRAFT: "secondary",
  Draft: "secondary",
  SENT: "primary",
  NEGOTIATING: "warning",
  Negotiation: "warning",
  ACCEPTED: "success",
  Confirmed: "success",
  Approved: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  EXPIRED: "outline",
};

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  companyId,
  onSelectQuotation,
}) => {
  const formatAmount = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (quotations.length === 0) {
    return (
      <div className="p-12 border border-border rounded-2xl bg-card text-center">
        <FileText className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
        <p className="text-sm text-text-secondary font-medium">No quotations found.</p>
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
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {quotations.map((item) => {
            const customerName =
              item.customer?.userName ||
              (item as unknown as { customerName?: string }).customerName ||
              "Customer";
            const quoteNo =
              item.quotationNo ||
              (item as unknown as { quotationNumber?: string }).quotationNumber ||
              item.id;
            const total = Number(item.currentRevision?.totalAmount ?? item.totalAmount ?? 0);
            const detailUrl = companyId && item.dealId
              ? `/company/${companyId}/workspace/deals/${item.dealId}/quotations/${item.id}`
              : undefined;

            return (
              <tr
                key={item.id}
                className="hover:bg-surface/50 transition-colors"
              >
                <td className="py-3.5 px-4 font-semibold text-text-primary">
                  {detailUrl ? (
                    <Link
                      href={detailUrl}
                      className="hover:text-brand-600 transition-colors"
                    >
                      {quoteNo}
                    </Link>
                  ) : (
                    quoteNo
                  )}
                </td>
                <td className="py-3.5 px-4 font-medium text-text-primary">
                  <div>
                    <span>{customerName}</span>
                    {item.customer?.email && (
                      <span className="text-xs text-text-muted block">
                        {item.customer.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-text-primary">
                  {formatAmount(total, item.currency)}
                </td>
                <td className="py-3.5 px-4 text-text-secondary text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={STATUS_BADGES[item.status] || "secondary"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {detailUrl ? (
                    <Link href={detailUrl}>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5 text-text-muted" />}
                        className="text-xs text-text-primary hover:text-brand-600"
                      >
                        View
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectQuotation?.(item)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5 text-text-muted" />}
                      className="text-xs text-text-primary hover:text-brand-600"
                    >
                      View
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QuotationTable;
