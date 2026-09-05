"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/modules/layout/Navbar";
import { FulfillmentDetailHeader } from "@/components/modules/fulfillment/FulfillmentDetailHeader";
import { FulfillmentOrderItemsTable } from "@/components/modules/fulfillment/FulfillmentOrderItemsTable";
import { FulfillmentPlanAllocation } from "@/components/modules/fulfillment/FulfillmentPlanAllocation";
import { FulfillmentOrderDetail } from "@/types/fulfillment";
import { CheckCircle2 } from "lucide-react";

const MOCK_ORDER_DETAILS: Record<string, FulfillmentOrderDetail> = {
  "SO-1042": {
    id: "ord_1042",
    orderNumber: "SO-1042",
    customerName: "Acme Corporation",
    quotationRef: "QT-2026-1042",
    itemsCount: 3,
    totalQty: 10,
    qtyUnit: "units",
    warehousesCount: 2,
    shipmentsCount: 2,
    status: "Ready to Fulfill",
    requiredBy: "10 Sep 2026",
    items: [
      {
        id: "item_1",
        productName: "Laptop Pro 14",
        productType: "Hardware",
        requiredQty: 10,
        weight: "15 kg total",
      },
      {
        id: "item_2",
        productName: "Professional Setup Service",
        productType: "Service",
        requiredQty: 1,
        weight: "N/A",
      },
    ],
    fulfillmentPlan: {
      productId: "prod_laptop_14",
      productName: "Laptop Pro 14",
      targetQty: 10,
      mode: "Suggested",
      totalRequired: 10,
      totalAllocated: 10,
      shipmentsCount: 2,
      estShippingCost: 1200,
      warehouses: [
        {
          id: "wh_main",
          name: "Main Warehouse",
          location: "Mumbai, MH",
          availableQty: 24,
          allocatedQty: 6,
          remainingQty: 18,
          shippingEstimate: 500,
          currencySymbol: "₹",
        },
        {
          id: "wh_east",
          name: "East Depot",
          location: "Kolkata, WB",
          availableQty: 12,
          allocatedQty: 4,
          remainingQty: 8,
          shippingEstimate: 700,
          currencySymbol: "₹",
        },
      ],
    },
  },
};

const DEFAULT_ORDER_DETAIL = (id: string): FulfillmentOrderDetail => ({
  id: `ord_${id}`,
  orderNumber: id.startsWith("SO-") ? id : `SO-${id}`,
  customerName: "Acme Corporation",
  quotationRef: `QT-2026-${id}`,
  itemsCount: 2,
  totalQty: 10,
  qtyUnit: "units",
  warehousesCount: 2,
  shipmentsCount: 2,
  status: "Ready to Fulfill",
  requiredBy: "10 Sep 2026",
  items: [
    {
      id: "item_1",
      productName: "Laptop Pro 14",
      productType: "Hardware",
      requiredQty: 10,
      weight: "15 kg total",
    },
    {
      id: "item_2",
      productName: "Professional Setup Service",
      productType: "Service",
      requiredQty: 1,
      weight: "N/A",
    },
  ],
  fulfillmentPlan: {
    productId: "prod_laptop_14",
    productName: "Laptop Pro 14",
    targetQty: 10,
    mode: "Suggested",
    totalRequired: 10,
    totalAllocated: 10,
    shipmentsCount: 2,
    estShippingCost: 1200,
    warehouses: [
      {
        id: "wh_main",
        name: "Main Warehouse",
        location: "Mumbai, MH",
        availableQty: 24,
        allocatedQty: 6,
        remainingQty: 18,
        shippingEstimate: 500,
        currencySymbol: "₹",
      },
      {
        id: "wh_east",
        name: "East Depot",
        location: "Kolkata, WB",
        availableQty: 12,
        allocatedQty: 4,
        remainingQty: 8,
        shippingEstimate: 700,
        currencySymbol: "₹",
      },
    ],
  },
});

export default function FulfillmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [notification, setNotification] = useState<string | null>(null);

  const orderDetail = MOCK_ORDER_DETAILS[id] || DEFAULT_ORDER_DETAIL(id);

  const mockUser = {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    platformRole: "User",
  };

  const handleAcceptSplit = () => {
    setNotification(
      `Suggested split plan accepted for ${orderDetail.orderNumber}. Redirecting to fulfillment list...`
    );
    setTimeout(() => {
      router.push("/fulfillment");
    }, 2000);
  };

  const handleConfirmOverride = () => {
    setNotification(
      `Manual override allocation confirmed for ${orderDetail.orderNumber}. Redirecting to fulfillment list...`
    );
    setTimeout(() => {
      router.push("/fulfillment");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="company" user={mockUser} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>{notification}</span>
          </div>
        )}

        {/* Detail Header & Order Info Card */}
        <FulfillmentDetailHeader order={orderDetail} />

        {/* Order Items Table */}
        <FulfillmentOrderItemsTable items={orderDetail.items} />

        {/* Recommended Fulfillment Plan & Warehouse Allocations */}
        <FulfillmentPlanAllocation
          plan={orderDetail.fulfillmentPlan}
          onAcceptSplit={handleAcceptSplit}
          onConfirmOverride={handleConfirmOverride}
        />
      </main>
    </div>
  );
}
