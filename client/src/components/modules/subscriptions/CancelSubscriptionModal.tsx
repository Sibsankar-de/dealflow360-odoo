"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SubscriptionResponseType } from "@/types/subscription";
import {
  useCancelSubscriptionMutation,
  useCustomerCancelSubscriptionMutation,
} from "@/store/features/subscription/subscriptionApi";
import { AlertCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  subscription: SubscriptionResponseType | null;
  isCustomerPortal?: boolean;
}

export const CancelSubscriptionModal: React.FC<
  CancelSubscriptionModalProps
> = ({ isOpen, onClose, companyId = "", subscription, isCustomerPortal = false }) => {
  const [reason, setReason] = useState("");

  const [cancelCompanySub, { isLoading: isCompanyCancelling }] =
    useCancelSubscriptionMutation();
  const [cancelCustomerSub, { isLoading: isCustomerCancelling }] =
    useCustomerCancelSubscriptionMutation();

  const isCancelling = isCompanyCancelling || isCustomerCancelling;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    try {
      if (isCustomerPortal) {
        await cancelCustomerSub({
          companyId: companyId || undefined,
          id: subscription.id,
          data: {
            cancellationReason: reason.trim() || undefined,
          },
        }).unwrap();
      } else {
        await cancelCompanySub({
          companyId,
          id: subscription.id,
          data: {
            cancellationReason: reason.trim() || undefined,
          },
        }).unwrap();
      }

      toast.success(
        `Subscription ${subscription.subscriptionNo} has been cancelled.`
      );
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to cancel subscription. Please try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        subscription
          ? `Cancel Subscription - ${subscription.subscriptionNo}`
          : "Cancel Subscription"
      }
      description={
        isCustomerPortal
          ? "Are you sure you want to cancel your recurring subscription?"
          : `Terminate recurring subscription for ${subscription?.customerName || "customer"}.`
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-danger flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">
                Permanent Cancellation Warning
              </strong>
              <span>
                Cancelling this subscription will set its status to CANCELLED and prevent automated or manual recurring renewals.
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contract terminated early by customer..."
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Keep Subscription
          </Button>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent"
            isLoading={isCancelling}
          >
            Confirm Cancellation
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
