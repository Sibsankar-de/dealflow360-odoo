"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";
import { CustomerDealItem } from "@/types/customer";
import { DealStage, DealStatus } from "@/types/deal";
import { CustomerDealList } from "@/components/modules/customer/CustomerDealList";
import { CustomerDealDetailsModal } from "@/components/modules/customer/CustomerDealDetailsModal";
import { CloseCustomerDealModal } from "@/components/modules/customer/CloseCustomerDealModal";

export default function CustomerDealsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const activeCompanyName =
    companyData?.data?.company?.name || "DealFlow360 Partner";

  // Initial 3 mock deals
  const initialMockDeals: CustomerDealItem[] = useMemo(
    () => [
      {
        id: "deal_cust_01",
        dealNo: "DL-2026-104",
        name: "Enterprise Cloud ERP Migration & Multi-Tier Licensing",
        companyName: activeCompanyName,
        expiryDate: "2026-10-15",
        expectedValue: 48500,
        stage: "QUOTATION",
        status: "OPEN",
        probability: 75,
        quotationsCount: 2,
        description:
          "Comprehensive cloud infrastructure deployment and multi-tier ERP software licensing proposal.",
      },
      {
        id: "deal_cust_02",
        dealNo: "DL-2026-089",
        name: "Warehouse Automation Hardware & Fulfillment System",
        companyName: activeCompanyName,
        expiryDate: "2026-11-01",
        expectedValue: 92000,
        stage: "NEGOTIATION",
        status: "OPEN",
        probability: 60,
        quotationsCount: 3,
        description:
          "Automated fulfillment sorting equipment, barcode scanners, and inventory management integration.",
      },
      {
        id: "deal_cust_03",
        dealNo: "DL-2026-042",
        name: "Q4 Cybersecurity Operations & Dedicated Support Retainer",
        companyName: activeCompanyName,
        expiryDate: "2026-12-20",
        expectedValue: 31200,
        stage: "WON",
        status: "WON",
        probability: 100,
        quotationsCount: 1,
        description:
          "Annual dedicated security monitoring, automated backups, and 24/7 technical incident support.",
      },
    ],
    [activeCompanyName]
  );

  const [dealsList, setDealsList] = useState<CustomerDealItem[]>(initialMockDeals);
  const [selectedDeal, setSelectedDeal] = useState<CustomerDealItem | null>(null);
  const [closingDeal, setClosingDeal] = useState<CustomerDealItem | null>(null);
  const [closedNotice, setClosedNotice] = useState<string | null>(null);

  const handleConfirmClose = () => {
    if (!closingDeal) return;
    const dealName = closingDeal.name;
    setDealsList((prev) => prev.filter((d) => d.id !== closingDeal.id));
    setClosingDeal(null);
    setClosedNotice(`Deal "${dealName}" has been successfully closed.`);
    setTimeout(() => setClosedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Active Deals
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Track open commercial deals and ongoing proposals with{" "}
          <span className="font-semibold text-text-primary">{activeCompanyName}</span>.
        </p>
      </div>

      {closedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center justify-between">
          <span>{closedNotice}</span>
          <button
            type="button"
            onClick={() => setClosedNotice(null)}
            className="text-success hover:opacity-75 cursor-pointer font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <CustomerDealList
        deals={dealsList}
        onView={setSelectedDeal}
        onCloseDeal={setClosingDeal}
      />

      <CustomerDealDetailsModal
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />

      <CloseCustomerDealModal
        deal={closingDeal}
        isOpen={Boolean(closingDeal)}
        onClose={() => setClosingDeal(null)}
        onConfirm={handleConfirmClose}
      />
    </div>
  );
}
