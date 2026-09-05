import React, { useState } from "react";
import { Truck, CheckCircle2, Edit3 } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { RecommendedFulfillmentPlan } from "@/types/fulfillment";

export interface FulfillmentPlanAllocationProps {
  plan: RecommendedFulfillmentPlan;
  onAcceptSplit?: () => void;
  onConfirmOverride?: (allocations: Record<string, number>) => void;
  className?: string;
}

export const FulfillmentPlanAllocation: React.FC<FulfillmentPlanAllocationProps> = ({
  plan,
  onAcceptSplit,
  onConfirmOverride,
  className,
}) => {
  const [activeMode, setActiveMode] = useState<"Suggested" | "Manual Override">(plan.mode);

  // Editable allocations per warehouse ID for Manual Override mode
  const [overrideAllocations, setOverrideAllocations] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    plan.warehouses.forEach((wh) => {
      // In the mockup for Manual Override, Main Warehouse is 8 and East Depot is 4
      initialMap[wh.id] = wh.id === "wh_main" ? 8 : wh.allocatedQty;
    });
    return initialMap;
  });

  const handleAllocationInputChange = (warehouseId: string, valueStr: string) => {
    const parsed = parseInt(valueStr, 10);
    const newQty = isNaN(parsed) ? 0 : Math.max(0, parsed);

    setOverrideAllocations((prev) => ({
      ...prev,
      [warehouseId]: newQty,
    }));
  };

  // Compute dynamic warehouse quantities based on current mode
  const computedWarehouses = plan.warehouses.map((wh) => {
    const allocated =
      activeMode === "Manual Override"
        ? overrideAllocations[wh.id] ?? wh.allocatedQty
        : wh.allocatedQty;
    const remaining = Math.max(0, wh.availableQty - allocated);

    return {
      ...wh,
      allocatedQty: allocated,
      remainingQty: remaining,
    };
  });

  // Calculate dynamic summary banner totals
  const totalAllocated = computedWarehouses.reduce((acc, wh) => acc + wh.allocatedQty, 0);
  const shipmentsCount = computedWarehouses.filter((wh) => wh.allocatedQty > 0).length;
  const estShippingCost = computedWarehouses
    .filter((wh) => wh.allocatedQty > 0)
    .reduce((acc, wh) => acc + wh.shippingEstimate, 0);

  const handlePrimaryAction = () => {
    if (activeMode === "Manual Override") {
      if (onConfirmOverride) {
        onConfirmOverride(overrideAllocations);
      } else if (onAcceptSplit) {
        onAcceptSplit();
      }
    } else if (onAcceptSplit) {
      onAcceptSplit();
    }
  };

  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">
            {activeMode === "Manual Override" ? "Manual Override" : "Recommended Fulfillment Plan"}
          </CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Warehouse allocation for {plan.productName} ×{plan.targetQty}
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode("Suggested")}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
              activeMode === "Suggested"
                ? "bg-brand-50 text-brand-700 border-brand-500 shadow-xs"
                : "bg-transparent text-text-secondary border-border hover:bg-surface"
            )}
          >
            Suggested
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("Manual Override")}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
              activeMode === "Manual Override"
                ? "bg-brand-50 text-brand-700 border-brand-500 shadow-xs"
                : "bg-transparent text-text-secondary border-border hover:bg-surface"
            )}
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span>Manual Override</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Warehouse Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {computedWarehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-5 rounded-xl border border-border bg-surface/30 flex flex-col justify-between gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{wh.name}</h4>
                  <p className="text-xs text-text-muted mt-0.5">{wh.location}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/60 text-text-secondary shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-muted">Available</span>
                  <span className="text-lg font-bold text-text-primary">{wh.availableQty}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-muted">Allocated</span>
                  <span className="text-lg font-bold text-text-primary">{wh.allocatedQty}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-muted">Remaining</span>
                  <span className="text-lg font-bold text-text-primary">{wh.remainingQty}</span>
                </div>
              </div>

              {/* Allocate Units Input (Manual Override Mode) */}
              {activeMode === "Manual Override" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-text-secondary block">
                    Allocate units
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={wh.availableQty}
                    value={overrideAllocations[wh.id] ?? ""}
                    onChange={(e) => handleAllocationInputChange(wh.id, e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-medium text-text-primary bg-card border border-brand-500/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                  />
                </div>
              )}

              {/* Shipping Estimate Footer */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 text-text-secondary">
                <span>Shipping estimate</span>
                <span className="font-bold text-text-primary">
                  {wh.currencySymbol || "₹"}{wh.shippingEstimate.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Allocation Summary Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 text-emerald-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">Total Required</span>
            <span className="text-lg font-bold text-emerald-700">{plan.totalRequired} units</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">Total Allocated</span>
            <span className="text-lg font-bold text-emerald-700">{totalAllocated} units</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">Shipments</span>
            <span className="text-lg font-bold text-emerald-700">{shipmentsCount}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">Est. Shipping Cost</span>
            <span className="text-lg font-bold text-emerald-700">₹{estShippingCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {activeMode === "Manual Override"
              ? "Confirm Manual Override"
              : "Accept Suggested Split"}
          </span>
        </button>
      </CardContent>
    </Card>
  );
};

export default FulfillmentPlanAllocation;
