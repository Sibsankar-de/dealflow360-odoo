"use client";

import React from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomerDealItem } from "@/types/customer";

interface CustomerDealCardProps {
  deal: CustomerDealItem;
  onView: (deal: CustomerDealItem) => void;
  onClose: (deal: CustomerDealItem) => void;
}

export function CustomerDealCard({
  deal,
  onView,
  onClose,
}: CustomerDealCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs hover:border-brand-500/40 hover:shadow-sm transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Deal Name & ID */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <h3 className="font-bold text-text-primary text-base sm:text-lg leading-snug">
          {deal.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-text-secondary bg-surface px-2.5 py-0.5 rounded border border-border">
            ID: {deal.dealNo}
          </span>
        </div>
      </div>

      {/* Right: Actions (First View, Then Close) */}
      <div className="flex items-center gap-2.5 sm:shrink-0">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={() => onView(deal)}
          className="w-full sm:w-auto hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200"
        >
          View
        </Button>

        <Button
          variant="outline"
          size="md"
          leftIcon={<X className="w-4 h-4 text-danger" />}
          onClick={() => onClose(deal)}
          className="w-full sm:w-auto text-danger hover:bg-danger/10 hover:border-danger/30 hover:text-danger"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export default CustomerDealCard;
