"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuotationResponse } from "@/types/quotation";
import { useReviseQuotationMutation } from "@/store/features/deal/dealApi";
import toast from "react-hot-toast";

interface ReQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  dealId: string;
  quotation: QuotationResponse | null;
}

export const ReQuotationModal: React.FC<ReQuotationModalProps> = ({
  isOpen,
  onClose,
  companyId,
  dealId,
  quotation,
}) => {
  const [reviseQuotation, { isLoading }] = useReviseQuotationMutation();

  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [discountAdjustment, setDiscountAdjustment] = useState<number | string>("");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setCustomerNote("");
      setInternalNote("");
      setDiscountAdjustment("");
      setError(null);
    }
  }, [isOpen]);

  if (!quotation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await reviseQuotation({
        companyId,
        dealId,
        quotationId: quotation.id,
        data: {
          customerNote: customerNote.trim() || null,
          internalNote: internalNote.trim() || null,
          discountAmount: Number(discountAdjustment) || 0,
        },
      }).unwrap();
      toast.success("Revised quotation issued successfully.");
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to issue revised quotation";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Revision (${quotation.quotationNo})`}
      description="Issue a revised counter-proposal with updated pricing or negotiated terms."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-surface rounded-xl border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Quotation No:</span>
              <span className="font-semibold text-text-primary">
                {quotation.quotationNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Current Revision:</span>
              <span className="font-medium text-text-primary">
                Rev {quotation.currentRevision?.revisionNo ?? 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Current Total:</span>
              <span className="font-bold text-brand-600">
                ${quotation.currentRevision?.totalAmount?.toFixed(2) ?? "0.00"}{" "}
                {quotation.currency}
              </span>
            </div>
          </div>

          <Input
            label="Additional Discount ($)"
            type="number"
            min="0"
            step="0.01"
            value={discountAdjustment}
            onChange={(e) => setDiscountAdjustment(e.target.value)}
            placeholder="0.00"
          />

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Customer Note / Justification
            </label>
            <textarea
              rows={3}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Explain negotiated concessions or revised line item changes..."
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Internal Note
            </label>
            <textarea
              rows={2}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Internal record for manager review..."
              className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Creating Revision..."
          >
            Issue Revision
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ReQuotationModal;
