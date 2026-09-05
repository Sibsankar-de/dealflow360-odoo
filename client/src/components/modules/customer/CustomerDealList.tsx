"use client";

import React from "react";
import { CustomerDealItem } from "@/types/customer";
import { CustomerDealCard } from "./CustomerDealCard";

interface CustomerDealListProps {
  deals: CustomerDealItem[];
  onView: (deal: CustomerDealItem) => void;
  onCloseDeal: (deal: CustomerDealItem) => void;
}

export function CustomerDealList({
  deals,
  onView,
  onCloseDeal,
}: CustomerDealListProps) {
  if (deals.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-text-muted">
        <p className="text-base font-semibold text-text-primary">
          No active deals
        </p>
        <p className="text-sm mt-1">
          All active deals have been concluded or closed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deals.map((deal) => (
        <CustomerDealCard
          key={deal.id}
          deal={deal}
          onView={onView}
          onClose={onCloseDeal}
        />
      ))}
    </div>
  );
}

export default CustomerDealList;
