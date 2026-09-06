"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  CheckCircle2,
  Edit3,
  Building2,
  Package,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import {
  RecommendedFulfillmentPlan,
  ItemFulfillmentPlan,
  ProductWarehouseStock,
} from "@/types/fulfillment";

export interface ItemWarehouseAllocationPayload {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface FulfillmentPlanAllocationProps {
  plan: RecommendedFulfillmentPlan;
  warehouses?: Array<{ id: string; name: string; country?: string; addressLine?: string }>;
  selectedWarehouseId?: string;
  onSelectPrimaryWarehouse?: (warehouseId: string) => void;
  onAcceptSplit?: () => void;
  onConfirmOverride?: (
    allocations: ItemWarehouseAllocationPayload[],
    primaryWarehouseId?: string
  ) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const FulfillmentPlanAllocation: React.FC<
  FulfillmentPlanAllocationProps
> = ({
  plan,
  warehouses = [],
  selectedWarehouseId,
  onSelectPrimaryWarehouse,
  onAcceptSplit,
  onConfirmOverride,
  isSubmitting = false,
  className,
}) => {
  const [activeMode, setActiveMode] = useState<"Suggested" | "Manual Override">(
    plan.mode || "Suggested"
  );

  const [primaryWhId, setPrimaryWhId] = useState<string>(
    selectedWarehouseId || warehouses[0]?.id || ""
  );

  // Per product, per warehouse allocation map: { [productId]: { [warehouseId]: quantity } }
  const [overrideMap, setOverrideMap] = useState<
    Record<string, Record<string, number | string>>
  >(() => {
    const initial: Record<string, Record<string, number | string>> = {};
    plan.items?.forEach((item) => {
      initial[item.productId] = {};
      item.warehouses?.forEach((wh) => {
        initial[item.productId][wh.warehouseId] = wh.allocatedQty;
      });
    });
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, Record<string, number | string>> = {};
    plan.items?.forEach((item) => {
      initial[item.productId] = {};
      item.warehouses?.forEach((wh) => {
        initial[item.productId][wh.warehouseId] = wh.allocatedQty;
      });
    });
    setOverrideMap(initial);
  }, [plan]);

  useEffect(() => {
    if (selectedWarehouseId) {
      setPrimaryWhId(selectedWarehouseId);
    } else if (warehouses[0]?.id && !primaryWhId) {
      setPrimaryWhId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses, primaryWhId]);

  const handleAllocationInputChange = (
    productId: string,
    warehouseId: string,
    val: string
  ) => {
    setOverrideMap((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [warehouseId]: val,
      },
    }));
  };

  // Compute live per-item evaluations based on current mode
  const evaluatedItems: ItemFulfillmentPlan[] = useMemo(() => {
    return (plan.items || []).map((item) => {
      const computedWarehouses: ProductWarehouseStock[] = (
        item.warehouses || []
      ).map((wh) => {
        let allocated = wh.allocatedQty;

        if (activeMode === "Manual Override") {
          const rawVal = overrideMap[item.productId]?.[wh.warehouseId];
          const parsed = rawVal !== undefined && rawVal !== "" ? Number(rawVal) || 0 : 0;
          allocated = Math.max(0, Math.min(wh.availableQty, parsed));
        }

        const remaining = Math.max(0, wh.availableQty - allocated);

        return {
          ...wh,
          allocatedQty: allocated,
          remainingQty: remaining,
        };
      });

      const allocatedQty = computedWarehouses.reduce(
        (sum, w) => sum + w.allocatedQty,
        0
      );
      const backorderQty = Math.max(0, item.requiredQty - allocatedQty);

      return {
        ...item,
        allocatedQty,
        backorderQty,
        warehouses: computedWarehouses,
      };
    });
  }, [plan.items, activeMode, overrideMap]);

  // Overall totals across all items
  const totalRequired = evaluatedItems.reduce(
    (acc, it) => acc + it.requiredQty,
    0
  );
  const totalAllocated = evaluatedItems.reduce(
    (acc, it) => acc + it.allocatedQty,
    0
  );
  const totalBackordered = evaluatedItems.reduce(
    (acc, it) => acc + it.backorderQty,
    0
  );

