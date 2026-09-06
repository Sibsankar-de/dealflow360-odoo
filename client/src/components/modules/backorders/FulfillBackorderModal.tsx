"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BackorderResponse } from "@/types/backorder";
import { useFulfillBackorderMutation } from "@/store/features/backorder/backorderApi";
import { Package, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export interface FulfillBackorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  backorder: BackorderResponse | null;
  companyId: string;
  onSuccess?: () => void;
}

export const FulfillBackorderModal: React.FC<FulfillBackorderModalProps> = ({
  isOpen,
  onClose,
  backorder,
  companyId,
  onSuccess,
}) => {
  const [items, setItems] = useState<
    Array<{ quotationItemId: string; quantityToFulfill: number; maxQty: number; name: string }>
  >([]);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [fulfillBackorder, { isLoading }] = useFulfillBackorderMutation();

  useEffect(() => {
    if (backorder && isOpen) {
      setItems(
        (backorder.items || []).map((it) => ({
          quotationItemId: it.salesOrderItemId,
          quantityToFulfill: it.remainingQuantity || 0,
          maxQty: it.remainingQuantity || 0,
          name: it.productName || "Product Item",
        }))
      );
      setCarrier("");
      setTrackingNumber("");
      setExpectedDate("");
      setNotes("");
      setError(null);
    }
  }, [backorder, isOpen]);

  const handleQtyChange = (quotationItemId: string, val: string) => {
    const num = Number(val);
    setItems((prev) =>
      prev.map((it) =>
        it.quotationItemId === quotationItemId
          ? {
              ...it,
              quantityToFulfill: isNaN(num) ? 0 : Math.min(Math.max(0, num), it.maxQty),
            }
          : it
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backorder) return;

    const totalFulfilling = items.reduce((acc, curr) => acc + curr.quantityToFulfill, 0);
    if (totalFulfilling <= 0) {
      setError("Please specify at least 1 unit to fulfill.");
      return;
    }

    try {
      setError(null);
      await fulfillBackorder({
        companyId,
        backorderId: backorder.id,
        data: {
          items: items
            .filter((it) => it.quantityToFulfill > 0)
            .map((it) => ({
              salesOrderItemId: it.quotationItemId,
              deliveredQuantity: it.quantityToFulfill,
            })),
          trackingNumber: trackingNumber.trim() || undefined,
          expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        },
      }).unwrap();

      toast.success(`Backorder fulfilled! Delivery created successfully.`);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to fulfill backorder. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (!backorder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fulfill Backorder"
      description={`Allocate warehouse stock and create delivery for Backorder ${backorder.backorderNo}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Backorder Header Summary */}
          <div className="p-3.5 bg-surface/60 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-text-muted">Sales Order: </span>
              <span className="font-bold text-text-primary">
                {backorder.orderNo || "Sales Order"}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Remaining to Fulfill: </span>
              <span className="font-bold text-red-600">
                {backorder.remainingQuantity} units
              </span>
            </div>
          </div>

          {/* Item Quantities Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-primary">
              Select Item Quantities to Deliver
            </label>
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.quotationItemId}
                  className="p-3 bg-surface/40 rounded-xl border border-border flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary truncate">{it.name}</p>
                    <p className="text-text-muted text-[11px]">
                      Available backorder qty:{" "}
                      <span className="font-medium text-text-primary">{it.maxQty} units</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-text-muted text-[11px]">Deliver:</span>
                    <Input
                      type="number"
                      min="0"
                      max={it.maxQty}
                      value={it.quantityToFulfill}
                      onChange={(e) => handleQtyChange(it.quotationItemId, e.target.value)}
                      className="w-24 text-right"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Courier Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Tracking Number
              </label>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 7849102931"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Expected Date
              </label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Fulfillment Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text-primary placeholder:text-text-muted"
              placeholder="Delivery instructions, courier name, warehouse dispatch notes..."
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
            leftIcon={<Truck className="w-4 h-4" />}
          >
            Dispatch & Fulfill
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default FulfillBackorderModal;
