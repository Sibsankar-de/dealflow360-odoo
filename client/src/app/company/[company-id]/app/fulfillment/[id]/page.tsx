"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FulfillmentDetailHeader } from "@/components/modules/fulfillment/FulfillmentDetailHeader";
import { FulfillmentOrderItemsTable } from "@/components/modules/fulfillment/FulfillmentOrderItemsTable";
import { FulfillmentPlanAllocation } from "@/components/modules/fulfillment/FulfillmentPlanAllocation";
import {
  FulfillmentOrderDetail,
  FulfillmentOrderItem,
  FulfillmentStatus,
  RecommendedFulfillmentPlan,
  WarehouseAllocation,
} from "@/types/fulfillment";
import {
  useGetQuotationByIdQuery,
  useFulfillQuotationMutation,
} from "@/store/features/quotation/quotationApi";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function FulfillmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params["company-id"] as string;
  const id = params["id"] as string;

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
    { companyId },
    { skip: !companyId }
  );

  // Fulfillment Mutation
  const [fulfillQuotation, { isLoading: isFulfilling }] =
    useFulfillQuotationMutation();

  const quotation = quotationData?.data?.quotation;
  const warehouses = warehousesData?.data?.warehouses || [];
  const products = productsData?.data?.products || [];

  // Build the live fulfillment order detail
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

    const items: FulfillmentOrderItem[] = (quotation.items || []).map((it) => ({
      id: it.id,
      productName: it.productName || "Product",
      productType: "Hardware",
      requiredQty: Number(it.quantity) || 0,
      weight: `${quotation.currency || "USD"} ${Number(it.lineTotal || 0).toLocaleString()} (${it.quantity} × ${quotation.currency || "USD"} ${it.unitPrice})`,
    }));

    // Primary product line to allocate
    const primaryItem = quotation.items?.[0];
    const targetQty = primaryItem ? Number(primaryItem.quantity) || 0 : totalQty;
    const productName = primaryItem?.productName || "Order Line Items";
    const productId = primaryItem?.productId || "";

    // Find the product in product list to get per-warehouse stock records
    const fullProduct = products.find((p) => p.id === productId);

    // Compute warehouse allocations
    let remainingNeeded = targetQty;
    const warehouseAllocations: WarehouseAllocation[] = warehouses.map((wh, idx) => {
      // Find stock in this warehouse
      const stockEntry = fullProduct?.stocks?.find(
        (s) => s.warehouseId === wh.id
      );
      const availableQty = stockEntry
        ? Number(stockEntry.stockQty) || 0
        : (fullProduct?.totalStock ? Math.floor(fullProduct.totalStock / (warehouses.length || 1)) : 10);

      // Auto suggested split
      const allocatedQty = Math.min(availableQty, Math.max(0, remainingNeeded));
      remainingNeeded -= allocatedQty;

      return {
        id: wh.id,
        name: wh.name,
        location: `${wh.addressLine || ""}, ${wh.country || ""}`.replace(/^,\s*|,\s*$/g, "") || "Warehouse",
        availableQty,
        allocatedQty,
        remainingQty: Math.max(0, availableQty - allocatedQty),
        shippingEstimate: 500 + idx * 200,
        currencySymbol: quotation.currency === "INR" ? "₹" : "$",
      };
    });

    const totalAllocated = warehouseAllocations.reduce((sum, w) => sum + w.allocatedQty, 0);
    const shipmentsCount = warehouseAllocations.filter((w) => w.allocatedQty > 0).length || 1;
    const estShippingCost = warehouseAllocations
      .filter((w) => w.allocatedQty > 0)
      .reduce((sum, w) => sum + w.shippingEstimate, 0);

    const fulfillmentPlan: RecommendedFulfillmentPlan = {
      productId,
      productName,
      targetQty,
      mode: "Suggested",
      totalRequired: targetQty,
      totalAllocated,
      shipmentsCount,
      estShippingCost,
      warehouses: warehouseAllocations,
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
      shipmentsCount: latestSalesOrder?.deliveriesCount || shipmentsCount,
      status,
      requiredBy,
      isUrgentDate,
      items,
      fulfillmentPlan,
    };
  }, [quotation, warehouses, products]);

  // Execute Fulfillment Action
  const executeFulfillment = async (
    warehouseOverrides?: Record<string, number>
  ) => {
    if (!quotation) return;

    try {
      setNotification(null);

      // Build items array with warehouse allocations
      const itemsPayload: Array<{
        productId: string;
        warehouseId?: string;
        quantity?: number;
      }> = [];

      const primaryItem = quotation.items?.[0];

      if (warehouseOverrides && Object.keys(warehouseOverrides).length > 0) {
        Object.entries(warehouseOverrides).forEach(([whId, qty]) => {
          if (qty > 0 && primaryItem) {
            itemsPayload.push({
              productId: primaryItem.productId,
              warehouseId: whId,
              quantity: qty,
            });
          }
        });
      } else if (orderDetail?.fulfillmentPlan?.warehouses) {
        orderDetail.fulfillmentPlan.warehouses.forEach((wh) => {
          if (wh.allocatedQty > 0 && primaryItem) {
            itemsPayload.push({
              productId: primaryItem.productId,
              warehouseId: wh.id,
              quantity: wh.allocatedQty,
            });
          }
        });
      }

      // Default warehouse
      const defaultWarehouseId =
        itemsPayload[0]?.warehouseId || warehouses[0]?.id;

      const res = await fulfillQuotation({
        companyId,
        id: quotation.id,
        data: {
          warehouseId: defaultWarehouseId,
          items: itemsPayload.length > 0 ? itemsPayload : undefined,
          notes: `Fulfillment generated for ${quotation.quotationNo}`,
        },
      }).unwrap();

      setNotification({
        type: "success",
        message: `Fulfillment processed successfully for ${quotation.quotationNo}! Stock deducted, delivery created, and invoice generated.`,
      });

      setTimeout(() => {
        router.push(`/company/${companyId}/app/fulfillment`);
      }, 2500);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to fulfill quotation. Please check warehouse stock and try again.";
      setNotification({
        type: "error",
        message: errorMsg,
      });
    }
  };

  const handleAcceptSplit = () => {
    executeFulfillment();
  };

  const handleConfirmOverride = (allocations: Record<string, number>) => {
    executeFulfillment(allocations);
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
          <h2 className="text-xl font-bold text-text-primary">Quotation Not Found</h2>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            The requested quotation could not be loaded or is not available for fulfillment in this company.
          </p>
          <Link href={`/company/${companyId}/app/fulfillment`}>
            <Button variant="outline" size="sm" className="mt-2 inline-flex items-center gap-2">
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
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-success"
              : "bg-red-50 border-red-200 text-danger"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Detail Header & Order Info Card */}
      <FulfillmentDetailHeader order={orderDetail} companyId={companyId} />

      {/* Order Items Table */}
      <FulfillmentOrderItemsTable items={orderDetail.items} />

      {/* Recommended Fulfillment Plan & Warehouse Allocations */}
      <FulfillmentPlanAllocation
        plan={orderDetail.fulfillmentPlan}
        onAcceptSplit={handleAcceptSplit}
        onConfirmOverride={handleConfirmOverride}
        isSubmitting={isFulfilling}
      />
    </main>
  );
}
