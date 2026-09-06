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
import { useListCustomerSubscriptionsQuery } from "@/store/features/subscription/subscriptionApi";
import {
  SubscriptionHistoryModal,
  RenewSubscriptionModal,
  CancelSubscriptionModal,
} from "@/components/modules/subscriptions";
import {
  CreditCard,
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  Search,
  History,
  Package,
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

export default function CustomerSubscriptionsPage() {
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

  const { data: subsData, isLoading } = useListCustomerSubscriptionsQuery({
    companyId: companyId || undefined,
    params: {
      search: search.trim() || undefined,
      status: activeFilter !== "ALL" ? activeFilter : undefined,
      page,
      limit: 9,
    },
  });

  const subscriptions = subsData?.data?.docs || [];
  const totalPages = subsData?.data?.totalPages || 1;

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

  // KPIs
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const totalMRR = subscriptions.reduce((sum, s) => {
    if (s.status !== "ACTIVE") return sum;
    if (s.subscriptionType === "MONTHLY") return sum + s.totalRecurringAmount;
    if (s.subscriptionType === "QUARTERLY")
      return sum + s.totalRecurringAmount / 3;
    if (s.subscriptionType === "YEARLY")
      return sum + s.totalRecurringAmount / 12;
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              My Subscriptions & SLAs
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            View active contracts, renew recurring services, and track renewal dates.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-brand-600 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Active Recurring Plans
            </span>
            <div className="p-2 rounded-xl bg-surface/80 text-brand-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-600">
              {activeCount} Active
            </span>
            <span className="text-xs text-text-muted">
              {subscriptions.length} total contracts under your account
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-purple-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Monthly SLA Commitment
            </span>
            <div className="p-2 rounded-xl bg-surface/80 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600">
              {formatCurrency(totalMRR)}/mo
            </span>
            <span className="text-xs text-text-muted">
              Normalized monthly recurring spend
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Coverage Status
            </span>
            <div className="p-2 rounded-xl bg-surface/80 text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600">
              {activeCount > 0 ? "Active Coverage" : "No Active Plans"}
            </span>
            <span className="text-xs text-text-muted">
              Service telemetry and warranty enabled
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "ALL", label: "All Plans" },
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

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search subscriptions by number..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted shadow-xs"
          />
        </div>
      </div>

      {/* Subscription Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-text-muted space-y-2">
          <Clock className="w-8 h-8 animate-spin mx-auto text-brand-600 opacity-60" />
          <p className="text-sm">Loading your subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <CreditCard className="w-10 h-10 text-text-muted opacity-40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary">
            No subscriptions found
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            When you accept and complete quotations with recurring products, your active subscription plans will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const badge = getStatusBadge(sub.status);
            const items = sub.items || [];

            return (
              <Card
                key={sub.id}
                className="rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow"
              >
                <div>
                  <CardHeader className="p-6 pb-4 border-b border-border/50 bg-surface/30">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-bold text-brand-600 tracking-wider uppercase bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                        {sub.subscriptionNo}
                      </span>
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
                    </div>
                    <CardTitle className="text-base font-bold text-text-primary mt-2.5 leading-snug">
                      {items[0]?.productName || "Recurring Subscription Plan"}
                    </CardTitle>
                    {sub.quotationNo && (
                      <p className="text-xs text-text-muted mt-1 truncate">
                        Linked Quote: <span className="font-mono text-text-secondary">{sub.quotationNo}</span>
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    {/* Pricing Display */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                        {formatCurrency(
                          sub.totalRecurringAmount,
                          sub.currency
                        )}
                      </span>
                      <span className="text-xs font-semibold text-text-muted">
                        / {sub.subscriptionType.toLowerCase()}
                      </span>
                    </div>

                    {/* Dates Card */}
                    <div className="p-3 bg-surface rounded-xl border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Started:</span>
                        <span className="font-semibold text-text-primary">
                          {formatDate(sub.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Next Renewal Date:</span>
                        <span className="font-semibold text-brand-600">
                          {formatDate(sub.nextRenewalDate)}
                        </span>
                      </div>
                    </div>

                    {/* Included Products List */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Subscribed Products:
                      </span>
                      <ul className="space-y-1.5 text-xs text-text-primary">
                        {items.map((it, idx) => (
                          <li key={idx} className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                              <span>{it.productName || "Product"}</span>
                              <span className="text-text-muted">× {it.quantity}</span>
                            </div>
                            <span className="font-semibold text-text-secondary">
                              {formatCurrency(it.lineTotal, sub.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 px-6 border-t border-border bg-surface/20 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistorySub(sub)}
                    className="text-xs"
                    leftIcon={<History className="w-3.5 h-3.5" />}
                  >
                    History
                  </Button>

                  <div className="flex items-center gap-2">
                    {sub.status !== "CANCELLED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setRenewSub(sub)}
                        className="text-xs"
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Renew
                      </Button>
                    )}

                    {sub.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelSub(sub)}
                        className="text-xs text-danger hover:bg-red-50 hover:border-red-200"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
        isCustomerPortal={true}
      />

      <CancelSubscriptionModal
        isOpen={Boolean(cancelSub)}
        onClose={() => setCancelSub(null)}
        companyId={companyId}
        subscription={cancelSub}
        isCustomerPortal={true}
      />
    </div>
  );
}
