"use client";

import React, { useState } from "react";
import { QuotationItem } from "@/types/quotation";
import { QuotationKanbanBoard } from "@/components/modules/quotations/QuotationKanbanBoard";
import { Button } from "@/components/ui/Button";
import { Plus, LayoutGrid, Table, CheckCircle2 } from "lucide-react";

const INITIAL_QUOTATIONS: QuotationItem[] = [
  {
    id: "q_01",
    quotationNumber: "QT-2025-001",
    customerName: "Acme Corp",
    totalAmount: 12400,
    currency: "USD",
    status: "Draft",
    createdAt: "2025-09-01",
  },
  {
    id: "q_02",
    quotationNumber: "QT-2025-002",
    customerName: "Delta LLC",
    totalAmount: 3200,
    currency: "USD",
    status: "Draft",
    createdAt: "2025-09-02",
  },
  {
    id: "q_03",
    quotationNumber: "QT-2025-003",
    customerName: "Beta Industries",
    totalAmount: 28900,
    currency: "USD",
    status: "Pending Approval",
    createdAt: "2025-09-03",
  },
  {
    id: "q_04",
    quotationNumber: "QT-2025-004",
    customerName: "Nova Retail",
    totalAmount: 9750,
    currency: "USD",
    status: "Approved",
    createdAt: "2025-09-03",
  },
  {
    id: "q_05",
    quotationNumber: "QT-2025-005",
    customerName: "Zenith Co",
    totalAmount: 15300,
    currency: "USD",
    status: "Negotiation",
    createdAt: "2025-09-04",
  },
  {
    id: "q_06",
    quotationNumber: "QT-2025-006",
    customerName: "Orion Ltd",
    totalAmount: 41000,
    currency: "USD",
    status: "Confirmed",
    createdAt: "2025-09-04",
  },
];

export default function CompanyQuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationItem[]>(INITIAL_QUOTATIONS);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSelectedNotification(msg);
    setTimeout(() => setSelectedNotification(null), 3500);
  };

  const handleSelectQuotation = (item: QuotationItem) => {
    showNotification(`Opened quotation for ${item.customerName} (${item.quotationNumber})`);
  };

  const handleNewQuotation = () => {
    showNotification("Opening new quotation creator wizard...");
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "kanban" ? "table" : "kanban"));
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Quotations ({viewMode === "kanban" ? "List" : "Table"})
        </h1>
        <p className="text-sm text-text-secondary">
          Every quotation in the system, one row per quotation, click a row to open it
        </p>
      </div>

      {selectedNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{selectedNotification}</span>
        </div>
      )}

      {/* Main Board View in Light Mode */}
      {viewMode === "kanban" ? (
        <QuotationKanbanBoard
          quotations={quotations}
          onSelectQuotation={handleSelectQuotation}
        />
      ) : (
        <div className="p-12 border border-border rounded-2xl bg-card text-center">
          <p className="text-sm text-text-secondary">Table view mode</p>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="primary"
          onClick={handleNewQuotation}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-semibold px-5 py-2.5 rounded-xl shadow-xs"
        >
          + New Quotation
        </Button>

        <Button
          variant="outline"
          onClick={toggleViewMode}
          leftIcon={
            viewMode === "kanban" ? (
              <Table className="w-4 h-4 text-text-muted" />
            ) : (
              <LayoutGrid className="w-4 h-4 text-text-muted" />
            )
          }
          className="border border-border text-text-primary hover:bg-card px-4 py-2.5 rounded-xl"
        >
          {viewMode === "kanban" ? "Switch to Table View" : "Switch to Kanban View"}
        </Button>
      </div>
    </div>
  );
}
