"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppSelector } from "@/store";
import {
  Building2,
  ShieldCheck,
  Globe,
  Coins,
  ArrowRight,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function CompanyDashboardPage() {
  const params = useParams();
  const companyId =
    typeof params["company-id"] === "string" ? params["company-id"] : "";
  const company = useAppSelector((state) => state.company.currentCompany);

  const companyName = company?.name || "Company Workspace";
  const userRole = company?.userRole || "Company Admin";
  const currency = company?.currency || "USD";
  const country = company?.country || "Global";
  const addressLine = company?.addressLine;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Hero Card */}
      <Card className="p-6 md:p-8 bg-linear-to-r from-card to-surface border-border overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 text-brand-500 text-xs font-semibold">
              <span>Workspace Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Welcome to {companyName}
            </h1>
            <p className="text-sm text-text-secondary max-w-xl">
              You are working in this company workspace as{" "}
              <span className="font-semibold text-text-primary">
                {userRole}
              </span>
              . Manage quotations, customer negotiations, pipeline approvals,
              and fulfillment workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/company/${companyId}/app/quotations`}>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-xs"
              >
                View Quotations
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Your Assigned Role
            </p>
            <p className="text-base font-bold text-text-primary mt-0.5 truncate">
              {userRole}
            </p>
            <Badge variant="purple" className="mt-2 text-[10px] px-2 py-0">
              Active Member
            </Badge>
          </div>
        </Card>

        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-brand-600 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Default Currency
            </p>
            <p className="text-base font-bold text-text-primary mt-0.5">
              {currency}
            </p>
            <span className="text-[11px] text-text-muted mt-1 block">
              Commercial Pricing
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Region / Country
            </p>
            <p className="text-base font-bold text-text-primary mt-0.5 truncate">
              {country}
            </p>
            <span className="text-[11px] text-text-muted mt-1 block">
              Local Operating Region
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Company Status
            </p>
            <p className="text-base font-bold text-text-primary mt-0.5">
              {company?.status || "Active"}
            </p>
            <Badge variant="success" className="mt-2 text-[10px] px-2 py-0">
              Operational
            </Badge>
          </div>
        </Card>
      </div>

      {/* Details & Quick Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">
              Workspace Location & Info
            </h2>
            <span className="text-xs text-text-muted font-mono">
              {company?.id ? company.id.slice(0, 8) : "COMP"}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-text-primary">
                  {addressLine || "Corporate headquarters location"}
                </p>
                <p className="text-xs text-text-secondary">
                  {company?.postalCode
                    ? `Postal Code: ${company.postalCode}, `
                    : ""}
                  {country}
                </p>
              </div>
            </div>

            {company?.createdAt && (
              <p className="text-xs text-text-muted pt-2 border-t border-border">
                Created {company.createdAt}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">
              Quick Actions
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/company/${companyId}/quotations`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-medium text-text-primary">
                  Quotations Board
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
            </Link>

            <Link
              href="/profile"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-text-muted" />
                <span className="text-xs font-medium text-text-primary">
                  Switch Company
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
