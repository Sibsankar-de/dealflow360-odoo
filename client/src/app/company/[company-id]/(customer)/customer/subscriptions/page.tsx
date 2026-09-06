"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import {
  CreditCard,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  Zap,
  Shield,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  planCode: string;
  dealRef: string;
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  amount: number;
  currency: string;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED";
  nextBillingDate: string;
  startDate: string;
  features: string[];
  autoRenew: boolean;
}

const MOCK_SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "sub-001",
    name: "Enterprise Machinery Maintenance & Telemetry SLA",
    planCode: "SLA-GOLD-2026",
    dealRef: "Enterprise Machinery & Hardware Procurement",
    billingCycle: "MONTHLY",
    amount: 1200.0,
    currency: "USD",
    status: "ACTIVE",
    nextBillingDate: "2026-04-01",
    startDate: "2026-01-01",
    features: [
      "24/7 Priority Emergency Dispatch & Repair",
      "IoT Sensor Health Monitoring & Predictive Alerts",
      "Quarterly On-site Hardware Calibration",
      "Unlimited Replacement Fasteners & Wear-Parts",
    ],
    autoRenew: true,
  },
  {
    id: "sub-002",
    name: "Automated Conveyor Fleet Software License",
    planCode: "SW-CONVEYOR-PRO",
    dealRef: "Automated Conveyor Belt System Expansion",
    billingCycle: "ANNUAL",
    amount: 4800.0,
    currency: "USD",
    status: "ACTIVE",
    nextBillingDate: "2027-02-15",
    startDate: "2026-02-15",
    features: [
      "Cloud Fleet Synchronization & Speed Optimization",
      "Role-Based Access for 50 Factory Operators",
      "Automated Throughput & Anomaly Diagnostics",
      "Direct API Integration into ERP Systems",
    ],
    autoRenew: true,
  },
  {
    id: "sub-003",
    name: "Standard Tooling Calibration Support Tier",
    planCode: "SLA-CALIB-BRONZE",
    dealRef: "Q1 Raw Materials & Steel Alloy Supply",
    billingCycle: "QUARTERLY",
    amount: 750.0,
    currency: "USD",
    status: "TRIALING",
    nextBillingDate: "2026-03-25",
    startDate: "2026-02-25",
    features: [
      "Business Hours Remote Diagnostics",
      "Monthly Calibration Report Export",
      "10% Discount on Spare Machine Parts",
    ],
    autoRenew: false,
  },
];

const getStatusBadge = (
  status: SubscriptionPlan["status"]
): { variant: BadgeVariant; label: string; dotClass: string } => {
  switch (status) {
    case "ACTIVE":
      return { variant: "success", label: "Active", dotClass: "bg-emerald-500" };
    case "TRIALING":
      return {
        variant: "purple",
        label: "Trial Period",
        dotClass: "bg-purple-500",
      };
    case "PAST_DUE":
      return {
        variant: "danger",
        label: "Past Due",
        dotClass: "bg-red-500",
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

  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState<SubscriptionPlan | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [subscriptions, setSubscriptions] =
    useState<SubscriptionPlan[]>(MOCK_SUBSCRIPTIONS);

  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const filteredSubs = subscriptions.filter((sub) => {
    return (
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.planCode.toLowerCase().includes(search.toLowerCase()) ||
      sub.dealRef.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const totalMRR = subscriptions.reduce((sum, s) => {
    if (s.status !== "ACTIVE") return sum;
    if (s.billingCycle === "MONTHLY") return sum + s.amount;
    if (s.billingCycle === "QUARTERLY") return sum + s.amount / 3;
    if (s.billingCycle === "ANNUAL") return sum + s.amount / 12;
    return sum;
  }, 0);

  const handleToggleAutoRenew = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          const nextVal = !s.autoRenew;
          toast.success(
            nextVal
              ? `Auto-renewal enabled for ${s.planCode}.`
              : `Auto-renewal disabled for ${s.planCode}.`
          );
          return { ...s, autoRenew: nextVal };
        }
        return s;
      })
    );
  };

  const handleCancelSubscription = () => {
    if (!selectedSub) return;
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === selectedSub.id ? { ...s, status: "CANCELLED", autoRenew: false } : s
      )
    );
    setIsCancelModalOpen(false);
    setSelectedSub(null);
    toast.success(`Subscription ${selectedSub.planCode} has been cancelled.`);
  };

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
              Subscriptions & SLA Plans
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Monitor recurring equipment maintenance SLAs, enterprise software licenses, and automated renewals.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-brand-600 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Active Plans
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
              Across all delivered hardware fleets
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
              100% Protected
            </span>
            <span className="text-xs text-text-muted">
              Telemetry active on all production lines
            </span>
          </div>
        </Card>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions or plans..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted shadow-xs"
          />
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubs.map((sub) => {
          const badge = getStatusBadge(sub.status);

          return (
            <Card
              key={sub.id}
              className="rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow"
            >
              <div>
                <CardHeader className="p-6 pb-4 border-b border-border/50 bg-surface/30">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold text-brand-600 tracking-wider uppercase bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                      {sub.planCode}
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
                    {sub.name}
                  </CardTitle>
                  <p className="text-xs text-text-muted mt-1 truncate">
                    Linked to {sub.dealRef}
                  </p>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                      {formatCurrency(sub.amount, sub.currency)}
                    </span>
                    <span className="text-xs font-semibold text-text-muted">
                      / {sub.billingCycle.toLowerCase()}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="p-3 bg-surface rounded-xl border border-border/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-text-secondary">
                      <span>Renewal Date:</span>
                      <span className="font-semibold text-text-primary">
                        {sub.nextBillingDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span>Auto-Renewal:</span>
                      <span
                        className={`font-semibold ${
                          sub.autoRenew ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {sub.autoRenew ? "Enabled" : "Manual Renewal"}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-text-secondary block">
                      Included SLA Coverage:
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-primary">
                      {sub.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
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
                  onClick={() => handleToggleAutoRenew(sub.id)}
                  className="text-xs"
                >
                  {sub.autoRenew ? "Disable Auto-Renew" : "Enable Auto-Renew"}
                </Button>
                {sub.status === "ACTIVE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSub(sub);
                      setIsCancelModalOpen(true);
                    }}
                    className="text-xs text-danger hover:bg-red-50 hover:border-red-200"
                  >
                    Cancel Plan
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && selectedSub && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Subscription"
          description={`Are you sure you want to cancel ${selectedSub.name}?`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-danger flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Telemetry SLA Warning</span>
                <span>
                  Cancelling this service will terminate real-time emergency dispatch and predictive calibration coverage at the end of the current billing cycle.
                </span>
              </div>
            </div>

            <ModalFooter className="px-0 pb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent"
                onClick={handleCancelSubscription}
              >
                Confirm Cancellation
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
