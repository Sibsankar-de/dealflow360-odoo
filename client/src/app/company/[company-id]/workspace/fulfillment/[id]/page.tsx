"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FulfillmentDetailHeader } from "@/components/modules/fulfillment/FulfillmentDetailHeader";
import { FulfillmentOrderItemsTable } from "@/components/modules/fulfillment/FulfillmentOrderItemsTable";
import {
  FulfillmentPlanAllocation,
  ItemWarehouseAllocationPayload,
} from "@/components/modules/fulfillment/FulfillmentPlanAllocation";
import {
  FulfillmentOrderDetail,
  FulfillmentOrderItem,
  FulfillmentStatus,
  RecommendedFulfillmentPlan,
  ItemFulfillmentPlan,
  ProductWarehouseStock,
} from "@/types/fulfillment";
import {
  useGetQuotationByIdQuery,
  useFulfillQuotationMutation,
} from "@/store/features/quotation/quotationApi";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function FulfillmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params["company-id"] as string;
  const id = params["id"] as string;

  // RTK Queries
  const {
    data: quotationData,
    isLoading: isLoadingQuotation,
    error: quotationError,
  } = useGetQuotationByIdQuery(
    { companyId, id },
    { skip: !companyId || !id }
  );

  const { data: warehousesData, isLoading: isLoadingWarehouses } =
    useGetWarehousesQuery({ companyId }, { skip: !companyId });

  const { data: productsData } = useGetProductsQuery(
    { companyId, params: { limit: 100 } },
    { skip: !companyId }
  );

  // Fulfillment Mutation
  const [fulfillQuotation, { isLoading: isFulfilling }] =
    useFulfillQuotationMutation();

  const quotation = quotationData?.data?.quotation;
  const warehouses = warehousesData?.data?.warehouses || [];
  const products = productsData?.data?.products || [];

  const [selectedPrimaryWhId, setSelectedPrimaryWhId] = useState<string>("");

  // Build the live fulfillment order detail with real warehouse stock allocations
  const orderDetail: FulfillmentOrderDetail | null = useMemo(() => {
    if (!quotation) return null;

    const latestSalesOrder = quotation.salesOrders?.[0];
    let status: FulfillmentStatus = "Ready to Fulfill";

    if (latestSalesOrder?.status === "DELIVERED") {
      status = "Fulfilled";
    } else if ((latestSalesOrder?.backordersCount || 0) > 0) {
      status = "Backordered";
    } else if (latestSalesOrder?.status === "PARTIALLY_DELIVERED") {
      status = "Partially Fulfilled";
    }

    const totalQty = (quotation.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    let requiredBy = "Not specified";
    let isUrgentDate = false;

    if (quotation.validUntil) {
      const validDate = new Date(quotation.validUntil);
      requiredBy = validDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const diffMs = validDate.getTime() - Date.now();
      if (diffMs > 0 && diffMs < 3 * 24 * 60 * 60 * 1000) {
        isUrgentDate = true;
      }
    }

    // Map order items
    const items: FulfillmentOrderItem[] = (quotation.items || []).map((it) => {
      const matchedProd = products.find((p) => p.id === it.productId);
      const isRecurring = matchedProd?.type === "RECURRING";

      return {
        id: it.id,
        productName: it.productName || "Product",
        productType: isRecurring
          ? "Recurring Subscription"
          : "Hardware / One-Time",
        requiredQty: Number(it.quantity) || 0,
        weight: `${quotation.currency || "USD"} ${Number(
          it.lineTotal || 0
        ).toLocaleString()} (${it.quantity} × ${quotation.currency || "USD"} ${
          it.unitPrice
        })`,
      };
    });

    // Compute real warehouse allocations across all quotation items
    const itemPlans: ItemFulfillmentPlan[] = (quotation.items || []).map(
      (it) => {
        const matchedProd = products.find((p) => p.id === it.productId);
        const isRecurring = matchedProd?.type === "RECURRING";
        const requiredQty = Number(it.quantity) || 0;
        let remainingNeeded = requiredQty;

        const warehouseStocks: ProductWarehouseStock[] = warehouses.map(
          (wh) => {
            const stockEntry = matchedProd?.stocks?.find(
              (s) => s.warehouseId === wh.id
            );
            // Real available stock count - 0 if not allocated in warehouse
            const availableQty = stockEntry
              ? Number(stockEntry.stockQty) || 0
              : 0;

            const allocatedQty = Math.min(
              availableQty,
              Math.max(0, remainingNeeded)
            );
            remainingNeeded -= allocatedQty;

            const remainingQty = Math.max(0, availableQty - allocatedQty);
            const location =
              [wh.addressLine, wh.country].filter(Boolean).join(", ") ||
              "Warehouse Hub";

            return {
              warehouseId: wh.id,
              warehouseName: wh.name,
              location,
              availableQty,
              allocatedQty,
              remainingQty,
            };
          }
        );

        const allocatedTotal = warehouseStocks.reduce(
          (sum, w) => sum + w.allocatedQty,
          0
        );
        const backorderQty = Math.max(0, requiredQty - allocatedTotal);

        return {
          productId: it.productId,
          productName: it.productName || "Order Item",
          productType: isRecurring
            ? "Recurring Subscription"
            : "Hardware / One-Time",
          requiredQty,
          allocatedQty: allocatedTotal,
          backorderQty,
          warehouses: warehouseStocks,
        };
      }
    );

    const totalRequired = itemPlans.reduce(
      (sum, p) => sum + p.requiredQty,
      0
    );
    const totalAllocated = itemPlans.reduce(
      (sum, p) => sum + p.allocatedQty,
      0
    );
    const totalBackordered = itemPlans.reduce(
      (sum, p) => sum + p.backorderQty,
      0
    );

    const shippingWarehouses = new Set<string>();
    itemPlans.forEach((it) => {
      it.warehouses.forEach((wh) => {
        if (wh.allocatedQty > 0) {
          shippingWarehouses.add(wh.warehouseId);
        }
      });
    });

    const fulfillmentPlan: RecommendedFulfillmentPlan = {
      mode: "Suggested",
      currency: quotation.currency || "USD",
      items: itemPlans,
      totalRequired,
      totalAllocated,
      totalBackordered,
      shipmentsCount: shippingWarehouses.size || 1,
      primaryWarehouseId: selectedPrimaryWhId || warehouses[0]?.id,
    };

    return {
      id: quotation.id,
      orderNumber: quotation.quotationNo,
      customerName:
        quotation.customer?.userName ||
        quotation.customer?.email ||
        "Customer",
      quotationRef: quotation.quotationNo,
      itemsCount: quotation.items?.length || 0,
      totalQty,
      qtyUnit: "units",
      warehousesCount: warehouses.length || 1,
      shipmentsCount: latestSalesOrder?.deliveriesCount || shippingWarehouses.size || 1,
      status,
      requiredBy,
      isUrgentDate,
      items,
      fulfillmentPlan,
    };
  }, [quotation, warehouses, products, selectedPrimaryWhId]);

  // Execute Fulfillment Action
  const executeFulfillment = async (
    allocationsOverride?: ItemWarehouseAllocationPayload[],
    customPrimaryWhId?: string
  ) => {
    if (!quotation) return;

    try {
      let itemsPayload: Array<{
        productId: string;
        warehouseId?: string;
        quantity?: number;
      }> = [];

      if (allocationsOverride && allocationsOverride.length > 0) {
        itemsPayload = allocationsOverride.filter((a) => a.quantity > 0);
      } else if (orderDetail?.fulfillmentPlan?.items) {
        orderDetail.fulfillmentPlan.items.forEach((item) => {
          item.warehouses.forEach((wh) => {
            if (wh.allocatedQty > 0) {
              itemsPayload.push({
                productId: item.productId,
                warehouseId: wh.warehouseId,
                quantity: wh.allocatedQty,
              });
            }
          });
        });
      }

      const defaultWarehouseId =
        customPrimaryWhId ||
        selectedPrimaryWhId ||
        itemsPayload[0]?.warehouseId ||
        warehouses[0]?.id;

      const res = await fulfillQuotation({
        companyId,
        id: quotation.id,
        data: {
          warehouseId: defaultWarehouseId,
          items: itemsPayload.length > 0 ? itemsPayload : undefined,
          notes: `Fulfillment processed for ${quotation.quotationNo}`,
        },
      }).unwrap();

      const createdSub = (res as any)?.data?.subscription;
      if (createdSub) {
        toast.success(
          `Fulfillment processed for ${quotation.quotationNo}! Stock deducted, delivery created, invoice generated, and subscription ${createdSub.subscriptionNo} created.`
        );
      } else {
        toast.success(
          `Fulfillment processed successfully for ${quotation.quotationNo}! Stock deducted, delivery created, and invoice generated.`
        );
      }

      setTimeout(() => {
        router.push(`/company/${companyId}/workspace/fulfillment`);
      }, 1500);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to fulfill quotation. Please check warehouse stock and try again.";
      toast.error(errorMsg);
    }
  };

  const handleAcceptSplit = () => {
    executeFulfillment();
  };

  const handleConfirmOverride = (
    allocations: ItemWarehouseAllocationPayload[],
    primaryWhId?: string
  ) => {
    executeFulfillment(allocations, primaryWhId);
  };

  if (isLoadingQuotation || isLoadingWarehouses) {
    return (
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="h-6 w-32 bg-card animate-pulse rounded-lg" />
        <div className="h-32 bg-card animate-pulse rounded-2xl" />
        <div className="h-64 bg-card animate-pulse rounded-2xl" />
        <div className="h-80 bg-card animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (quotationError || !orderDetail) {
    return (
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-xl font-bold text-text-primary">
            Quotation Not Found
          </h2>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            The requested quotation could not be loaded or is not available for fulfillment in this company.
          </p>
          <Link href={`/company/${companyId}/workspace/fulfillment`}>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Fulfillment</span>
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Detail Header & Order Info Card */}
      <FulfillmentDetailHeader order={orderDetail} companyId={companyId} />

      {/* Order Items Table */}
      <FulfillmentOrderItemsTable items={orderDetail.items} />

      {/* Recommended Fulfillment Plan & Real Warehouse Allocations */}
      {orderDetail.status !== "Fulfilled" ? (
        <FulfillmentPlanAllocation
          plan={orderDetail.fulfillmentPlan}
          warehouses={warehouses}
          selectedWarehouseId={selectedPrimaryWhId || warehouses[0]?.id}
          onSelectPrimaryWarehouse={setSelectedPrimaryWhId}
          onAcceptSplit={handleAcceptSplit}
          onConfirmOverride={handleConfirmOverride}
          isSubmitting={isFulfilling}
        />
      ) : (
        <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Order Fully Fulfilled
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                All line items for this quotation have been delivered and invoiced.
              </p>
            </div>
          </div>
          <Link href={`/company/${companyId}/workspace/fulfillment`}>
            <Button variant="outline" size="sm">
              Back to Fulfillment List
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
}
