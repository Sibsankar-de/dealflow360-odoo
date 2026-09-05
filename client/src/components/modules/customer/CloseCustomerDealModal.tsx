"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerDealItem } from "@/types/customer";

interface CloseCustomerDealModalProps {
  deal: CustomerDealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CloseCustomerDealModal({
  deal,
  isOpen,
  onClose,
  onConfirm,
}: CloseCustomerDealModalProps) {
  if (!deal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close Deal"
      description="Confirm closing this commercial deal proposal."
      size="md"
    >
      <ModalBody>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-danger shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-sm font-semibold text-text-primary">
                Are you sure you want to close this deal?
              </p>
              <p className="text-text-secondary leading-relaxed">
                Closing <span className="font-semibold text-text-primary">{deal.name}</span> ({deal.dealNo}) will conclude active proposals and discussions associated with this deal opportunity.
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="md"
          onClick={onConfirm}
          className="bg-danger hover:bg-red-700 text-white border-transparent shadow-xs"
        >
          Confirm Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default CloseCustomerDealModal;
