"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchableInput } from "@/components/ui/SearchableInput";
import { useSearchCustomersQuery } from "@/store/features/customer/customerApi";
import { useAuth } from "@/context/AuthContext";
import { User, Check } from "lucide-react";

export interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onCreateCustomer: (data: { email: string }) => Promise<void> | void;
  isLoading?: boolean;
}

interface CustomerSearchItem {
  id: string;
  label: string;
  value: string;
  name?: string;
  customerTier?: string | null;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onCreateCustomer,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: searchResults, isFetching } = useSearchCustomersQuery(
    {
      companyId,
      query: email.trim(),
      limit: 10,
    },
    { skip: !isOpen || !companyId || !email.trim() }
  );

  const rawResults = searchResults?.data ?? [];
  const filteredResults = rawResults.filter((c) => {
    if (!currentUser) return true;
    if (currentUser.id && c.id === currentUser.id) return false;
    if (
      currentUser.email &&
      c.email?.toLowerCase() === currentUser.email?.toLowerCase()
    )
      return false;
    return true;
  });

  const customerMatches: CustomerSearchItem[] = filteredResults.map((c) => ({
    id: c.id,
    label: c.email,
    value: c.email,
    name: c.name,
    customerTier: c.customerTier,
  }));

  const handleClose = () => {
    setEmail("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter a valid work email address.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email format (e.g., customer@company.com).");
      return;
    }

    try {
      await onCreateCustomer({ email: trimmedEmail });
      setEmail("");
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to add customer";
      setError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Customer Account"
      description="Enter or search the registered DealFlow360 work email to add them as a customer in this company."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <SearchableInput<CustomerSearchItem>
          label="Work Email / Search User"
          type="email"
          placeholder="customer@example.com"
          value={email}
          onChange={(val) => {
            setEmail(val);
            if (error) setError(null);
          }}
          onSelect={(item) => {
            setEmail(item.value);
            if (error) setError(null);
          }}
          items={customerMatches}
          isLoading={isFetching}
          emptyMessage={
            email.trim()
              ? "No registered user found with that email. You can still type the full email to register them."
              : "Type to search registered accounts..."
          }
          required
          autoFocus
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3 text-xs w-full py-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-[11px] shrink-0">
                  {item.name ? item.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {item.name || "Customer"}
                  </p>
                  <p className="text-text-muted truncate text-[11px]">
                    {item.value}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.customerTier && (
                  <Badge variant="info" className="text-[10px] px-1.5 py-0">
                    {item.customerTier}
                  </Badge>
                )}
                {email.toLowerCase() === item.value.toLowerCase() && (
                  <Check className="w-4 h-4 text-brand-600" />
                )}
              </div>
            </div>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Adding..."
          >
            Add Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCustomerModal;
