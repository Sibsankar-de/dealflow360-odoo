"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CategoryResponseType } from "@/types/category";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/store/features/category/categoryApi";
import toast from "react-hot-toast";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  category?: CategoryResponseType | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  companyId,
  category,
}) => {
  const isEditing = Boolean(category);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category && isOpen) {
      setName(category.name || "");
      setDescription(category.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    try {
      if (isEditing && category) {
        await updateCategory({
          companyId,
          categoryId: category.id,
          data: {
            name: trimmedName,
            description: description.trim() || null,
          },
        }).unwrap();
        toast.success(`Category "${trimmedName}" updated successfully.`);
      } else {
        await createCategory({
          companyId,
          data: {
            name: trimmedName,
            description: description.trim() || null,
          },
        }).unwrap();
        toast.success(`Category "${trimmedName}" created successfully.`);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save category";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product Category" : "Add Product Category"}
      description={
        isEditing
          ? "Update the category name and description."
          : "Create a new category to group and organize products in your catalog."
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <Input
          label="Category Name"
          placeholder="e.g., Software Licenses, Cloud Hosting, Hardware..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          required
          autoFocus
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Brief description about the products classified under this category..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating || isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isCreating || isUpdating}
            loadingText={isEditing ? "Saving..." : "Creating..."}
          >
            {isEditing ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