  const distinctShippingWarehouses = useMemo(() => {
    const set = new Set<string>();
    evaluatedItems.forEach((item) => {
      item.warehouses.forEach((wh) => {
        if (wh.allocatedQty > 0) {
          set.add(wh.warehouseId);
        }
      });
    });
    return set.size || (warehouses.length > 0 ? 1 : 0);
  }, [evaluatedItems, warehouses]);

  const handleWarehouseChange = (whId: string) => {
    setPrimaryWhId(whId);
    onSelectPrimaryWarehouse?.(whId);
  };

  const handlePrimaryAction = () => {
    const allocationsPayload: ItemWarehouseAllocationPayload[] = [];

    evaluatedItems.forEach((item) => {
      item.warehouses.forEach((wh) => {
        if (wh.allocatedQty > 0) {
          allocationsPayload.push({
            productId: item.productId,
            warehouseId: wh.warehouseId,
            quantity: wh.allocatedQty,
          });
        }
      });
    });

    if (activeMode === "Manual Override" || onConfirmOverride) {
      onConfirmOverride?.(allocationsPayload, primaryWhId || undefined);
    } else {
      onAcceptSplit?.();
    }
  };

  const warehouseOptions = warehouses.map((w) => ({
    key: w.id,
    value: `${w.name}${w.country ? ` (${w.country})` : ""}`,
  }));

