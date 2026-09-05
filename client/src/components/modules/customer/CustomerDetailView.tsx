import React from "react";
import { ChevronLeft, Mail, Calendar, User, Shield, Layers, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CustomerResponseType } from "@/types/customer";
import { useGetDealsQuery } from "@/store/features/deal/dealApi";

export interface CustomerDetailViewProps {
  customer: CustomerResponseType;
  companyId: string;
  onBack: () => void;
  className?: string;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  companyId,
  onBack,
  className,
}) => {
  const { data: dealsData, isLoading: isLoadingDeals } = useGetDealsQuery(
    {
      companyId,
      params: { customerId: customer.id },
    },
    { skip: !companyId || !customer.id }
  );

  const customerDeals = React.useMemo(() => {
    if (!dealsData?.data) return [];
    const raw = dealsData.data;
    if (Array.isArray(raw)) return raw;
    if ("docs" in raw && Array.isArray(raw.docs)) return raw.docs;
    if ("deals" in raw && Array.isArray(raw.deals)) return raw.deals;
    return [];
  }, [dealsData]);

  const totalDealValue = customerDeals.reduce(
    (sum, d) => sum + (Number(d.expectedValue) || 0),
    0
  );

  const formattedTotalValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalDealValue);

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Back to Customer Directory</span>
        </button>
      </div>

      {/* Customer Profile Header Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs p-6">
        <CardContent className="p-0 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl shrink-0">
                {customer.name ? customer.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                    {customer.name}
                  </h2>
                  {customer.customerTier && (
                    <Badge variant="warning">
                      {customer.customerTier} Tier
                    </Badge>
                  )}
                  <Badge variant="purple">
                    {customer.role || "CUSTOMER"}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Registered DealFlow360 Customer Account
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted block">
                  Associated Deals
                </span>
                <span className="text-lg font-bold text-text-primary">
                  {customerDeals.length}
                </span>
              </div>
              <div className="h-8 border-r border-border" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-text-muted block">
                  Pipeline Value
                </span>
                <span className="text-lg font-bold text-brand-600">
                  {formattedTotalValue}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Registration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-text-muted shrink-0" />
              <span>Customer ID: {customer.id.slice(0, 12)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Deals List */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardHeader className="px-6 py-5 border-b border-border bg-card flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <span>Associated Deals ({customerDeals.length})</span>
          </CardTitle>
          <Link href={`/company/${companyId}/app/deals`}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              All Deals
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingDeals ? (
            <div className="p-8 text-center text-xs text-text-muted">
              Loading customer deal pipeline...
            </div>
          ) : customerDeals.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl bg-surface/40">
              <p className="text-sm text-text-secondary">No deals found for this customer.</p>
              <Link href={`/company/${companyId}/app/deals`}>
                <Button variant="outline" size="sm" className="mt-3">
                  Create Deal for {customer.name}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/company/${companyId}/app/deals/${deal.id}`}
                  className="block p-4 rounded-xl bg-surface border border-border hover:border-brand-500 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold text-text-muted">
                      {deal.dealNo}
                    </span>
                    <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                      {deal.stage}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary truncate mb-1">
                    {deal.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-text-secondary mt-3 pt-2 border-t border-border/60">
                    <span>Probability: {deal.probability}%</span>
                    <span className="font-semibold text-brand-600">
                      ${Number(deal.expectedValue).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetailView;
