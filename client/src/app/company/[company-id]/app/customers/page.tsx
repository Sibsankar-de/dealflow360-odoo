"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { CustomerListTable } from "@/components/modules/customer/CustomerListTable";
import { CustomerDetailView } from "@/components/modules/customer/CustomerDetailView";
import { CreateCustomerModal } from "@/components/modules/customer/CreateCustomerModal";
import { CustomerResponseType, ListCustomersQuery } from "@/types/customer";
import {
  useGetCustomersQuery,
  useAddCustomerMutation,
} from "@/store/features/customer/customerApi";
import { CheckCircle2 } from "lucide-react";

export default function CustomersPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [queryParams, setQueryParams] = useState<ListCustomersQuery>({
    page: 1,
    limit: 50,
  });

  const { data, isLoading } = useGetCustomersQuery(
    { companyId, params: queryParams },
    { skip: !companyId }
  );

  const [addCustomer, { isLoading: isAdding }] = useAddCustomerMutation();

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const customers = React.useMemo(() => {
    if (!data?.data) return [];
    const raw = data.data;
    if (Array.isArray(raw)) return raw;
    if ("docs" in raw && Array.isArray(raw.docs)) return raw.docs;
    if ("customers" in raw && Array.isArray(raw.customers)) return raw.customers;
    return [];
  }, [data]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateCustomer = async (formData: { email: string }) => {
    if (!companyId) return;
    try {
      await addCustomer({
        companyId,
        data: {
          userEmail: formData.email,
          role: "CUSTOMER",
        },
      }).unwrap();
      showNotification(`Customer with email "${formData.email}" registered successfully.`);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to register customer account";
      showNotification(msg);
      throw err;
    }
  };

  const handleViewCustomer = (customer: CustomerResponseType) => {
    setSelectedCustomer(customer);
    setViewMode("detail");
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
          Manage customer accounts, verify discount tiers, and track pipeline deals and quotations.
        </p>
      </div>

      {/* View Switcher */}
      {viewMode === "list" ? (
        <CustomerListTable
          customers={customers}
          isLoading={isLoading}
          onViewCustomer={handleViewCustomer}
          onCreateCustomer={() => setIsCreateModalOpen(true)}
          onSearchChange={(search) =>
            setQueryParams((prev) => ({ ...prev, search: search || undefined }))
          }
        />
      ) : (
        selectedCustomer && (
          <CustomerDetailView
            customer={selectedCustomer}
            companyId={companyId}
            onBack={() => {
              setViewMode("list");
              setSelectedCustomer(null);
            }}
          />
        )
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCustomer={handleCreateCustomer}
        isLoading={isAdding}
      />
    </div>
  );
}
