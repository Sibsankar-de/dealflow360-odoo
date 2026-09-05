"use client";

import React from "react";
import { Building2, Calendar, DollarSign, TrendingUp, FileText } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerDealItem } from "@/types/customer";

interface CustomerDealDetailsModalProps {
  deal: CustomerDealItem | null;
  onClose: () => void;
}

export function CustomerDealDetailsModal({
  deal,
  onClose,
}: CustomerDealDetailsModalProps) {
  if (!deal) return null;

  return (
    <Modal
      isOpen={Boolean(deal)}
      onClose={onClose}
      title={deal.name}
      description={`Reference ID: ${deal.dealNo}`}
      size="md"
    >
      <ModalBody>
        <div className="space-y-5">
          {/* Deal, Company & Expiry Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface/60 rounded-xl border border-border text-xs">
            <div>
              <span className="text-text-muted font-medium">Partner Company</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-brand-600" />
                <p className="font-semibold text-text-primary">
                  {deal.companyName}
                </p>
              </div>
            </div>

            <div>
              <span className="text-text-muted font-medium">Expiry Date</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <p className="font-semibold text-text-primary">
                  {deal.expiryDate}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-success" />
                Proposal Value
              </div>
              <p className="text-base font-bold text-text-primary mt-1">
                ${deal.expectedValue.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                Win Probability
              </div>
              <p className="text-base font-bold text-brand-600 mt-1">
                {deal.probability}%
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">
              Proposal Description
            </span>
            <p className="text-xs text-text-secondary bg-surface p-3 rounded-lg border border-border leading-relaxed">
              {deal.description}
            </p>
          </div>

          {/* Quotations Note */}
          <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-100 flex items-start gap-3">
            <div className="p-2 bg-brand-100 rounded-lg shrink-0 text-brand-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-text-primary">
                {deal.quotationsCount} Quotation Proposals Linked
              </p>
              <p className="text-xs text-text-secondary">
                Review and negotiate commercial terms for this proposal.
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" size="md" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default CustomerDealDetailsModal;
