"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProductResponseType } from "@/types/product";
import { useGetWarehousesQuery } from "@/store/features/warehouse/warehouseApi";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/store/features/product/productApi";
import { Plus, Trash2 } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  product?: ProductResponseType | null;
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
  const { data: warehouseData } = useGetWarehousesQuery(
    { companyId },
    { skip: !isOpen || !companyId }
  );

  const warehouses = React.useMemo(() => {
    if (!warehouseData?.data) return [];
    const rawData = warehouseData.data;
    if (Array.isArray(rawData)) return rawData;
    if ("warehouses" in rawData && Array.isArray(rawData.warehouses)) {
      return rawData.warehouses;
    }
    return [];
  }, [warehouseData]);

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState<number | string>(product?.price || "");
  const [baseUnit, setBaseUnit] = useState(product?.baseUnit || "Unit");
  const [type, setType] = useState<"ONE_TIME" | "RECURRING">(
    product?.type || "ONE_TIME"
  );
  const [stocks, setStocks] = useState<
    Array<{ warehouseId: string; stockQty: number }>
  >(
    product?.stocks?.map((s) => ({
      warehouseId: s.warehouseId,
      stockQty: s.stockQty,
    })) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
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
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setBaseUnit("Unit");
      setType("ONE_TIME");
      setStocks([]);
    }
    setErrors({});
  }, [product, isOpen]);

  const handleAddStock = () => {
    if (warehouses.length === 0) return;
    const availableWarehouse = warehouses.find(
      (w) => !stocks.some((s) => s.warehouseId === w.id)
    );
    if (availableWarehouse) {
      setStocks((prev) => [
        ...prev,
        { warehouseId: availableWarehouse.id, stockQty: 0 },
      ]);
    } else if (warehouses[0]) {
      setStocks((prev) => [...prev, { warehouseId: warehouses[0].id, stockQty: 0 }]);
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

  const handleStockQtyChange = (index: number, qty: number) => {
    setStocks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, stockQty: Math.max(0, qty) } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Product name is required";
    if (price === "" || Number(price) < 0)
      newErrors.price = "Valid price is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditing && product) {
        await updateProduct({
          companyId,
          productId: product.id,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            baseUnit,
            type,
          },
        }).unwrap();
      } else {
        await createProduct({
          companyId,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            baseUnit,
            type,
            stocks: stocks.length > 0 ? stocks : undefined,
          },
        }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save product";
      setErrors({ form: errorMsg });
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
          ? "Update product details and pricing."
          : "Add a new product with pricing and initial stock allocations."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0">
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

          {!isEditing && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    Warehouse Stock Allocation
                  </h4>
                  <p className="text-xs text-text-muted">
                    Assign initial inventory quantity per warehouse.
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
                            handleStockQtyChange(
                              idx,
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="Qty"
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
          )}
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
