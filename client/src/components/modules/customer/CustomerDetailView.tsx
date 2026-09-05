import React from "react";
import { ChevronLeft, Mail, Phone, Calendar, FileText } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuotationKanbanCard } from "@/components/modules/quotations/QuotationKanbanCard";
import { CustomerItem } from "@/types/customer";
import { QuotationItem } from "@/types/quotation";

export interface CustomerDetailViewProps {
  customer: CustomerItem;
  onBack: () => void;
  onSelectQuotation?: (quotation: QuotationItem) => void;
  className?: string;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  onBack,
  onSelectQuotation,
  className,
}) => {
  const totalQuotationValue = customer.associatedQuotations.reduce(
    (sum, q) => sum + q.totalAmount,
    0
  );

  const formattedTotalValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalQuotationValue);

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Customer Profile Header Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs p-6">
        <CardContent className="p-0 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                  {customer.fullName}
                </h2>
                <Badge variant={customer.status === "Active" ? "success" : "warning"}>
                  {customer.status}
                </Badge>
              </div>
              <p className="text-sm font-medium text-text-secondary mt-1">
                {customer.organization || "Independent Account"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted block">
                  Quotations
                </span>
                <span className="text-lg font-bold text-text-primary">
                  {customer.associatedQuotations.length}
                </span>
              </div>
              <div className="h-8 border-r border-border" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted block">
                  Total Value
                </span>
                <span className="text-lg font-bold text-brand-600">
                  {formattedTotalValue}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <span>{customer.phone || "No phone provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span>Joined: {customer.createdAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Quotations Section using QuotationKanbanCard */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardHeader className="px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <span>Associated Quotations ({customer.associatedQuotations.length})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {customer.associatedQuotations.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl bg-surface/40">
              <p className="text-sm text-text-secondary">No quotations issued for this customer yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.associatedQuotations.map((quotation) => (
                <QuotationKanbanCard
                  key={quotation.id}
                  quotation={quotation}
                  onClick={onSelectQuotation}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetailView;
