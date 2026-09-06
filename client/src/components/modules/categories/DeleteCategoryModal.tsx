"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CategoryResponseType } from "@/types/category";
import { useDeleteCategoryMutation } from "@/store/features/category/categoryApi";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  category: CategoryResponseType | null;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  companyId,
  category,
}) => {
  const [deleteCategory, { isLoading }] = useDeleteCategoryMutation();
  const [error, setError] = useState<string | null>(null);

  if (!category) return null;

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteCategory({
        companyId,
        categoryId: category.id,
      }).unwrap();
      toast.success(`Category "${category.name}" removed successfully.`);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to delete category";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product Category"
      size="sm"
    >
      <ModalBody className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Are you sure?</p>
            <p>
              Are you sure you want to delete category{" "}
              <strong className="font-semibold">{category.name}</strong>?
            </p>
            {category.productCount ? (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                This category is currently linked to {category.productCount}{" "}
                product{category.productCount > 1 ? "s" : ""}. Products will
                remain in your catalog, but will no longer be tagged with this
                category.
              </p>
            ) : null}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          isLoading={isLoading}
          loadingText="Deleting..."
          className="bg-danger hover:bg-red-700 text-white border-transparent"
        >
          Delete Category
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteCategoryModal;
