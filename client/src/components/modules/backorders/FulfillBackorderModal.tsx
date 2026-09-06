"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BackorderResponse } from "@/types/backorder";
import { useFulfillBackorderMutation } from "@/store/features/backorder/backorderApi";
import { Package, Truck, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [fulfillBackorder, { isLoading }] = useFulfillBackorderMutation();

  useEffect(() => {
    if (backorder) {
      const initialQtys: Record<string, number> = {};
      (backorder.items || []).forEach((item) => {
        initialQtys[item.salesOrderItemId] = item.remainingQuantity || 0;
      });
      setQuantities(initialQtys);
      setTrackingNumber("");
      setExpectedDate("");
      setNotes("");
      setError(null);
    }
  }, [backorder]);

  const handleQtyChange = (salesOrderItemId: string, val: string, maxQty: number) => {
    const num = val === "" ? 0 : Number(val);
    setQuantities((prev) => ({
      ...prev,
      [salesOrderItemId]: Math.min(Math.max(0, num), maxQty),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backorder || !companyId) return;

    const itemsToDeliver = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([salesOrderItemId, deliveredQuantity]) => ({
        salesOrderItemId,
        deliveredQuantity,
      }));

    if (itemsToDeliver.length === 0) {
      setError("Please specify a delivered quantity greater than 0 for at least one item.");
      return;
    }

    setError(null);
    try {
      const res = await fulfillBackorder({
        companyId,
        backorderId: backorder.id,
        data: {
          trackingNumber: trackingNumber.trim() || undefined,
          expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
          items: itemsToDeliver,
        },
      }).unwrap();

      if (res.statusCode >= 200 && res.statusCode < 300) {
        onSuccess?.();
        onClose();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to fulfill backorder. Please check stock availability and try again.";
      setError(errorMsg);
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
      <form onSubmit={handleSubmit} className="space-y-5">
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
            Select Quantities to Deliver
          </label>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-semibold text-text-muted">
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-3 text-center">Remaining</th>
                  <th className="py-2.5 px-4 text-right w-36">Fulfill Now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(backorder.items || []).map((item) => {
                  const currentVal = quantities[item.salesOrderItemId] ?? item.remainingQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-surface/30">
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {item.productName || "Product Item"}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-text-secondary">
                        {item.remainingQuantity} units
                      </td>
                      <td className="py-2 px-4 text-right">
                        <Input
                          type="number"
                          min="0"
                          max={item.remainingQuantity}
                          value={currentVal}
                          onChange={(e) =>
                            handleQtyChange(
                              item.salesOrderItemId,
                              e.target.value,
                              item.remainingQuantity
                            )
                          }
                          className="w-24 ml-auto text-center py-1 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tracking & Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Tracking Number (Optional)
            </label>
            <Input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRK-881249"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Expected Delivery Date (Optional)
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
        </div>
      </form>
    </Modal>
  );
};

export default FulfillBackorderModal;
