"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetCustomerDealsQuery,
  useUpdateDealMutation,
} from "@/store/features/deal/dealApi";
import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DealResponseType } from "@/types/deal";
import {
  Search,
  Eye,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const STAGE_BADGES: Record<string, BadgeVariant> = {
  NEW: "secondary",
  QUALIFICATION: "primary",
  REQUIREMENT: "warning",
  QUOTATION: "info",
  NEGOTIATION: "purple",
  WON: "success",
  LOST: "danger",
};

export default function CustomerDealsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const [searchTerm, setSearchTerm] = useState("");
  const [dealToClose, setDealToClose] = useState<DealResponseType | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });
  const company = companyData?.data?.company;

  const { data: dealsData, isLoading } = useGetCustomerDealsQuery(
    { companyId },
    { skip: !companyId }
  );

  const [updateDeal, { isLoading: isUpdatingDeal }] = useUpdateDealMutation();

  const deals: DealResponseType[] = dealsData?.data?.docs ?? [];

  const filteredDeals = deals.filter((deal: DealResponseType) => {
    const term = searchTerm.toLowerCase();
    return (
      deal.name.toLowerCase().includes(term) ||
      (deal.dealNo && deal.dealNo.toLowerCase().includes(term))
    );
  });

  const handleOpenDealQuotations = (deal: DealResponseType) => {
    router.push(
      `/company/${companyId}/customer/deals/${deal.id}/quotations`
    );
  };

  const handleInitiateCloseDeal = (deal: DealResponseType) => {
    setDealToClose(deal);
    setCloseReason("");
    setIsCloseModalOpen(true);
  };

  const handleConfirmCloseDeal = async () => {
    if (!dealToClose) return;
    try {
      await updateDeal({
        companyId,
        id: dealToClose.id,
        data: {
          stage: "LOST",
          status: "LOST",
        },
      }).unwrap();
      setNotification(`Deal "${dealToClose.name}" marked as closed.`);
      setIsCloseModalOpen(false);
      setDealToClose(null);
      setTimeout(() => setNotification(null), 4000);
    } catch {
      // Error handling
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            My Associated Deals
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review active deal opportunities, proposal terms, and associated quotations with{" "}
            <strong>{company?.name || "Company"}</strong>.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search deals by name or reference number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Deals Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl border border-border bg-card animate-pulse h-48"
            />
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">
            No deals found
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No deals match your search criteria. Try a different query."
              : "You do not have any active deal proposals with this company yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDeals.map((deal: DealResponseType) => {
            const isClosed = deal.stage === "LOST" || deal.stage === "WON";

            return (
              <Card
                key={deal.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:border-text-secondary/30 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-mono text-text-muted">
                          #{deal.dealNo || deal.id.substring(0, 8)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary leading-snug truncate">
                        {deal.name}
                      </h3>
                    </div>
                    <Badge variant={STAGE_BADGES[deal.stage] || "secondary"}>
                      {deal.stage}
                    </Badge>
                  </div>

                  <div className="p-3 bg-surface rounded-xl space-y-2 text-xs text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Building2 className="w-3.5 h-3.5" /> Company
                      </span>
                      <span className="font-semibold text-text-primary truncate max-w-40">
                        {company?.name || "DealFlow360"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <DollarSign className="w-3.5 h-3.5" /> Est. Value
                      </span>
                      <span className="font-bold text-text-primary">
                        ${Number(deal.expectedValue || 0).toLocaleString()}
                      </span>
                    </div>

                    {deal.expectedCloseDate && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-text-muted">
                          <Calendar className="w-3.5 h-3.5" /> Expected Expiry
                        </span>
                        <span className="font-medium text-text-primary">
                          {new Date(deal.expectedCloseDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                  {!isClosed ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInitiateCloseDeal(deal)}
                      className="text-xs text-danger hover:bg-red-50 hover:text-red-700"
                    >
                      Close Deal
                    </Button>
                  ) : (
                    <span className="text-[11px] text-text-muted italic">
                      Deal Concluded
                    </span>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDealQuotations(deal)}
                    rightIcon={<Eye className="w-3.5 h-3.5" />}
                    className="text-xs ml-auto"
                  >
                    View Quotations
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Close Deal Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Close / Cancel Deal"
        description="Are you sure you want to close this deal? This will notify the sales team that you are no longer proceeding with this proposal."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-danger text-xs font-medium">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>
              Closing deal <strong>{dealToClose?.name}</strong> will update its stage to Lost/Cancelled.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Feedback / Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Let the company know why you are closing this deal..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger shadow-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCloseModalOpen(false)}
              disabled={isUpdatingDeal}
            >
              Keep Deal Active
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCloseDeal}
              isLoading={isUpdatingDeal}
              className="bg-danger hover:bg-red-700 text-white border-transparent"
            >
              Confirm Close Deal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
