"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import {
  SubscriptionResponseType,
  SubscriptionStatus,
} from "@/types/subscription";
import {
  useListSubscriptionsQuery,
  useGetSubscriptionSummaryQuery,
} from "@/store/features/subscription/subscriptionApi";
import {
  SubscriptionHistoryModal,
  RenewSubscriptionModal,
  CancelSubscriptionModal,
} from "@/components/modules/subscriptions";
import {
  CreditCard,
  Sparkles,
  RefreshCw,
  Clock,
  Zap,
  Search,
  History,
  Package,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const getStatusBadge = (
  status: SubscriptionStatus
): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "ACTIVE":
      return { variant: "success", label: "Active", dotClass: "bg-emerald-500" };
    case "EXPIRED":
      return {
        variant: "warning",
        label: "Expired",
        dotClass: "bg-amber-500",
      };
    case "CANCELLED":
      return {
        variant: "secondary",
        label: "Cancelled",
        dotClass: "bg-slate-400",
      };
    default:
      return {
        variant: "secondary",
        label: status,
        dotClass: "bg-slate-400",
      };
  }
};

export default function WorkspaceSubscriptionsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<SubscriptionStatus | "ALL">(
    "ALL"
  );

  // Modals state
  const [historySub, setHistorySub] = useState<SubscriptionResponseType | null>(
    null
  );
  const [renewSub, setRenewSub] = useState<SubscriptionResponseType | null>(
    null
  );
  const [cancelSub, setCancelSub] = useState<SubscriptionResponseType | null>(
    null
  );

  const { data: subsData, isLoading: isLoadingSubs } =
    useListSubscriptionsQuery(
      {
        companyId,
        params: {
          search: search.trim() || undefined,
          status: activeFilter !== "ALL" ? activeFilter : undefined,
          page,
          limit: 10,
        },
      },
      { skip: !companyId }
    );

  const { data: summaryData } = useGetSubscriptionSummaryQuery(
    { companyId },
    { skip: !companyId }
  );

  const subscriptions = subsData?.data?.docs || [];
  const totalPages = subsData?.data?.totalPages || 1;
  const summary = summaryData?.data;

  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Subscriptions & Recurring Contracts
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Track customer recurring subscriptions, billing cycles, renewals, and applied pricing history.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 rounded-2xl border border-border bg-card border-l-4 border-l-brand-600 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-text-secondary">
              Active Subscriptions
            </span>
            <div className="p-1.5 rounded-lg bg-surface text-brand-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-brand-600">
              {summary?.activeCount ?? 0}
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {summary?.totalCount ?? 0} total lifetime contracts
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-border bg-card border-l-4 border-l-purple-500 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-text-secondary">
              Monthly Recurring (MRR)
            </span>
            <div className="p-1.5 rounded-lg bg-surface text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-purple-600">
              {formatCurrency(summary?.totalMonthlyRecurringRevenue ?? 0)}/mo
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              Normalized recurring revenue
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-border bg-card border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-text-secondary">
              Annual Recurring (ARR)
            </span>
            <div className="p-1.5 rounded-lg bg-surface text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(summary?.totalAnnualRecurringRevenue ?? 0)}/yr
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              Projected annual SLA volume
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-border bg-card border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-text-secondary">
              Expired / Cancelled
            </span>
            <div className="p-1.5 rounded-lg bg-surface text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-amber-600">
              {summary?.expiredCount ?? 0} Expired
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {summary?.cancelledCount ?? 0} cancelled contracts
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "ALL", label: "All Subscriptions" },
              { id: "ACTIVE", label: "Active" },
              { id: "EXPIRED", label: "Expired" },
              { id: "CANCELLED", label: "Cancelled" },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-brand-600 text-white font-semibold shadow-xs"
                    : "bg-card text-text-secondary border border-border hover:bg-surface hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search subscription # or customer..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-border bg-card">
          <CardTitle className="text-lg font-bold text-text-primary">
            Subscriptions Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/40">
                <th className="py-3.5 px-6">Subscription #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Quotation Ref</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4 text-right">Recurring Amount</th>
                <th className="py-3.5 px-4">Next Renewal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingSubs ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-brand-600 opacity-60" />
                    <p className="text-xs">Loading subscriptions...</p>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary">
                    <CreditCard className="w-8 h-8 text-text-muted opacity-60 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-text-primary">
                      No subscriptions found
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Recurring subscriptions are automatically created when quotations with recurring products are fulfilled.
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const badge = getStatusBadge(sub.status);
                  const firstItem = sub.items?.[0];

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-text-primary">
                          {sub.subscriptionNo}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                          <Package className="w-3.5 h-3.5 text-brand-600" />
                          <span>
                            {firstItem?.productName || "Recurring Product"}
                            {(sub.items?.length || 0) > 1 &&
                              ` + ${(sub.items?.length || 0) - 1} more`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-text-primary whitespace-nowrap">
                        <div>{sub.customerName || "Customer"}</div>
                        {sub.customerEmail && (
                          <div className="text-xs text-text-muted">
                            {sub.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                        {sub.quotationNo ? (
                          <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">
                            {sub.quotationNo}
                          </span>
                        ) : sub.orderNo ? (
                          <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">
                            {sub.orderNo}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-text-secondary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {sub.subscriptionType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(
                          sub.totalRecurringAmount,
                          sub.currency
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{formatDate(sub.nextRenewalDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge
                          variant={badge.variant}
                          icon={
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dotClass}`}
                            />
                          }
                        >
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Period History"
                            onClick={() => setHistorySub(sub)}
                            className="p-1.5 h-8 w-8 text-text-secondary hover:text-brand-600"
                          >
                            <History className="w-4 h-4" />
                          </Button>

                          {sub.status !== "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Renew Subscription"
                              onClick={() => setRenewSub(sub)}
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Renew
                            </Button>
                          )}

                          {sub.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Cancel Subscription"
                              onClick={() => setCancelSub(sub)}
                              className="text-xs text-danger hover:bg-red-50 hover:border-red-200"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPage={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Subscription Modals */}
      <SubscriptionHistoryModal
        isOpen={Boolean(historySub)}
        onClose={() => setHistorySub(null)}
        companyId={companyId}
        subscription={historySub}
      />

      <RenewSubscriptionModal
        isOpen={Boolean(renewSub)}
        onClose={() => setRenewSub(null)}
        companyId={companyId}
        subscription={renewSub}
        isCustomerPortal={false}
      />

      <CancelSubscriptionModal
        isOpen={Boolean(cancelSub)}
        onClose={() => setCancelSub(null)}
        companyId={companyId}
        subscription={cancelSub}
        isCustomerPortal={false}
      />
    </main>
  );
}
