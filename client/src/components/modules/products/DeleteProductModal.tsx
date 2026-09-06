"use client";

import React from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProductResponseType } from "@/types/product";
import { useDeleteProductMutation } from "@/store/features/product/productApi";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  product: ProductResponseType | null;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  companyId,
  product,
}) => {
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();
  const [error, setError] = React.useState<string | null>(null);

  if (!product) return null;

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteProduct({ companyId, productId: product.id }).unwrap();
      toast.success(`Product "${product.name}" deleted.`);
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to delete product";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      size="sm"
    >
      <ModalBody className="space-y-3 pt-0">
        <div className="flex items-center gap-3 text-warning">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium text-text-primary">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">"{product.name}"</span>?
          </p>
        </div>
        <p className="text-xs text-text-muted">
          This action cannot be undone. Any quotations or deals referencing this product
          history will retain existing snapshots.
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
          Delete Product
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteProductModal;
