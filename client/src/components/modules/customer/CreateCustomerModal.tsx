"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCustomer: (data: { email: string }) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onCreateCustomer,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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

    onCreateCustomer({ email: trimmedEmail });
    setEmail("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Customer Account"
      description="Enter the registered DealFlow360 work email to add them as a customer."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <Input
          label="Work Email"
          type="email"
          placeholder="customer@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Add Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCustomerModal;
