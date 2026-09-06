"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  Search,
  Plus,
  Users,
  Building2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

interface WorkspaceSubscription {
  id: string;
  name: string;
  planCode: string;
  customerName: string;
  dealRef: string;
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  amount: number;
  currency: string;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED";
  nextBillingDate: string;
  startDate: string;
  autoRenew: boolean;
}

const MOCK_WORKSPACE_SUBSCRIPTIONS: WorkspaceSubscription[] = [
  {
    id: "sub-101",
    name: "Enterprise Machinery Maintenance & Telemetry SLA",
    planCode: "SLA-GOLD-2026",
    customerName: "Global Manufacturing Corp",
    dealRef: "Enterprise Machinery & Hardware Procurement",
    billingCycle: "MONTHLY",
    amount: 1200.0,
    currency: "USD",
    status: "ACTIVE",
    nextBillingDate: "2026-04-01",
    startDate: "2026-01-01",
    autoRenew: true,
  },
  {
    id: "sub-102",
    name: "Automated Conveyor Fleet Software License",
    planCode: "SW-CONVEYOR-PRO",
    customerName: "Apex Logistics & Fulfillment",
    dealRef: "Automated Conveyor Belt System Expansion",
    billingCycle: "ANNUAL",
    amount: 4800.0,
    currency: "USD",
    status: "ACTIVE",
    nextBillingDate: "2027-02-15",
    startDate: "2026-02-15",
    autoRenew: true,
  },
  {
    id: "sub-103",
    name: "Standard Tooling Calibration Support Tier",
    planCode: "SLA-CALIB-BRONZE",
    customerName: "Precision Dynamics Ltd",
    dealRef: "Q1 Raw Materials & Steel Alloy Supply",
    billingCycle: "QUARTERLY",
    amount: 750.0,
    currency: "USD",
    status: "TRIALING",
    nextBillingDate: "2026-03-25",
    startDate: "2026-02-25",
    autoRenew: false,
  },
  {
    id: "sub-104",
    name: "Hardware Diagnostics & Sensor Support Package",
    planCode: "SLA-SENSOR-STD",
    customerName: "Vanguard Robotics",
    dealRef: "Industrial Sensor & IoT Integration Deal",
    billingCycle: "MONTHLY",
    amount: 950.0,
    currency: "USD",
    status: "PAST_DUE",
    nextBillingDate: "2026-03-01",
    startDate: "2025-11-01",
    autoRenew: true,
  },
];

