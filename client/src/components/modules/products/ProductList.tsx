"use client";

import React, { useState } from "react";
import { ProductResponseType } from "@/types/product";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { ProductModal } from "./ProductModal";
import { DeleteProductModal } from "./DeleteProductModal";
import { useGetCategoriesQuery } from "@/store/features/category/categoryApi";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  FolderTree,
} from "lucide-react";

interface ProductListProps {
  products: ProductResponseType[];
  companyId: string;
  isLoading?: boolean;
  currentPage?: number;
  totalPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onTypeChange?: (type: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  companyId,
  isLoading = false,
  currentPage = 1,
  totalPage = 1,
  onPageChange,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  selectedCategoryId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryId || "ALL");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponseType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] =
    useState<ProductResponseType | null>(null);

  const { data: categoryData } = useGetCategoriesQuery(
    { companyId, params: { limit: 100 } },
    { skip: !companyId }
  );
  const categories = categoryData?.data?.docs ?? [];

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    onTypeChange?.(val);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    onCategoryChange?.(val);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "ALL" || p.type === typeFilter;
    const matchesCategory =
      categoryFilter === "ALL" ||
      p.categories?.some((c) => c.id === categoryFilter);
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleEdit = (prod: ProductResponseType) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Products & Pricing
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage company product catalog, pricing models, and inventory levels.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleCreate}
        >
          Add Product
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 w-full">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onChange={(val) => handleCategoryChange(val)}
            options={[
              { key: "ALL", value: "All Categories" },
              ...categories.map((c) => ({ key: c.id, value: c.name })),
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={typeFilter}
            onChange={(val) => handleTypeChange(val)}
            options={[
              { key: "ALL", value: "All Types" },
              { key: "ONE_TIME", value: "One-Time" },
              { key: "RECURRING", value: "Recurring" },
            ]}
          />
        </div>
      </div>

      {/* Products Table / Empty state */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted">
            <Package className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
            <p className="text-sm">Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-text-primary">
              No products found
            </h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
              {searchTerm || typeFilter !== "ALL"
                ? "No products matched your search filters. Try adjusting your search query."
                : "Get started by adding your first product with prices and warehouse stock."}
            </p>
            {!searchTerm && typeFilter === "ALL" && (
              <Button
                variant="outline"
                className="mt-4"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Stock Allocated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((prod) => {
                  const totalStock =
                    prod.stocks?.reduce(
                      (acc, curr) => acc + (curr.stockQty || 0),
                      0
                    ) ??
                    prod.totalStock ??
                    0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-surface/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary">
                          {prod.name}
                        </div>
                        {prod.description && (
                          <div className="text-xs text-text-muted truncate max-w-md mt-0.5">
                            {prod.description}
                          </div>
                        )}
                        {prod.categories && prod.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {prod.categories.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60"
                              >
                                <FolderTree className="w-2.5 h-2.5 text-brand-500" />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {prod.discountTiers && prod.discountTiers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-text-muted font-medium mr-0.5">
                              Tier Discounts:
                            </span>
                            {prod.discountTiers.map((dt) => {
                              const tierColors =
                                {
                                  BRONZE:
                                    "bg-amber-50 text-amber-800 border-amber-200/60",
                                  SILVER:
                                    "bg-slate-50 text-slate-700 border-slate-200/60",
                                  GOLD: "bg-yellow-50 text-yellow-800 border-yellow-200/60",
                                }[dt.customerTier] ||
                                "bg-surface text-text-secondary border-border";

                              return (
                                <span
                                  key={dt.customerTier}
                                  className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${tierColors}`}
                                >
                                  {dt.customerTier.charAt(0) +
                                    dt.customerTier.slice(1).toLowerCase()}
                                  : {Number(dt.discountPercent)}%
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            prod.type === "RECURRING" ? "purple" : "secondary"
                          }
                        >
                          {prod.type === "RECURRING" ? "Recurring" : "One-Time"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-text-primary">
                        ${Number(prod.price).toFixed(2)}
                        <span className="text-xs font-normal text-text-muted ml-1">
                          / {prod.baseUnit || "Unit"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <Boxes className="w-4 h-4 text-text-muted" />
                          <span className="font-medium text-text-primary">
                            {totalStock}
                          </span>
                          <span className="text-xs text-text-muted">
                            units across {prod.stocks?.length || 0} warehouses
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(prod)}
                            title="Edit product"
                            className="p-1.5 h-8 w-8 text-text-secondary hover:text-brand-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteProduct(prod)}
                            title="Delete product"
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
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        product={selectedProduct}
      />

      <DeleteProductModal
        isOpen={Boolean(deleteProduct)}
        onClose={() => setDeleteProduct(null)}
        companyId={companyId}
        product={deleteProduct}
      />
    </div>
  );
};

export default ProductList;
