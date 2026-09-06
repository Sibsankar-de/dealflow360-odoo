"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  SubscriptionResponseType,
  SubscriptionType,
} from "@/types/subscription";
import {
  useRenewSubscriptionMutation,
  useCustomerRenewSubscriptionMutation,
} from "@/store/features/subscription/subscriptionApi";
import { RefreshCw, Calendar, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  subscription: SubscriptionResponseType | null;
  isCustomerPortal?: boolean;
}

export const RenewSubscriptionModal: React.FC<
  RenewSubscriptionModalProps
> = ({ isOpen, onClose, companyId = "", subscription, isCustomerPortal = false }) => {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>(
    subscription?.subscriptionType || "MONTHLY"
  );
  const [notes, setNotes] = useState("");

  const [renewCompanySub, { isLoading: isCompanyRenewing }] =
    useRenewSubscriptionMutation();
  const [renewCustomerSub, { isLoading: isCustomerRenewing }] =
    useCustomerRenewSubscriptionMutation();

  const isRenewing = isCompanyRenewing || isCustomerRenewing;

  useEffect(() => {
    if (subscription) {
      setSubscriptionType(subscription.subscriptionType || "MONTHLY");
      setNotes("");
    }
  }, [subscription, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    try {
      if (isCustomerPortal) {
        await renewCustomerSub({
          companyId: companyId || undefined,
          id: subscription.id,
          data: {
            subscriptionType,
            notes: notes.trim() || undefined,
          },
        }).unwrap();
      } else {
        await renewCompanySub({
          companyId,
          id: subscription.id,
          data: {
            subscriptionType,
            notes: notes.trim() || undefined,
          },
        }).unwrap();
      }

      toast.success(
        `Subscription ${subscription.subscriptionNo} successfully renewed!`
      );
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to renew subscription. Please try again.";
      toast.error(errorMsg);
    }
  };

  const isActive = subscription?.status === "ACTIVE";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        subscription
          ? `Renew Subscription - ${subscription.subscriptionNo}`
          : "Renew Subscription"
      }
      description={
        isCustomerPortal
          ? "Renew your active or expired recurring service plan."
          : `Process next billing cycle renewal for ${subscription?.customerName || "customer"}.`
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0">
          {/* Renewal Policy Notice */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              isActive
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            {isActive ? (
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            )}
            <div>
              <strong className="block font-semibold">
                {isActive ? "Seamless Period Extension" : "Expired Plan Reactivation"}
              </strong>
              <span>
                {isActive
                  ? `Renews from current expiration (${new Date(
                      subscription?.nextRenewalDate || ""
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}) without interruption. Latest catalog pricing will apply.`
                  : "Renews starting from today with an active status and creates a new billing period."}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Select
              label="Billing Cycle Interval"
              value={subscriptionType}
              onChange={(val) => setSubscriptionType(val as SubscriptionType)}
              options={[
                { key: "MONTHLY", value: "Monthly Interval" },
                { key: "QUARTERLY", value: "Quarterly Interval (3 Months)" },
                { key: "YEARLY", value: "Yearly Interval (12 Months)" },
              ]}
            />

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Renewal Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Renewed per customer request via quarterly review..."
                className="w-full rounded-lg border border-border bg-card p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isRenewing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Confirm Renewal
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
