"use client";

import React from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  SubscriptionResponseType,
  SubscriptionPeriodResponseType,
} from "@/types/subscription";
import { useGetSubscriptionHistoryQuery } from "@/store/features/subscription/subscriptionApi";
import {
  History,
  Calendar,
  Clock,
  User,
  Package,
  FileText,
} from "lucide-react";

interface SubscriptionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  subscription: SubscriptionResponseType | null;
}

export const SubscriptionHistoryModal: React.FC<
  SubscriptionHistoryModalProps
> = ({ isOpen, onClose, companyId, subscription }) => {
  const { data: historyData, isLoading } = useGetSubscriptionHistoryQuery(
    { companyId, id: subscription?.id || "" },
    { skip: !isOpen || !subscription?.id || !companyId }
  );

  const history: SubscriptionPeriodResponseType[] =
    historyData?.data?.history || subscription?.periods || [];

  const formatCurrency = (amount: number = 0, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        subscription
          ? `Subscription History - ${subscription.subscriptionNo}`
          : "Subscription History"
      }
      description={
        subscription?.customerName
          ? `Historical billing periods, applied pricing snapshots, and renewals for ${subscription.customerName}.`
          : "View all renewal periods and pricing snapshots for this recurring contract."
      }
      size="lg"
    >
      <ModalBody className="space-y-4 pt-0">
        {/* Subscription Metadata Header */}
        {subscription && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface p-3.5 rounded-xl border border-border text-xs">
            <div>
              <span className="text-text-muted block">Current Status</span>
              <Badge
                variant={
                  subscription.status === "ACTIVE"
                    ? "success"
                    : subscription.status === "EXPIRED"
                    ? "warning"
                    : "secondary"
                }
                className="mt-1"
              >
                {subscription.status}
              </Badge>
            </div>
            <div>
              <span className="text-text-muted block">Billing Cycle</span>
              <span className="font-semibold text-text-primary mt-1 block">
                {subscription.subscriptionType}
              </span>
            </div>
            <div>
              <span className="text-text-muted block">Next Renewal</span>
              <span className="font-semibold text-text-primary mt-1 block">
                {formatDate(subscription.nextRenewalDate)}
              </span>
            </div>
            <div>
              <span className="text-text-muted block">Current Rate</span>
              <span className="font-bold text-brand-600 mt-1 block">
                {formatCurrency(
                  subscription.totalRecurringAmount,
                  subscription.currency
                )}
              </span>
            </div>
          </div>
        )}

        {/* History Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <History className="w-3.5 h-3.5" />
            <span>Renewal & Period Audit History</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-text-muted space-y-2">
              <Clock className="w-6 h-6 animate-spin mx-auto text-brand-600 opacity-60" />
              <p className="text-xs">Loading period history snapshots...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-text-muted bg-surface/50 rounded-xl border border-dashed border-border">
              <p className="text-xs">No recorded period history snapshots found.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {history.map((period) => {
                const items = Array.isArray(period.itemsSnapshot)
                  ? period.itemsSnapshot
                  : [];

                return (
                  <div
                    key={period.id || period.periodNumber}
                    className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
                          Period #{period.periodNumber}
                        </span>
                        <span className="text-xs font-semibold text-text-primary">
                          {period.subscriptionType} Cycle
                        </span>
                      </div>
                      <div className="text-xs font-bold text-text-primary">
                        {formatCurrency(
                          period.totalAmount,
                          subscription?.currency || "USD"
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span>
                          <strong>Duration:</strong> {formatDate(period.startDate)} –{" "}
                          {formatDate(period.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span>
                          <strong>Renewed By:</strong>{" "}
                          {period.renewedByName || "System Fulfillment"}
                        </span>
                      </div>
                    </div>

                    {/* Snapshot items breakdown */}
                    {items.length > 0 && (
                      <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <span className="text-[11px] font-semibold text-text-muted uppercase">
                          Applied Item Snapshot
                        </span>
                        <div className="bg-surface rounded-lg p-2.5 space-y-1.5 border border-border/50 text-xs">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-text-primary"
                            >
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                <span className="font-medium">
                                  {item.productName || "Recurring Product"}
                                </span>
                                <span className="text-text-muted">
                                  × {item.quantity}
                                </span>
                              </div>
                              <div className="font-semibold text-right">
                                {formatCurrency(
                                  item.lineTotal,
                                  subscription?.currency || "USD"
                                )}
                                <span className="text-[10px] text-text-muted block font-normal">
                                  @{formatCurrency(item.unitPrice, subscription?.currency)}
                                  {item.discount > 0 && ` (-${item.discount}%)`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {period.notes && (
                      <div className="flex items-start gap-1.5 text-xs text-text-muted italic bg-surface/30 p-2 rounded border border-border/30">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{period.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
