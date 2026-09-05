"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DealResponseType, DealStage, DealStatus } from "@/types/deal";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { DealModal } from "./DealModal";
import { DeleteDealModal } from "./DeleteDealModal";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";

interface DealListProps {
  deals: DealResponseType[];
  companyId: string;
  isLoading?: boolean;
  currentPage?: number;
  totalPage?: number;
  onPageChange?: (page: number) => void;
}

const STAGE_COLORS: Record<DealStage, BadgeVariant> = {
  NEW: "info",
  QUALIFICATION: "secondary",
  REQUIREMENT: "purple",
  QUOTATION: "warning",
  NEGOTIATION: "primary",
  WON: "success",
  LOST: "danger",
};

export const DealList: React.FC<DealListProps> = ({
  deals,
  companyId,
  isLoading = false,
  currentPage = 1,
  totalPage = 1,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDeal, setSelectedDeal] = useState<DealResponseType | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDeal, setDeleteDeal] = useState<DealResponseType | null>(null);

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.dealNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.customer?.userName &&
        d.customer.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = stageFilter === "ALL" || d.stage === stageFilter;
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const handleEdit = (d: DealResponseType) => {
    setSelectedDeal(d);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDeal(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Deals Pipeline
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Track business opportunities, customer accounts, and nested quotation proposals.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleCreate}
        >
          Create Deal
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 w-full">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search deals by title, deal #, or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={stageFilter}
            onChange={(val) => setStageFilter(val)}
            options={[
              { key: "ALL", value: "All Stages" },
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
        <div className="w-full sm:w-40">
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

      {/* Deals Table / Empty state */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted">
            <Briefcase className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
            <p className="text-sm">Loading deal records...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-text-primary">
              No deals found
            </h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
              {searchTerm || stageFilter !== "ALL" || statusFilter !== "ALL"
                ? "No deals matched your query criteria."
                : "Create a deal to start managing quotes and negotiations for customers."}
            </p>
            {!searchTerm && stageFilter === "ALL" && statusFilter === "ALL" && (
              <Button
                variant="outline"
                className="mt-4"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Create First Deal
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Deal</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Expected Value</th>
                  {/* <th className="py-3.5 px-4">Quotations</th> */}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-surface/50 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/company/${companyId}/app/deals/${deal.id}/quotations`}
                        className="font-semibold text-text-primary hover:text-brand-600 transition-colors flex items-center gap-1.5"
                      >
                        {deal.name}
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                        <span>{deal.dealNo}</span>
                        {deal.expectedCloseDate && (
                          <span className="flex items-center gap-1 text-text-muted">
                            <Calendar className="w-3 h-3" />
                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-text-primary">
                        <User className="w-4 h-4 text-text-muted" />
                        <span className="font-medium">
                          {deal.customer?.userName || "Customer"}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted">
                        {deal.customer?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={STAGE_COLORS[deal.stage] || "secondary"}>
                        {deal.stage}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">
                        ${Number(deal.expectedValue).toLocaleString()}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span>{deal.probability}% win probability</span>
                      </div>
                    </td>
                    {/* <td className="py-3.5 px-4">
                      <Link
                        href={`/company/${companyId}/app/deals/${deal.id}/quotations`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        <span>{deal.quotationsCount ?? deal.quotations?.length ?? 0} Quotes</span>
                      </Link>
                    </td> */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(deal)}
                          title="Edit deal"
                          className="p-1.5 h-8 w-8 text-text-secondary hover:text-brand-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDeal(deal)}
                          title="Delete deal"
                          className="p-1.5 h-8 w-8 text-text-secondary hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPage > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPage}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Modals */}
      <DealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        deal={selectedDeal}
      />

      <DeleteDealModal
        isOpen={Boolean(deleteDeal)}
        onClose={() => setDeleteDeal(null)}
        companyId={companyId}
        deal={deleteDeal}
      />
    </div>
  );
};

export default DealList;
