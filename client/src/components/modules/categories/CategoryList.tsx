"use client";

import React, { useState } from "react";
import { CategoryResponseType } from "@/types/category";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { CategoryModal } from "./CategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";

interface CategoryListProps {
  categories: CategoryResponseType[];
  companyId: string;
  isLoading?: boolean;
  currentPage?: number;
  totalPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onSelectCategoryFilter?: (categoryId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  companyId,
  isLoading = false,
  currentPage = 1,
  totalPage = 1,
  onPageChange,
  onSearchChange,
  onSelectCategoryFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryResponseType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] =
    useState<CategoryResponseType | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  const handleEdit = (cat: CategoryResponseType) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            Product Categories
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Organize catalog products into logical categories, groups, and classifications.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleCreate}
        >
          Add Category
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 w-full">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Table / Empty state */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted">
            <FolderTree className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
            <p className="text-sm">Loading product categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-text-primary">
              No categories found
            </h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
              {searchTerm
                ? "No categories matched your search. Try adjusting your query."
                : "Create product categories to tag, organize, and filter items across your sales catalog."}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                className="mt-4"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Assigned Products</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories.map((cat) => {
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-text-muted max-w-md line-clamp-2">
                          {cat.description || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-text-muted" />
                          <Badge
                            variant={
                              cat.productCount && cat.productCount > 0
                                ? "info"
                                : "secondary"
                            }
                          >
                            {cat.productCount || 0} product
                            {(cat.productCount ?? 0) === 1 ? "" : "s"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-muted">
                        {cat.createdAt
                          ? new Date(cat.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(cat)}
                            title="Edit category"
                            className="p-1.5 h-8 w-8 text-text-secondary hover:text-brand-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteCategory(cat)}
                            title="Delete category"
                            className="p-1.5 h-8 w-8 text-text-secondary hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPage > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPage}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        category={selectedCategory}
      />

      <DeleteCategoryModal
        isOpen={Boolean(deleteCategory)}
        onClose={() => setDeleteCategory(null)}
        companyId={companyId}
        category={deleteCategory}
      />
    </div>
  );
};

export default CategoryList;
