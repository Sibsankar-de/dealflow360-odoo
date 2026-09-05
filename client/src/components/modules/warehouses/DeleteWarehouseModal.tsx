"use client";

import React from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WarehouseResponseType } from "@/types/warehouse";
import { useDeleteWarehouseMutation } from "@/store/features/warehouse/warehouseApi";
import { AlertTriangle } from "lucide-react";

interface DeleteWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  warehouse: WarehouseResponseType | null;
}

export const DeleteWarehouseModal: React.FC<DeleteWarehouseModalProps> = ({
  isOpen,
  onClose,
  companyId,
  warehouse,
}) => {
  const [deleteWarehouse, { isLoading }] = useDeleteWarehouseMutation();
  const [error, setError] = React.useState<string | null>(null);

  if (!warehouse) return null;

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteWarehouse({ companyId, warehouseId: warehouse.id }).unwrap();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to delete warehouse";
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Warehouse"
      size="sm"
    >
      <ModalBody className="space-y-3 pt-0">
        <div className="flex items-center gap-3 text-warning">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium text-text-primary">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">
              "{warehouse.name}"
            </span>
            ?
          </p>
        </div>
        <p className="text-xs text-text-muted">
          This will permanently remove the warehouse record and its stock mapping.
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
          Delete Warehouse
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteWarehouseModal;
