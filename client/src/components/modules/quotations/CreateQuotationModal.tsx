"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import { useCreateDealQuotationMutation } from "@/store/features/deal/dealApi";
import { Plus, Trash2 } from "lucide-react";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  dealId: string;
  customerId: string;
}

interface ItemState {
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number | string;
  taxRate: number | string;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  companyId,
  dealId,
  customerId,
}) => {
  const [createQuotation, { isLoading }] = useCreateDealQuotationMutation();
  const { data: productData } = useGetProductsQuery(
    { companyId },
    { skip: !isOpen || !companyId }
  );
  const products = React.useMemo(() => {
    if (!productData?.data) return [];
    const rawData = productData.data;
    if (Array.isArray(rawData)) return rawData;
    if ("products" in rawData && Array.isArray(rawData.products)) {
      return rawData.products;
    }
    return [];
  }, [productData]);

  const [items, setItems] = useState<ItemState[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setItems([]);
      setCurrency("USD");
      setValidUntil("");
      setCustomerNote("");
      setInternalNote("");
      setErrors({});
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd.id,
        quantity: 1,
        unitPrice: Number(firstProd.price) || 0,
        discountType: "PERCENTAGE",
        discountValue: "",
        taxRate: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const selectedProd = products.find((p) => p.id === prodId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: prodId,
              unitPrice: selectedProd ? Number(selectedProd.price) || 0 : item.unitPrice,
            }
          : item
      )
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof ItemState,
    value: unknown
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discVal = Number(item.discountValue) || 0;
      const lineBase = qty * price;
      const discount =
        item.discountType === "PERCENTAGE"
          ? (lineBase * discVal) / 100
          : discVal;
      return sum + Math.max(0, lineBase - discount);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (items.length === 0) {
      newErrors.items = "Please add at least one line item";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createQuotation({
        companyId,
        dealId,
        data: {
          companyId,
          dealId,
          customerId,
          currency,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          customerNote: customerNote.trim() || null,
          internalNote: internalNote.trim() || null,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discountType: it.discountType,
            discountValue: Number(it.discountValue) || 0,
            taxRate: Number(it.taxRate) || 0,
          })),
        },
      }).unwrap();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to generate quotation";
      setErrors({ form: errorMsg });
    }
  };

  const productOptions = products.map((p) => ({
    key: p.id,
    value: `${p.name} ($${Number(p.price).toFixed(2)})`,
  }));

  const subtotal = calculateSubtotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate New Quotation"
      description="Create a commercial proposal and pricing schedule for this deal."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0 max-h-[75vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />

            <CurrencySelector
              label="Currency"
              value={currency}
              onChange={(val) => setCurrency(val)}
            />
          </div>

          {/* Line Items Table */}
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Quotation Line Items
                </h4>
                <p className="text-xs text-text-muted">
                  Add product items, specify quantities and unit discounts.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddItem}
                disabled={products.length === 0}
              >
                Add Line Item
              </Button>
            </div>

            {errors.items && (
              <p className="text-xs font-medium text-danger">{errors.items}</p>
            )}

            {items.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6 bg-surface rounded-lg border border-dashed border-border">
                No items added yet. Click "Add Line Item" to select products.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded-xl border border-border space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Select
                          label="Product"
                          value={item.productId}
                          onChange={(val) => handleProductChange(idx, val)}
                          options={productOptions}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          label="Qty"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          label="Unit Price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="pt-6">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-text-muted hover:text-danger hover:bg-card rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-28">
                          <Select
                            label="Discount"
                            value={item.discountType}
                            onChange={(val) =>
                              handleItemFieldChange(
                                idx,
                                "discountType",
                                val as "PERCENTAGE" | "FIXED"
                              )
                            }
                            options={[
                              { key: "PERCENTAGE", value: "%" },
                              { key: "FIXED", value: "$" },
                            ]}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            label="Discount Value"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountValue}
                            placeholder="0.00"
                            onChange={(e) =>
                              handleItemFieldChange(
                                idx,
                                "discountValue",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end font-semibold text-text-primary text-sm pt-6">
                        Line Total: $
                        {(
                          (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) -
                          (item.discountType === "PERCENTAGE"
                            ? ((Number(item.quantity) || 0) *
                                (Number(item.unitPrice) || 0) *
                                (Number(item.discountValue) || 0)) /
                              100
                            : Number(item.discountValue) || 0)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-card rounded-xl border border-border flex justify-between items-center text-sm font-bold text-text-primary">
                  <span>Estimated Total Amount:</span>
                  <span className="text-base text-brand-600">
                    ${subtotal.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Customer Notes
              </label>
              <textarea
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Notes visible to the customer..."
                className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Internal Notes
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Private approval notes..."
                className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs resize-none"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Generating..."
            disabled={items.length === 0}
          >
            Create Quotation
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateQuotationModal;
