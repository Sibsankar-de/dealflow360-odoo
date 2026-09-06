"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProductResponseType } from "@/types/product";
import { SubscriptionType, CustomerTier } from "@/types/subscription";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/store/features/product/productApi";
import {
  useListSubscriptionPricingQuery,
  useCreateSubscriptionPricingMutation,
  useUpdateSubscriptionPricingMutation,
  useDeleteSubscriptionPricingMutation,
} from "@/store/features/subscription/subscriptionApi";
import { useGetCategoriesQuery } from "@/store/features/category/categoryApi";
import { Plus, Trash2, Layers, FolderTree, Check, Percent, Search, X } from "lucide-react";
import toast from "react-hot-toast";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  product?: ProductResponseType | null;
}

interface PricingTierRow {
  id?: string;
  subscriptionType: SubscriptionType;
  customerTier: "ALL" | CustomerTier;
  price: number | string;
  minQuantity: number | string;
  isDeleted?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  companyId,
  product,
}) => {
  const isEditing = Boolean(product);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createPricing] = useCreateSubscriptionPricingMutation();
  const [updatePricing] = useUpdateSubscriptionPricingMutation();
  const [deletePricing] = useDeleteSubscriptionPricingMutation();

  const { data: warehouseData } = useGetWarehousesQuery(
    { companyId },
    { skip: !isOpen || !companyId }
  );

  const { data: existingPricingData } = useListSubscriptionPricingQuery(
    {
      companyId,
      params: { productId: product?.id, limit: 50 },
    },
    { skip: !isOpen || !companyId || !product?.id }
  );

  const { data: categoryData } = useGetCategoriesQuery(
    { companyId, params: { limit: 100 } },
    { skip: !isOpen || !companyId }
  );

  const warehouses = warehouseData?.data?.warehouses ?? [];
  const categories = categoryData?.data?.docs ?? [];

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState<number | string>(product?.price || "");
  const [baseUnit, setBaseUnit] = useState(product?.baseUnit || "Unit");
  const [type, setType] = useState<"ONE_TIME" | "RECURRING">(
    product?.type || "ONE_TIME"
  );
  const [stocks, setStocks] = useState<
    Array<{ warehouseId: string; stockQty: number | string }>
  >(
    product?.stocks?.map((s) => ({
      warehouseId: s.warehouseId,
      stockQty: s.stockQty,
    })) || []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories?.map((c) => c.id) || []
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [bronzeDiscount, setBronzeDiscount] = useState<number | string>("");
  const [silverDiscount, setSilverDiscount] = useState<number | string>("");
  const [goldDiscount, setGoldDiscount] = useState<number | string>("");

  const [pricingTiers, setPricingTiers] = useState<PricingTierRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price ?? "");
      setBaseUnit(product.baseUnit || "Unit");
      setType(product.type || "ONE_TIME");
      setStocks(
        product.stocks?.map((s) => ({
          warehouseId: s.warehouseId,
          stockQty: s.stockQty,
        })) || []
      );
      setSelectedCategoryIds(product.categories?.map((c) => c.id) || []);
      const bronze = product.discountTiers?.find((t) => t.customerTier === "BRONZE")?.discountPercent;
      const silver = product.discountTiers?.find((t) => t.customerTier === "SILVER")?.discountPercent;
      const gold = product.discountTiers?.find((t) => t.customerTier === "GOLD")?.discountPercent;
      setBronzeDiscount(bronze !== undefined ? bronze : "");
      setSilverDiscount(silver !== undefined ? silver : "");
      setGoldDiscount(gold !== undefined ? gold : "");
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setBaseUnit("Unit");
      setType("ONE_TIME");
      setStocks([]);
      setPricingTiers([]);
      setSelectedCategoryIds([]);
      setBronzeDiscount("");
      setSilverDiscount("");
      setGoldDiscount("");
    }
    setCategorySearch("");
    setIsCategoryDropdownOpen(false);
    setErrors({});
  }, [product, isOpen]);

  useEffect(() => {
    if (existingPricingData?.data?.docs && isOpen && isEditing) {
      setPricingTiers(
        existingPricingData.data.docs.map((doc) => ({
          id: doc.id,
          subscriptionType: doc.subscriptionType,
          customerTier: (doc.customerTier as CustomerTier) || "ALL",
          price: doc.price,
          minQuantity: doc.minQuantity || 1,
        }))
      );
    }
  }, [existingPricingData, isOpen, isEditing]);

  const handleAddStock = () => {
    if (warehouses.length === 0) return;
    const availableWarehouse = warehouses.find(
      (w) => !stocks.some((s) => s.warehouseId === w.id)
    );
    if (availableWarehouse) {
      setStocks((prev) => [
        ...prev,
        { warehouseId: availableWarehouse.id, stockQty: "" },
      ]);
    } else if (warehouses[0]) {
      setStocks((prev) => [...prev, { warehouseId: warehouses[0].id, stockQty: "" }]);
    }
  };

  const handleRemoveStock = (index: number) => {
    setStocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStockWarehouseChange = (index: number, warehouseId: string) => {
    setStocks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, warehouseId } : s))
    );
  };

  const handleStockQtyChange = (index: number, qty: number | string) => {
    setStocks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, stockQty: qty } : s))
    );
  };

  const handleAddPricingTier = () => {
    setPricingTiers((prev) => [
      ...prev,
      {
        subscriptionType: "MONTHLY",
        customerTier: "ALL",
        price: price !== "" ? Number(price) : 0,
        minQuantity: 1,
      },
    ]);
  };

  const handleRemovePricingTier = (index: number) => {
    setPricingTiers((prev) => {
      const target = prev[index];
      if (target?.id) {
        return prev.map((t, i) => (i === index ? { ...t, isDeleted: true } : t));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePricingTierChange = (
    index: number,
    field: keyof PricingTierRow,
    value: any
  ) => {
    setPricingTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleAddCategory = (categoryId: string) => {
    if (!selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds((prev) => [...prev, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
  };

  const handleClearCategories = () => {
    setSelectedCategoryIds([]);
  };

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(c.id)
  );
  const availableCategories = categories.filter(
    (c) => !selectedCategoryIds.includes(c.id)
  );
  const filteredCategories = availableCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Product name is required";
    if (price === "" || Number(price) < 0)
      newErrors.price = "Valid price is required";

    if (bronzeDiscount !== "" && (Number(bronzeDiscount) < 0 || Number(bronzeDiscount) > 100)) {
      newErrors.bronzeDiscount = "Discount must be between 0% and 100%";
    }
    if (silverDiscount !== "" && (Number(silverDiscount) < 0 || Number(silverDiscount) > 100)) {
      newErrors.silverDiscount = "Discount must be between 0% and 100%";
    }
    if (goldDiscount !== "" && (Number(goldDiscount) < 0 || Number(goldDiscount) > 100)) {
      newErrors.goldDiscount = "Discount must be between 0% and 100%";
    }

    if (type === "RECURRING") {
      const activeTiers = pricingTiers.filter((t) => !t.isDeleted);
      for (let i = 0; i < activeTiers.length; i++) {
        const tier = activeTiers[i];
        if (tier.price === "" || Number(tier.price) <= 0) {
          newErrors.form = `Subscription pricing tier #${i + 1} must have a valid price greater than 0.`;
          break;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const formattedStocks = stocks.map((s) => ({
        warehouseId: s.warehouseId,
        stockQty: Number(s.stockQty) || 0,
      }));

      const formattedDiscountTiers: Array<{
        customerTier: "BRONZE" | "SILVER" | "GOLD";
        discountPercent: number;
      }> = [];
      if (bronzeDiscount !== "" && !isNaN(Number(bronzeDiscount))) {
        formattedDiscountTiers.push({
          customerTier: "BRONZE",
          discountPercent: Number(bronzeDiscount),
        });
      }
      if (silverDiscount !== "" && !isNaN(Number(silverDiscount))) {
        formattedDiscountTiers.push({
          customerTier: "SILVER",
          discountPercent: Number(silverDiscount),
        });
      }
      if (goldDiscount !== "" && !isNaN(Number(goldDiscount))) {
        formattedDiscountTiers.push({
          customerTier: "GOLD",
          discountPercent: Number(goldDiscount),
        });
      }

      let savedProductId = product?.id;

      if (isEditing && product) {
        const res = await updateProduct({
          companyId,
          productId: product.id,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            baseUnit,
            type,
            stocks: formattedStocks,
            discountTiers: formattedDiscountTiers,
            categoryIds: selectedCategoryIds,
          },
        }).unwrap();
        savedProductId = res.data.product.id;
      } else {
        const res = await createProduct({
          companyId,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            baseUnit,
            type,
            stocks: formattedStocks.length > 0 ? formattedStocks : undefined,
            discountTiers:
              formattedDiscountTiers.length > 0
                ? formattedDiscountTiers
                : undefined,
            categoryIds: selectedCategoryIds,
          },
        }).unwrap();
        savedProductId = res.data.product.id;
      }

      // If RECURRING product, sync pricing tiers
      if (type === "RECURRING" && savedProductId) {
        for (const tier of pricingTiers) {
          if (tier.id && tier.isDeleted) {
            await deletePricing({ companyId, id: tier.id }).unwrap();
          } else if (tier.id && !tier.isDeleted) {
            await updatePricing({
              companyId,
              id: tier.id,
              data: {
                subscriptionType: tier.subscriptionType,
                customerTier:
                  tier.customerTier === "ALL"
                    ? null
                    : (tier.customerTier as CustomerTier),
                price: Number(tier.price),
                minQuantity: Number(tier.minQuantity) || 1,
              },
            }).unwrap();
          } else if (!tier.id && !tier.isDeleted && Number(tier.price) > 0) {
            await createPricing({
              companyId,
              data: {
                productId: savedProductId,
                subscriptionType: tier.subscriptionType,
                customerTier:
                  tier.customerTier === "ALL"
                    ? null
                    : (tier.customerTier as CustomerTier),
                price: Number(tier.price),
                minQuantity: Number(tier.minQuantity) || 1,
              },
            }).unwrap();
          }
        }
      }

      toast.success(
        isEditing
          ? `Product "${name.trim()}" updated successfully.`
          : `Product "${name.trim()}" created successfully.`
      );
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save product";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    }
  };

  const warehouseOptions = warehouses.map((w) => ({
    key: w.id,
    value: w.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Create New Product"}
      description={
        isEditing
          ? "Update product details, pricing, and warehouse stock allocations."
          : "Add a new product with pricing and initial stock allocations."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="space-y-4">
          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise License"
              error={errors.name}
            />

            <Select
              label="Product Type"
              value={type}
              onChange={(val) => setType(val as "ONE_TIME" | "RECURRING")}
              options={[
                { key: "ONE_TIME", value: "One-Time Product" },
                { key: "RECURRING", value: "Recurring Subscription" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              error={errors.price}
            />

            <Input
              label="Base Unit"
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              placeholder="e.g. Unit, Month, Box"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional product details..."
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
            />
          </div>

          {/* Product Categories Selection */}
          <div className="pt-2 border-t border-border space-y-2.5" ref={categoryDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-brand-600" />
                <span>Product Categories</span>
              </label>
              {selectedCategoryIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? "category" : "categories"} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCategories}
                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Selected Category Tags */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-surface rounded-lg border border-border">
                {selectedCategories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-brand-400 hover:text-brand-700 dark:hover:text-brand-100 rounded p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors cursor-pointer"
                      title={`Remove ${cat.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search and Add Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setIsCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  placeholder={
                    categories.length === 0
                      ? "No categories available"
                      : availableCategories.length === 0
                      ? "All categories assigned"
                      : "Search and add category..."
                  }
                  disabled={categories.length === 0 || availableCategories.length === 0}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2.5 p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search suggestions dropdown */}
              {isCategoryDropdownOpen && categories.length > 0 && availableCategories.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-border/50">
                  {filteredCategories.length === 0 ? (
                    <div className="p-3 text-xs text-text-muted text-center">
                      No categories matching &quot;{categorySearch}&quot;
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          handleAddCategory(cat.id);
                          setCategorySearch("");
                        }}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-[11px] text-text-muted truncate">
                              {cat.description}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 opacity-80 group-hover:opacity-100 shrink-0">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {categories.length === 0 && (
                <p className="text-xs text-text-muted mt-1">
                  No categories found. Create categories in the Categories tab.
                </p>
              )}
            </div>
          </div>

          {/* Subscription Pricing Tiers (Only for RECURRING products) */}
          {type === "RECURRING" && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-text-primary">
                      Subscription Pricing Tiers
                    </h4>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Configure recurring pricing intervals (Monthly, Quarterly, Yearly) and optional customer tier discounts.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddPricingTier}
                >
                  Add Tier
                </Button>
              </div>

              {pricingTiers.filter((t) => !t.isDeleted).length === 0 ? (
                <div className="text-xs text-text-muted text-center py-4 bg-purple-50/50 rounded-lg border border-dashed border-purple-200">
                  No subscription pricing tiers defined. Click &quot;Add Tier&quot; to configure monthly, quarterly, or yearly rates.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-text-muted uppercase px-1">
                    <span className="col-span-3">Billing Cycle</span>
                    <span className="col-span-3">Customer Tier</span>
                    <span className="col-span-3">Rate Price ($)</span>
                    <span className="col-span-2">Min Qty</span>
                    <span className="col-span-1 text-right">Action</span>
                  </div>
                  {pricingTiers.map((tier, idx) => {
                    if (tier.isDeleted) return null;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-surface p-2 rounded-lg border border-border"
                      >
                        <div className="col-span-3">
                          <Select
                            value={tier.subscriptionType}
                            onChange={(val) =>
                              handlePricingTierChange(
                                idx,
                                "subscriptionType",
                                val as SubscriptionType
                              )
                            }
                            options={[
                              { key: "MONTHLY", value: "Monthly" },
                              { key: "QUARTERLY", value: "Quarterly" },
                              { key: "YEARLY", value: "Yearly" },
                            ]}
                          />
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={tier.customerTier}
                            onChange={(val) =>
                              handlePricingTierChange(idx, "customerTier", val)
                            }
                            options={[
                              { key: "ALL", value: "All Customers" },
                              { key: "BRONZE", value: "Bronze Tier" },
                              { key: "SILVER", value: "Silver Tier" },
                              { key: "GOLD", value: "Gold Tier" },
                            ]}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={tier.price}
                            onChange={(e) =>
                              handlePricingTierChange(
                                idx,
                                "price",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={tier.minQuantity}
                            onChange={(e) =>
                              handlePricingTierChange(
                                idx,
                                "minQuantity",
                                e.target.value
                              )
                            }
                            placeholder="1"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemovePricingTier(idx)}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-card rounded-md transition-colors"
                            title="Remove tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer Tier-Based Maximum Discounts */}
          <div className="pt-2 border-t border-border space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-text-primary">
                  Customer Tier Maximum Discounts (%)
                </h4>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Set maximum allowed discount thresholds for each customer tier. These limits are used for quotation evaluations and blended score calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface p-3 rounded-lg border border-border">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
                  <span className="text-xs font-semibold text-text-primary">Bronze Tier (%)</span>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={bronzeDiscount}
                  onChange={(e) => setBronzeDiscount(e.target.value)}
                  placeholder="e.g. 5"
                  error={errors.bronzeDiscount}
                  helperText="Max discount %"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-semibold text-text-primary">Silver Tier (%)</span>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={silverDiscount}
                  onChange={(e) => setSilverDiscount(e.target.value)}
                  placeholder="e.g. 10"
                  error={errors.silverDiscount}
                  helperText="Max discount %"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="text-xs font-semibold text-text-primary">Gold Tier (%)</span>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={goldDiscount}
                  onChange={(e) => setGoldDiscount(e.target.value)}
                  placeholder="e.g. 18"
                  error={errors.goldDiscount}
                  helperText="Max discount %"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Warehouse Stock Allocation
                </h4>
                <p className="text-xs text-text-muted">
                  {isEditing
                    ? "Manage inventory quantities across warehouses."
                    : "Assign initial inventory quantity per warehouse."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddStock}
                disabled={warehouses.length === 0}
              >
                Add Warehouse
              </Button>
            </div>

            {stocks.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-3 bg-surface rounded-lg border border-dashed border-border">
                {warehouses.length === 0
                  ? "No warehouses found. You can add warehouses in the Warehouses tab."
                  : "No stock allocated. Click 'Add Warehouse' to assign stock."}
              </div>
            ) : (
              <div className="space-y-2">
                {stocks.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-surface p-2.5 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <Select
                        value={stock.warehouseId}
                        onChange={(val) =>
                          handleStockWarehouseChange(idx, val)
                        }
                        options={warehouseOptions}
                        placeholder="Select warehouse"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        value={stock.stockQty}
                        onChange={(e) =>
                          handleStockQtyChange(idx, e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStock(idx)}
                      className="p-2 text-text-muted hover:text-danger hover:bg-card rounded-md transition-colors"
                      title="Remove stock"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isCreating || isUpdating}
            loadingText="Saving..."
          >
            {isEditing ? "Update Product" : "Create Product"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ProductModal;
