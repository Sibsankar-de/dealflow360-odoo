"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { ProductSummaryResponseType } from "@/types/product";
import { useLazySearchProductsQuery } from "@/store/features/product/productApi";
import { useCreateDealQuotationMutation } from "@/store/features/deal/dealApi";
import { useUpdateQuotationMutation } from "@/store/features/quotation/quotationApi";
import { Plus, Trash2, Search, X, Loader2, Package } from "lucide-react";
import toast from "react-hot-toast";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  dealId: string;
  customerId: string;
}

interface ItemState {
  productId: string;
  productName?: string;
  productBaseUnit?: string;
  quantity: number | string;
  unitPrice: number | string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number | string;
  taxRate: number | string;
}

interface LineItemProductSearchProps {
  companyId: string;
  selectedProductId: string;
  selectedProductName?: string;
  selectedProductBaseUnit?: string;
  onSelectProduct: (product: ProductSummaryResponseType) => void;
  onClearProduct: () => void;
  hasError?: boolean;
}

const LineItemProductSearch: React.FC<LineItemProductSearchProps> = ({
  companyId,
  selectedProductId,
  selectedProductName,
  selectedProductBaseUnit,
  onSelectProduct,
  onClearProduct,
  hasError,
}) => {
  const [triggerSearch, { data: searchData, isFetching }] =
    useLazySearchProductsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = searchData?.data ?? [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedProductId && selectedProductName) {
    return (
      <div>
        <label className="text-xs font-medium text-text-primary block mb-1">
          Product
        </label>
        <div className="flex items-center justify-between p-2 bg-card border border-border rounded-lg min-h-[38px]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Package className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="text-xs font-semibold text-text-primary truncate">
              {selectedProductName}
            </span>
            {selectedProductBaseUnit && (
              <span className="text-[10px] text-text-muted shrink-0">
                ({selectedProductBaseUnit})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClearProduct}
            className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-medium text-text-primary block mb-1">
        Product <span className="text-danger">*</span>
      </label>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            setIsOpen(true);
            if (val.trim()) {
              triggerSearch({ companyId, query: val.trim(), limit: 10 });
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            if (searchQuery.trim()) {
              triggerSearch({ companyId, query: searchQuery.trim(), limit: 10 });
            }
          }}
          placeholder="Search product by name..."
          className={`w-full pl-8 pr-7 py-1.5 rounded-lg border bg-card text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs transition-colors ${
            hasError ? "border-danger" : "border-border"
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-border/50">
          {isFetching ? (
            <div className="p-2.5 text-xs text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span>Searching products...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-2.5 text-xs text-text-muted text-center">
              No products found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            searchResults.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  onSelectProduct(prod);
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="w-full px-2.5 py-2 text-left flex items-center justify-between hover:bg-surface transition-colors cursor-pointer group"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {prod.name}
                  </p>
                  {prod.description && (
                    <p className="text-[11px] text-text-muted truncate">
                      {prod.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-brand-600">
                    ${Number(prod.price).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    / {prod.baseUnit || "Unit"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  companyId,
  dealId,
  customerId,
}) => {
  const [createQuotation, { isLoading: isCreating }] =
    useCreateDealQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] =
    useUpdateQuotationMutation();

  const [items, setItems] = useState<ItemState[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setItems([
        {
          productId: "",
          productName: "",
          productBaseUnit: "",
          quantity: 1,
          unitPrice: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          taxRate: 0,
        },
      ]);
      setCurrency("USD");
      setValidUntil("");
      setCustomerNote("");
      setInternalNote("");
      setErrors({});
    }
  }, [isOpen]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: "",
        productBaseUnit: "",
        quantity: 1,
        unitPrice: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        taxRate: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectProduct = (index: number, product: ProductSummaryResponseType) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.id,
              productName: product.name,
              productBaseUnit: product.baseUnit,
              unitPrice: Number(product.price) || 0,
            }
          : item
      )
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.items;
      return copy;
    });
  };

  const handleClearProduct = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: "",
              productName: "",
              productBaseUnit: "",
              unitPrice: "",
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
    } else if (items.some((it) => !it.productId)) {
      newErrors.items = "Please search and select a valid product for all line items";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const lineItemPayload = items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountType: it.discountType,
        discountValue: Number(it.discountValue) || 0,
        taxRate: Number(it.taxRate) || 0,
      }));

      const res = await createQuotation({
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
          items: lineItemPayload,
        },
      }).unwrap();

      const created = res.data?.quotation;
      if (created?.id) {
        await updateQuotation({
          companyId,
          id: created.id,
          data: {
            currency,
            validUntil: validUntil ? new Date(validUntil).toISOString() : null,
            customerNote: customerNote.trim() || null,
            internalNote: internalNote.trim() || null,
            items: lineItemPayload,
          },
        }).unwrap();
      }

      toast.success("Quotation draft generated successfully.");
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to generate quotation";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate New Quotation"
      description="Create a commercial proposal and pricing schedule for this deal."
      size="xl"
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
                  Search products, specify quantities and unit discounts.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddItem}
              >
                Add Line Item
              </Button>
            </div>

            {errors.items && (
              <p className="text-xs font-medium text-danger">{errors.items}</p>
            )}

            {items.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6 bg-surface rounded-lg border border-dashed border-border">
                No items added yet. Click &quot;Add Line Item&quot; to search and select products.
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
                        <LineItemProductSearch
                          companyId={companyId}
                          selectedProductId={item.productId}
                          selectedProductName={item.productName}
                          selectedProductBaseUnit={item.productBaseUnit}
                          onSelectProduct={(prod) => handleSelectProduct(idx, prod)}
                          onClearProduct={() => handleClearProduct(idx)}
                          hasError={Boolean(errors.items && !item.productId)}
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
            isLoading={isCreating || isUpdating}
            loadingText="Generating..."
            disabled={isCreating || isUpdating || items.length === 0}
          >
            Create Quotation
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateQuotationModal;
