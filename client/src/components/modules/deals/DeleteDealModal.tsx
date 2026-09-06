"use client";

import React from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DealResponseType } from "@/types/deal";
import { useDeleteDealMutation } from "@/store/features/deal/dealApi";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  deal: DealResponseType | null;
}

export const DeleteDealModal: React.FC<DeleteDealModalProps> = ({
  isOpen,
  onClose,
  companyId,
  deal,
}) => {
  const [deleteDeal, { isLoading }] = useDeleteDealMutation();
  const [error, setError] = React.useState<string | null>(null);

  if (!deal) return null;

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteDeal({ companyId, id: deal.id }).unwrap();
      toast.success(`Deal "${deal.name}" deleted.`);
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to delete deal";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Deal"
      size="sm"
    >
      <ModalBody className="space-y-3 pt-0">
        <div className="flex items-center gap-3 text-warning">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium text-text-primary">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">"{deal.name}"</span>?
          </p>
        </div>
        <p className="text-xs text-text-muted">
          This will permanently remove the deal and its quotation records.
        </p>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
            {error}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          isLoading={isLoading}
          loadingText="Deleting..."
          className="bg-danger hover:bg-red-700 text-white border-transparent"
        >
          Delete Deal
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteDealModal;