  return (
    <Card
      className={clsx(
        "rounded-2xl border border-border bg-card shadow-xs overflow-hidden",
        className
      )}
    >
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <CardTitle className="text-lg font-bold text-text-primary">
              {activeMode === "Manual Override"
                ? "Manual Inventory Allocation"
                : "Recommended Fulfillment Plan"}
            </CardTitle>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {activeMode === "Manual Override"
              ? "Specify exact stock allocations per warehouse for each line item."
              : "Intelligent auto-split based on live warehouse stock availability."}
          </p>
        </div>

        {/* Mode Toggle & Primary Warehouse */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
          {warehouses.length > 0 && (
            <div className="w-52">
              <Select
                value={primaryWhId}
                onChange={handleWarehouseChange}
                options={warehouseOptions}
                placeholder="Select Default Hub"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode("Suggested")}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeMode === "Suggested"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Suggested</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("Manual Override")}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeMode === "Manual Override"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Override</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Line Items List */}
        {evaluatedItems.length === 0 ? (
          <div className="py-8 text-center text-text-muted bg-surface rounded-xl border border-dashed border-border">
            No line items available for fulfillment allocation.
          </div>
        ) : (
          evaluatedItems.map((item, idx) => {
            const isFullyAllocated = item.allocatedQty >= item.requiredQty;
            const isPartial =
              item.allocatedQty > 0 && item.allocatedQty < item.requiredQty;
            const isOutOfStock = item.allocatedQty === 0;

            const totalStockInCompany = item.warehouses.reduce(
              (sum, w) => sum + w.availableQty,
              0
            );

            return (
              <div
                key={item.productId || idx}
                className="space-y-4 p-5 rounded-xl bg-surface/40 border border-border/80"
              >
                {/* Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary">
                        {item.productName}
                      </span>
                      {item.productType && (
                        <Badge
                          variant={
                            item.productType.includes("Recurring")
                              ? "purple"
                              : "secondary"
                          }
                        >
                          {item.productType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-3">
                      <span>
                        Required:{" "}
                        <strong className="text-text-primary">
                          {item.requiredQty} units
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Company Stock:{" "}
                        <strong
                          className={
                            totalStockInCompany >= item.requiredQty
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }
                        >
                          {totalStockInCompany} available
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Allocation Status Pill */}
                  <div className="shrink-0">
                    {isFullyAllocated ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fully Allocated ({item.allocatedQty} units)</span>
                      </span>
                    ) : isPartial ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {item.allocatedQty} Allocated · {item.backorderQty} Backordered
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-danger border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          Out of Stock ({item.requiredQty} units Backorder)
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Warehouse Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.warehouses.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-xs text-text-muted bg-card rounded-lg border border-dashed border-border">
                      No warehouses found in company.
                    </div>
                  ) : (
                    item.warehouses.map((wh) => {
                      const hasStock = wh.availableQty > 0;
                      const isAllocatedFromHere = wh.allocatedQty > 0;

                      return (
                        <div
                          key={wh.warehouseId}
                          className={clsx(
                            "p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors",
                            isAllocatedFromHere
                              ? "bg-card border-brand-500/40 shadow-xs"
                              : "bg-card/60 border-border opacity-85"
                          )}
                        >
                          {/* Warehouse Title */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-xs font-bold text-text-primary">
                                {wh.warehouseName}
                              </h5>
                              <p className="text-[11px] text-text-muted truncate max-w-[180px]">
                                {wh.location || "Warehouse Hub"}
                              </p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-surface border border-border/50 text-text-muted shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Quantities Row */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                            <div className="p-2 rounded-lg bg-surface/80 border border-border/60">
                              <span className="text-[10px] text-text-muted font-semibold uppercase block">
                                In Stock
                              </span>
                              <span
                                className={clsx(
                                  "font-bold",
                                  hasStock
                                    ? "text-text-primary"
                                    : "text-text-muted"
                                )}
                              >
                                {wh.availableQty}
                              </span>
                            </div>
                            <div
                              className={clsx(
                                "p-2 rounded-lg border",
                                isAllocatedFromHere
                                  ? "bg-brand-50/60 border-brand-200 text-brand-700"
                                  : "bg-surface/80 border-border/60 text-text-muted"
                              )}
                            >
                              <span className="text-[10px] font-semibold uppercase block">
                                Allocate
                              </span>
                              <span className="font-bold">
                                {wh.allocatedQty}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-surface/80 border border-border/60">
                              <span className="text-[10px] text-text-muted font-semibold uppercase block">
                                After
                              </span>
                              <span className="font-semibold text-text-secondary">
                                {wh.remainingQty}
                              </span>
                            </div>
                          </div>

                          {/* Manual Override Allocation Input */}
                          {activeMode === "Manual Override" && (
                            <div className="space-y-1 pt-1 border-t border-border/40">
                              <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
                                <span>Allocate units:</span>
                                <span className="text-[10px] text-text-muted">
                                  Max: {wh.availableQty}
                                </span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={wh.availableQty}
                                value={
                                  overrideMap[item.productId]?.[
                                    wh.warehouseId
                                  ] ?? ""
                                }
                                onChange={(e) =>
                                  handleAllocationInputChange(
                                    item.productId,
                                    wh.warehouseId,
                                    e.target.value
                                  )
                                }
                                disabled={wh.availableQty === 0}
                                placeholder="0"
                                className="w-full px-2.5 py-1.5 text-xs font-semibold text-text-primary bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-40"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Global Summary Banner */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-emerald-950 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">
              Total Order Required
            </span>
            <span className="text-xl font-bold text-emerald-800">
              {totalRequired} units
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">
              To Deliver Now
            </span>
            <span className="text-xl font-bold text-emerald-700">
              {totalAllocated} units
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">
              Backordered Units
            </span>
            <span
              className={clsx(
                "text-xl font-bold",
                totalBackordered > 0 ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {totalBackordered} units
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-emerald-800">
              Shipping Hubs
            </span>
            <span className="text-xl font-bold text-emerald-800">
              {distinctShippingWarehouses} warehouse
              {distinctShippingWarehouses !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          disabled={isSubmitting || totalAllocated === 0}
          onClick={handlePrimaryAction}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              <span>Processing Fulfillment & Allocations...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                {totalBackordered > 0
                  ? `Fulfill ${totalAllocated} Units (${totalBackordered} Backordered)`
                  : "Accept Allocation & Fulfill Entire Order"}
              </span>
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
};

export default FulfillmentPlanAllocation;
