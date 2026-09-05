"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { clsx } from "clsx";
import {
  Briefcase,
  Search,
  TrendingUp,
  Calendar,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
  Eye,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useGetDealsQuery } from "@/store/features/deal/dealApi";
import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";
import { DealResponseType, DealStage, DealStatus } from "@/types/deal";

const STAGE_COLORS: Record<DealStage, BadgeVariant> = {
  NEW: "info",
  QUALIFICATION: "secondary",
  REQUIREMENT: "purple",
  QUOTATION: "warning",
  NEGOTIATION: "primary",
  WON: "success",
  LOST: "danger",
};

const STATUS_COLORS: Record<DealStatus, BadgeVariant> = {
  OPEN: "primary",
  WON: "success",
  LOST: "danger",
  CANCELLED: "secondary",
};

export default function CustomerDealsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  // Data queries
  const {
    data: dealsData,
    isLoading: isDealsLoading,
    isError: isDealsError,
    error: dealsError,
    refetch: refetchDeals,
  } = useGetDealsQuery({ companyId }, { skip: !companyId });

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const company = companyData?.data?.company;
  const companyName = company?.name || "Company";

  // Deals normalization
  const deals: DealResponseType[] = useMemo(() => {
    if (!dealsData?.data) return [];
    const rawData = dealsData.data;
    if (Array.isArray(rawData)) return rawData;
    if ("docs" in rawData && Array.isArray(rawData.docs)) {
      return rawData.docs;
    }
    if ("deals" in rawData && Array.isArray(rawData.deals)) {
      return rawData.deals;
    }
    return [];
  }, [dealsData]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected Deal for Details Modal
  const [selectedDeal, setSelectedDeal] = useState<DealResponseType | null>(
    null
  );

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalDeals = deals.length;
    const activeDeals = deals.filter(
      (d) => d.status === "OPEN" || d.stage === "QUOTATION" || d.stage === "NEGOTIATION"
    ).length;
    const totalValue = deals.reduce(
      (sum, d) => sum + (Number(d.expectedValue) || 0),
      0
    );
    const inNegotiation = deals.filter(
      (d) => d.stage === "NEGOTIATION" || d.stage === "QUOTATION"
    ).length;
    const wonDeals = deals.filter(
      (d) => d.stage === "WON" || d.status === "WON"
    ).length;

    return { totalDeals, activeDeals, totalValue, inNegotiation, wonDeals };
  }, [deals]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        deal.name.toLowerCase().includes(search) ||
        deal.dealNo.toLowerCase().includes(search) ||
        (deal.source && deal.source.toLowerCase().includes(search));

      const matchesStage =
        stageFilter === "ALL" || deal.stage === stageFilter;
      const matchesStatus =
        statusFilter === "ALL" || deal.status === statusFilter;

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [deals, searchTerm, stageFilter, statusFilter]);

  const errorMessage =
    (dealsError as { data?: { message?: string } })?.data?.message ||
    "Failed to load active deals.";

  return (
    <div className="space-y-8">
      {/* Active Deals Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Active Deals & Proposals
              </h1>
            </div>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Track commercial deals, active proposals, and quotation agreements shared with you by{" "}
              <span className="font-semibold text-text-primary">{companyName}</span>.
            </p>
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Deals
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.activeDeals}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Out of {metrics.totalDeals} total records
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Proposal Value
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${metrics.totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Across all associated deals
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                In Negotiation
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.inNegotiation}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Quotes ready for review
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Layers className="w-4 h-4 text-purple" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Agreed / Won
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.wonDeals}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Finalized agreements
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {isDealsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-danger text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => refetchDeals()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="flex-1">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search deals by title, deal #, or channel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-52">
          <Select
            value={stageFilter}
            onChange={(val) => setStageFilter(val)}
            options={[
              { key: "ALL", value: "All Pipeline Stages" },
              { key: "NEW", value: "New" },
              { key: "QUALIFICATION", value: "Qualification" },
              { key: "REQUIREMENT", value: "Requirement" },
              { key: "QUOTATION", value: "Quotation" },
              { key: "NEGOTIATION", value: "Negotiation" },
              { key: "WON", value: "Won" },
              { key: "LOST", value: "Lost" },
            ]}
          />
        </div>

        <div className="w-full md:w-44">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { key: "ALL", value: "All Statuses" },
              { key: "OPEN", value: "Open" },
              { key: "WON", value: "Won" },
              { key: "LOST", value: "Lost" },
              { key: "CANCELLED", value: "Cancelled" },
            ]}
          />
        </div>
      </div>

      {/* Deals List Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        {isDealsLoading ? (
          <div className="p-16 text-center text-text-muted space-y-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading active deals and quotations...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="py-16 px-8 text-center">
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
              <Briefcase className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No deals found
            </h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
              {searchTerm || stageFilter !== "ALL" || statusFilter !== "ALL"
                ? "No deals matched your search filters. Try adjusting your query."
                : "No active commercial deals are currently open for your account in this company workspace."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80 text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Deal Information</th>
                  <th className="py-3.5 px-6">Pipeline Stage</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Expected Value</th>
                  <th className="py-3.5 px-6">Quotations</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeals.map((deal) => {
                  const quotesCount =
                    deal.quotationsCount ?? deal.quotations?.length ?? 0;
                  const formattedValue = Number(
                    deal.expectedValue || 0
                  ).toLocaleString();
                  const formattedDate = deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : null;

                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-surface/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                            {deal.name}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                          </span>
                          <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                            <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">
                              {deal.dealNo}
                            </span>
                            {formattedDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-text-muted" />
                                Close: {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={STAGE_COLORS[deal.stage] || "secondary"}>
                          {deal.stage}
                        </Badge>
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={STATUS_COLORS[deal.status] || "secondary"}>
                          {deal.status}
                        </Badge>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-text-primary">
                          ${formattedValue}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span>{deal.probability}% win probability</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            quotesCount > 0
                              ? "bg-brand-50 text-brand-700 border border-brand-100"
                              : "bg-surface text-text-muted border border-border"
                          )}
                        >
                          <FileText className="w-3 h-3" />
                          {quotesCount} {quotesCount === 1 ? "Quote" : "Quotes"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedDeal(deal)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <Modal
          isOpen={Boolean(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          title={selectedDeal.name}
          description={`Deal Reference: ${selectedDeal.dealNo}`}
          size="lg"
        >
          <ModalBody>
            <div className="space-y-6">
              {/* Top Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-surface rounded-xl border border-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Pipeline Stage
                  </p>
                  <div className="mt-1.5">
                    <Badge variant={STAGE_COLORS[selectedDeal.stage] || "secondary"}>
                      {selectedDeal.stage}
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </p>
                  <div className="mt-1.5">
                    <Badge variant={STATUS_COLORS[selectedDeal.status] || "secondary"}>
                      {selectedDeal.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Proposal Value
                  </p>
                  <p className="text-base font-bold text-text-primary mt-1">
                    ${Number(selectedDeal.expectedValue || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Probability
                  </p>
                  <p className="text-base font-bold text-brand-600 mt-1">
                    {selectedDeal.probability}%
                  </p>
                </div>
              </div>

              {/* Deal Schedule & Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface/60 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-text-muted font-medium">Expected Close Date</span>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {selectedDeal.expectedCloseDate
                      ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-text-muted font-medium">Lead Channel / Source</span>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {selectedDeal.source || "Direct Proposal"}
                  </p>
                </div>
              </div>

              {/* Quotations Quick Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Associated Quotations
                  </h4>
                  <span className="text-xs text-text-muted">
                    {selectedDeal.quotationsCount ?? selectedDeal.quotations?.length ?? 0} proposal revisions
                  </span>
                </div>

                <div className="p-4 bg-surface rounded-xl border border-border text-center space-y-2">
                  <p className="text-xs text-text-secondary">
                    Review and sign off on active quotation proposals in the quotation review center.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Link
                      href={`/company/${companyId}/app/deals/${selectedDeal.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                    >
                      <span>Open Quotation Review</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              size="md"
              onClick={() => setSelectedDeal(null)}
            >
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
