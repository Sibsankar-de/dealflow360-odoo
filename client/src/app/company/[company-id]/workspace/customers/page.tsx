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
import toast from "react-hot-toast";

export default function CustomersPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [queryParams, setQueryParams] = useState<ListCustomersQuery>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useGetCustomersQuery(
    { companyId, params: queryParams },
    { skip: !companyId }
  );

  const [addCustomer, { isLoading: isAdding }] = useAddCustomerMutation();

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const customers = data?.data?.docs ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

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
      toast.success(`Customer with email "${formData.email}" registered successfully.`);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to register customer account";
      toast.error(msg);
      throw err;
    }
  };

  const handleViewCustomer = (customer: CustomerResponseType) => {
    setSelectedCustomer(customer);
    setViewMode("detail");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

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
          currentPage={queryParams.page || 1}
          totalPage={totalPages}
          onPageChange={(p) =>
            setQueryParams((prev) => ({ ...prev, page: p }))
          }
          onSearchChange={(search) =>
            setQueryParams((prev) => ({ ...prev, page: 1, search: search || undefined }))
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
        companyId={companyId}
        onCreateCustomer={handleCreateCustomer}
        isLoading={isAdding}
      />
    </div>
  );
}

