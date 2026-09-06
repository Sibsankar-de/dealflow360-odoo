"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppSelector } from "@/store";
import { useGetQuotationsQuery } from "@/store/features/quotation/quotationApi";
import { useGetDealsQuery } from "@/store/features/deal/dealApi";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import { useGetCustomersQuery } from "@/store/features/customer/customerApi";
import {
  Building2,
  Globe,
  Coins,
  ArrowRight,
  FileText,
  MapPin,
  Briefcase,
  Package,
  Users,
  Calendar,
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

  // Real-time statistics queries
  const { data: quotationsData, isLoading: isLoadingQuotations } =
    useGetQuotationsQuery({ companyId }, { skip: !companyId });
  const { data: dealsData, isLoading: isLoadingDeals } = useGetDealsQuery(
    { companyId },
    { skip: !companyId }
  );
  const { data: productsData, isLoading: isLoadingProducts } =
    useGetProductsQuery({ companyId }, { skip: !companyId });
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery({ companyId }, { skip: !companyId });

  const totalQuotations =
    quotationsData?.data?.totalDocs ??
    quotationsData?.data?.total ??
    quotationsData?.data?.docs?.length ??
    0;
  const totalDeals =
    dealsData?.data?.total ??
    dealsData?.data?.docs?.length ??
    0;
  const totalProducts =
    productsData?.data?.total ??
    productsData?.data?.products?.length ??
    0;
  const totalCustomers =
    customersData?.data?.total ??
    customersData?.data?.docs?.length ??
    0;

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
            <Link href={`/company/${companyId}/workspace/quotations`}>
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

      {/* Primary KPI & Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotations */}
        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-brand-600 shrink-0 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Total Quotations
            </p>
            {isLoadingQuotations ? (
              <div className="h-6 w-12 bg-border animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-text-primary mt-0.5">
                {totalQuotations}
              </p>
            )}
            <span className="text-[11px] text-text-muted mt-1 block">
              Commercial proposals
            </span>
          </div>
        </Card>

        {/* Total Deals */}
        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Total Deals
            </p>
            {isLoadingDeals ? (
              <div className="h-6 w-12 bg-border animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-text-primary mt-0.5">
                {totalDeals}
              </p>
            )}
            <span className="text-[11px] text-text-muted mt-1 block">
              Active sales pipeline
            </span>
          </div>
        </Card>

        {/* Total Products */}
        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Products
            </p>
            {isLoadingProducts ? (
              <div className="h-6 w-12 bg-border animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-text-primary mt-0.5">
                {totalProducts}
              </p>
            )}
            <span className="text-[11px] text-text-muted mt-1 block">
              Catalog items & tiers
            </span>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary">
              Customers
            </p>
            {isLoadingCustomers ? (
              <div className="h-6 w-12 bg-border animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-bold text-text-primary mt-0.5">
                {totalCustomers}
              </p>
            )}
            <span className="text-[11px] text-text-muted mt-1 block">
              Registered client accounts
            </span>
          </div>
        </Card>
      </div>

      {/* Details & Quick Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Information */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">
              Workspace Location & Info
            </h2>
            <Badge variant="purple" className="text-[10px] px-2 py-0.5 font-medium">
              {userRole}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

            <div className="flex items-start gap-3">
              <Coins className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-text-primary">
                  {currency}
                </p>
                <p className="text-xs text-text-secondary">
                  Default Commercial Currency
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-text-primary">
                  {country}
                </p>
                <p className="text-xs text-text-secondary">
                  Local Operating Region
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-text-primary">
                  {company?.status || "Active"}
                </p>
                <p className="text-xs text-text-secondary">
                  Company Operating Status
                </p>
              </div>
            </div>
          </div>

          {company?.createdAt && (
            <div className="flex items-center gap-2 pt-3 border-t border-border text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>Workspace created on {new Date(company.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">
              Quick Actions
            </h2>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={`/company/${companyId}/workspace/deals`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-primary block">
                    Deals Board
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    View pipeline & opportunities
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href={`/company/${companyId}/workspace/products`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-primary block">
                    Products
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Manage catalog & stock
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