const getStatusBadge = (
  status: WorkspaceSubscription["status"]
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

export default function WorkspaceSubscriptionsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    WorkspaceSubscription["status"] | "ALL"
  >("ALL");
  const [subscriptions, setSubscriptions] =
    useState<WorkspaceSubscription[]>(MOCK_WORKSPACE_SUBSCRIPTIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Subscription Form State
  const [newName, setNewName] = useState("");
  const [newPlanCode, setNewPlanCode] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newDealRef, setNewDealRef] = useState("");
  const [newBillingCycle, setNewBillingCycle] = useState<
    "MONTHLY" | "QUARTERLY" | "ANNUAL"
  >("MONTHLY");
  const [newAmount, setNewAmount] = useState("");

  const formatCurrency = (val: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.planCode.toLowerCase().includes(search.toLowerCase()) ||
      sub.customerName.toLowerCase().includes(search.toLowerCase()) ||
      sub.dealRef.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "ALL" || sub.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const pastDueCount = subscriptions.filter((s) => s.status === "PAST_DUE").length;
  const totalARR = subscriptions.reduce((sum, s) => {
    if (s.status === "CANCELLED") return sum;
    if (s.billingCycle === "MONTHLY") return sum + s.amount * 12;
    if (s.billingCycle === "QUARTERLY") return sum + s.amount * 4;
    if (s.billingCycle === "ANNUAL") return sum + s.amount;
    return sum;
  }, 0);

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCustomer || !newAmount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const newSub: WorkspaceSubscription = {
      id: `sub-${Date.now()}`,
      name: newName.trim(),
      planCode: newPlanCode.trim() || `SLA-${Date.now().toString().slice(-4)}`,
      customerName: newCustomer.trim(),
      dealRef: newDealRef.trim() || "Commercial Equipment Contract",
      billingCycle: newBillingCycle,
      amount: Number(newAmount) || 0,
      currency: "USD",
      status: "ACTIVE",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
      autoRenew: true,
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    setIsCreateModalOpen(false);
    setNewName("");
    setNewPlanCode("");
    setNewCustomer("");
    setNewDealRef("");
    setNewAmount("");
    toast.success(`Subscription plan "${newSub.name}" created successfully.`);
  };

  const handleCancelSub = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subId ? { ...s, status: "CANCELLED", autoRenew: false } : s
      )
    );
    toast.success("Subscription plan cancelled.");
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
              Subscriptions & SLA Plans
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Manage recurring customer contracts, equipment maintenance SLA tiers, and annual renewals.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Subscription Plan
        </Button>
      </div>

      {/* KPI Cards */}
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
              {subscriptions.length} total managed subscriptions
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-purple-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Annual Recurring Revenue (ARR)
            </span>
            <div className="p-2 rounded-xl bg-surface/80 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600">
              {formatCurrency(totalARR)}/yr
            </span>
            <span className="text-xs text-text-muted">
              Projected annual SLA volume
            </span>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-border bg-card border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-text-secondary">
              Past Due Accounts
            </span>
            <div className="p-2 rounded-xl bg-surface/80 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600">
              {pastDueCount} Past Due
            </span>
            <span className="text-xs text-text-muted">
              Requires payment or follow-up
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
              { id: "TRIALING", label: "Trial" },
              { id: "PAST_DUE", label: "Past Due" },
              { id: "CANCELLED", label: "Cancelled" },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveFilter(
                    tab.id as WorkspaceSubscription["status"] | "ALL"
                  )
                }
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plan or customer..."
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
          <table className="w-full text-left text-sm border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
                <th className="py-3.5 px-6">Plan / SLA</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Deal Contract</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4 text-right">Recurring Fee</th>
                <th className="py-3.5 px-4">Next Renewal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary">
                    <CreditCard className="w-8 h-8 text-text-muted opacity-60 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-text-primary">
                      No subscription plans found
                    </p>
                    <p className="text-xs text-text-muted">
                      No recurring plans match your search or filter selection.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const badge = getStatusBadge(sub.status);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-text-primary">
                          {sub.name}
                        </div>
                        <div className="text-[10px] font-mono text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
                          {sub.planCode}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-text-primary whitespace-nowrap">
                        {sub.customerName}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap max-w-xs truncate">
                        {sub.dealRef}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                        {sub.billingCycle}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                        {formatCurrency(sub.amount, sub.currency)}
                      </td>
                      <td className="py-4 px-4 text-xs text-text-secondary whitespace-nowrap">
                        {sub.nextBillingDate}
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
                        {sub.status !== "CANCELLED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-danger hover:bg-red-50 hover:border-red-200"
                            onClick={() => handleCancelSub(sub.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Subscription Plan Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Subscription SLA"
          description="Define a recurring service contract or hardware maintenance plan."
          size="md"
        >
          <form onSubmit={handleCreateSubscription} className="space-y-4">
            <Input
              label="Plan / Service Name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Enterprise Machinery Telemetry SLA"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Plan Code"
                value={newPlanCode}
                onChange={(e) => setNewPlanCode(e.target.value)}
                placeholder="e.g. SLA-GOLD-2026"
              />
              <div>
                <Select
                  label="Billing Cycle"
                  value={newBillingCycle}
                  onChange={(val) =>
                    setNewBillingCycle(
                      val as "MONTHLY" | "QUARTERLY" | "ANNUAL"
                    )
                  }
                  options={[
                    { key: "MONTHLY", value: "Monthly" },
                    { key: "QUARTERLY", value: "Quarterly" },
                    { key: "ANNUAL", value: "Annual" },
                  ]}
                />
              </div>
            </div>

            <Input
              label="Customer Organization"
              required
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              placeholder="e.g. Acme Industrial Supplies"
            />

            <Input
              label="Linked Deal / Contract"
              value={newDealRef}
              onChange={(e) => setNewDealRef(e.target.value)}
              placeholder="e.g. Q1 Equipment Procurement Contract"
            />

            <Input
              label="Recurring Rate Amount ($)"
              type="number"
              step="0.01"
              min="0"
              required
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="1200.00"
            />

            <ModalFooter className="px-0 pb-0 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Subscription
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </main>
  );
}
