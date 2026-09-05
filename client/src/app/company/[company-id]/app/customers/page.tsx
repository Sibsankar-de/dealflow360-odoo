"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { CustomerListTable } from "@/components/modules/customer/CustomerListTable";
import { CustomerDetailView } from "@/components/modules/customer/CustomerDetailView";
import { CreateCustomerModal } from "@/components/modules/customer/CreateCustomerModal";
import { CustomerItem } from "@/types/customer";
import { QuotationItem } from "@/types/quotation";
import { CheckCircle2 } from "lucide-react";

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: "cust_01",
    fullName: "Acme Corporation",
    email: "contact@acmecorp.com",
    phone: "+1 (555) 019-2834",
    organization: "Acme Group",
    status: "Active",
    createdAt: "2025-01-15",
    associatedQuotations: [
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
        id: "q_04",
        quotationNumber: "QT-2025-004",
        customerName: "Acme Corp",
        totalAmount: 9750,
        currency: "USD",
        status: "Approved",
        createdAt: "2025-09-03",
      },
    ],
  },
  {
    id: "cust_02",
    fullName: "Delta LLC",
    email: "purchasing@deltallc.io",
    phone: "+1 (555) 349-8120",
    organization: "Delta Holdings",
    status: "Active",
    createdAt: "2025-02-10",
    associatedQuotations: [
      {
        id: "q_02",
        quotationNumber: "QT-2025-002",
        customerName: "Delta LLC",
        totalAmount: 3200,
        currency: "USD",
        status: "Draft",
        createdAt: "2025-09-02",
      },
    ],
  },
  {
    id: "cust_03",
    fullName: "Zenith Co",
    email: "orders@zenithco.com",
    phone: "+1 (555) 902-1144",
    organization: "Zenith Global",
    status: "Pending",
    createdAt: "2025-03-01",
    associatedQuotations: [
      {
        id: "q_05",
        quotationNumber: "QT-2025-005",
        customerName: "Zenith Co",
        totalAmount: 15300,
        currency: "USD",
        status: "Negotiation",
        createdAt: "2025-09-04",
      },
    ],
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const mockUser = {
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    platformRole: "User",
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateCustomer = (data: { email: string }) => {
    // Helper to derive display name and organization from work email
    const [username, domain] = data.email.split("@");
    const formattedName = username
      ? username
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : data.email;

    const domainOrg = domain
      ? domain.split(".")[0].toUpperCase() + " Corp"
      : undefined;

    const newCustomer: CustomerItem = {
      id: `cust_${Date.now()}`,
      fullName: formattedName,
      email: data.email,
      organization: domainOrg,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
      associatedQuotations: [],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    showNotification(`Customer with email "${data.email}" added successfully.`);
  };

  const handleViewCustomer = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setViewMode("detail");
  };

  const handleSelectQuotation = (quotation: QuotationItem) => {
    showNotification(`Selected quotation ${quotation.quotationNumber} for ${quotation.customerName}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Customers
        </h1>
        <p className="text-sm text-text-secondary">
          Manage customer profiles, contact information, and associated quotation history.
        </p>
      </div>

      {/* View Switcher */}
      {viewMode === "list" ? (
        <CustomerListTable
          customers={customers}
          onViewCustomer={handleViewCustomer}
          onCreateCustomer={() => setIsCreateModalOpen(true)}
        />
      ) : (
        selectedCustomer && (
          <CustomerDetailView
            customer={selectedCustomer}
            onBack={() => {
              setViewMode("list");
              setSelectedCustomer(null);
            }}
            onSelectQuotation={handleSelectQuotation}
          />
        )
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCustomer={handleCreateCustomer}
      />
    </div>
  );
}
