"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { FulfillmentSummaryCards } from "@/components/modules/fulfillment/FulfillmentSummaryCards";
import { FulfillmentOrdersTable } from "@/components/modules/fulfillment/FulfillmentOrdersTable";
import { FulfillmentKPI, FulfillmentOrder } from "@/types/fulfillment";

const INITIAL_KPI: FulfillmentKPI = {
  readyToFulfillCount: 1,
  partiallyFulfilledCount: 1,
  backorderedCount: 1,
  completedCount: 1,
};

const INITIAL_ORDERS: FulfillmentOrder[] = [
  {
    id: "ord_1042",
    orderNumber: "SO-1042",
    customerName: "Acme Corporation",
    itemsCount: 3,
    totalQty: 10,
    qtyUnit: "units",
    warehousesCount: 2,
    shipmentsCount: 2,
    status: "Ready to Fulfill",
    requiredBy: "10 Sep 2026",
  },
  {
    id: "ord_1039",
    orderNumber: "SO-1039",
    customerName: "Apex Technologies",
    itemsCount: 2,
    totalQty: 15,
    qtyUnit: "units",
    warehousesCount: 2,
    shipmentsCount: 2,
    status: "Partially Fulfilled",
    requiredBy: "8 Sep 2026",
  },
  {
    id: "ord_1038",
    orderNumber: "SO-1038",
    customerName: "Zenith Corp",
    itemsCount: 1,
    totalQty: 5,
    qtyUnit: "units",
    warehousesCount: 1,
    shipmentsCount: 1,
    status: "Fulfilled",
    requiredBy: "5 Sep 2026",
  },
  {
    id: "ord_1036",
    orderNumber: "SO-1036",
    customerName: "Beta Industries",
    itemsCount: 2,
    totalQty: 3,
    qtyUnit: "units",
    warehousesCount: 1,
    shipmentsCount: 1,
    status: "Backordered",
    requiredBy: "12 Sep 2026",
    isUrgentDate: true,
  },
];

export default function FulfillmentPage() {
  const [kpi] = useState<FulfillmentKPI>(INITIAL_KPI);
  const [orders] = useState<FulfillmentOrder[]>(INITIAL_ORDERS);

  const mockUser = {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    platformRole: "User",
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Fulfillment
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Warehouse allocation and shipment tracking for confirmed orders.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <FulfillmentSummaryCards kpi={kpi} />

      {/* Orders Table Container */}
      <FulfillmentOrdersTable orders={orders} />
    </main>
  );
}
