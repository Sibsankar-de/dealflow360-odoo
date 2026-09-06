"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InvoiceResponse } from "@/types/invoice";
import { useRecordInvoicePaymentMutation } from "@/store/features/invoice/invoiceApi";
import { DollarSign, CreditCard, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
  companyId: string;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  companyId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [recordPayment, { isLoading }] = useRecordInvoicePaymentMutation();

  useEffect(() => {
    if (invoice && isOpen) {
      setAmount(invoice.remainingAmount);
      setPaymentMethod("Bank Transfer");
      setReference("");
      setNotes("");
      setError(null);
    }
  }, [invoice, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numAmount > invoice.remainingAmount + 0.001) {
      setError(
        `Payment amount cannot exceed the remaining balance of ${invoice.currency} ${invoice.remainingAmount.toFixed(2)}.`
      );
      return;
    }

    try {
      setError(null);
      await recordPayment({
        companyId,
        invoiceId: invoice.id,
        data: {
          amount: numAmount,
          paymentMethod,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      }).unwrap();

      toast.success(
        `Payment of ${invoice.currency} ${numAmount.toFixed(2)} recorded successfully.`
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to record payment. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description={`Record customer payment for Invoice ${invoice.invoiceNo}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="p-3.5 bg-surface/60 rounded-xl border border-border flex items-center justify-between text-xs">
            <div>
              <span className="text-text-muted">Total Amount: </span>
              <span className="font-bold text-text-primary">
                {invoice.currency} {invoice.total.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Remaining Balance: </span>
              <span className="font-bold text-brand-600">
                {invoice.currency} {invoice.remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Payment Amount ({invoice.currency}) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.remainingAmount}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === "" ? "" : Number(val));
                }}
                className="pl-9"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Maximum payable: {invoice.currency} {invoice.remainingAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary"
            >
              <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Check">Check</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Payment Reference / Transaction ID
            </label>
            <Input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-98421 or Check #4412"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Notes / Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted"
              placeholder="Additional notes about this payment..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Confirm Payment
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
