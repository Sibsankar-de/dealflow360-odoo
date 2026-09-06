"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DealResponseType, DealStage, DealStatus } from "@/types/deal";
import { CustomerSummaryResponseType } from "@/types/customer";
import {
  useCreateDealMutation,
  useUpdateDealMutation,
} from "@/store/features/deal/dealApi";
import {
  useLazySearchCustomersQuery,
  useGetCustomerByIdQuery,
} from "@/store/features/customer/customerApi";
import { Search, X, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  deal?: DealResponseType | null;
}

const STAGE_OPTIONS: { key: DealStage; value: string }[] = [
  { key: "NEW", value: "New" },
  { key: "QUALIFICATION", value: "Qualification" },
  { key: "REQUIREMENT", value: "Requirement" },
  { key: "QUOTATION", value: "Quotation" },
  { key: "NEGOTIATION", value: "Negotiation" },
  { key: "WON", value: "Won" },
  { key: "LOST", value: "Lost" },
];

const STATUS_OPTIONS: { key: DealStatus; value: string }[] = [
  { key: "OPEN", value: "Open" },
  { key: "WON", value: "Won" },
  { key: "LOST", value: "Lost" },
  { key: "CANCELLED", value: "Cancelled" },
];

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  companyId,
  deal,
}) => {
  const isEditing = Boolean(deal);
  const [createDeal, { isLoading: isCreating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation();

  const [triggerSearchCustomers, { data: searchData, isFetching: isSearchingCustomers }] =
    useLazySearchCustomersQuery();
  const searchResults = searchData?.data ?? [];

  const [name, setName] = useState(deal?.name || "");
  const [customerId, setCustomerId] = useState(deal?.customerId || "");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    customerTier?: string | null;
    avatar?: string | null;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const { data: fetchedCustomerData } = useGetCustomerByIdQuery(
    { companyId, customerId: deal?.customerId || "" },
    { skip: !isOpen || !deal?.customerId || Boolean(deal?.customer) }
  );

  const [salesRepId, setSalesRepId] = useState(deal?.salesRepId || "");
  const [stage, setStage] = useState<DealStage>(deal?.stage || "NEW");
  const [status, setStatus] = useState<DealStatus>(deal?.status || "OPEN");
  const [expectedValue, setExpectedValue] = useState<number | string>(
    deal?.expectedValue ?? ""
  );
  const [probability, setProbability] = useState<number | string>(
    deal?.probability ?? 50
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    deal?.expectedCloseDate
      ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
      : ""
  );
  const [source, setSource] = useState(deal?.source || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (deal) {
      setName(deal.name || "");
      setCustomerId(deal.customerId || "");
      if (deal.customer) {
        setSelectedCustomer({
          id: deal.customerId || deal.customer.id,
          name: (deal.customer as any).name || deal.customer.userName || "Customer",
          email: deal.customer.email,
          customerTier: (deal.customer as any).customerTier || null,
          avatar: deal.customer.avatar,
        });
      } else if (fetchedCustomerData?.data?.customer) {
        const c = fetchedCustomerData.data.customer;
        setSelectedCustomer({
          id: c.id,
          name: c.name,
          email: c.email,
          customerTier: c.customerTier || null,
          avatar: c.avatar,
        });
      } else {
        setSelectedCustomer(null);
      }
      setSalesRepId(deal.salesRepId || "");
      setStage(deal.stage || "NEW");
      setStatus(deal.status || "OPEN");
      setExpectedValue(deal.expectedValue ?? "");
      setProbability(deal.probability ?? 50);
      setExpectedCloseDate(
        deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
          : ""
      );
      setSource(deal.source || "");
    } else {
      setName("");
      setCustomerId("");
      setSelectedCustomer(null);
      setSalesRepId("");
      setStage("NEW");
      setStatus("OPEN");
      setExpectedValue("");
      setProbability(50);
      setExpectedCloseDate("");
      setSource("");
    }
    setCustomerSearch("");
    setIsCustomerDropdownOpen(false);
    setErrors({});
  }, [deal, isOpen, fetchedCustomerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Deal name is required";
    if (!customerId) newErrors.customerId = "Customer is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditing && deal) {
        await updateDeal({
          companyId,
          id: deal.id,
          data: {
            name: name.trim(),
            customerId,
            salesRepId: salesRepId || undefined,
            stage,
            status,
            expectedValue: Number(expectedValue) || 0,
            probability: Number(probability) || 0,
            expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
            source: source.trim() || null,
          },
        }).unwrap();
        toast.success(`Deal "${name.trim()}" updated successfully.`);
      } else {
        await createDeal({
          companyId,
          data: {
            customerId,
            name: name.trim(),
            expectedValue: Number(expectedValue) || 0,
            probability: Number(probability) || 50,
            expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
            source: source.trim() || null,
          },
        }).unwrap();
        toast.success(`Deal "${name.trim()}" created successfully.`);
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save deal";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Deal" : "Create New Deal"}
      description={
        isEditing
          ? "Update deal attributes, pipeline stage, and valuation."
          : "Initialize a deal opportunity associated with a customer."
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
              label="Deal Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Q3 Enterprise Expansion"
              error={errors.name}
            />

            {/* Searchable Customer Picker */}
            {selectedCustomer ? (
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">
                  Customer <span className="text-danger">*</span>
                </label>
                <div className="flex items-center justify-between p-2 bg-surface border border-border rounded-lg min-h-[42px]">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedCustomer.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {selectedCustomer.name}
                        </span>
                        {selectedCustomer.customerTier && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            selectedCustomer.customerTier === "GOLD"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : selectedCustomer.customerTier === "SILVER"
                              ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}>
                            {selectedCustomer.customerTier}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {selectedCustomer.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerId("");
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setIsCustomerDropdownOpen(true);
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 px-2.5 py-1 rounded bg-card hover:bg-surface border border-border transition-colors cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative" ref={customerDropdownRef}>
                <label className="text-sm font-medium text-text-primary block mb-1.5">
                  Customer <span className="text-danger">*</span>
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearch(val);
                      setIsCustomerDropdownOpen(true);
                      if (val.trim()) {
                        triggerSearchCustomers({ companyId, query: val.trim(), limit: 10 });
                      }
                    }}
                    onFocus={() => {
                      setIsCustomerDropdownOpen(true);
                      if (customerSearch.trim()) {
                        triggerSearchCustomers({ companyId, query: customerSearch.trim(), limit: 10 });
                      }
                    }}
                    placeholder="Search customer by name or email..."
                    className={`w-full pl-9 pr-8 py-2 rounded-lg border bg-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs transition-colors ${
                      errors.customerId ? "border-danger" : "border-border"
                    }`}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch("")}
                      className="absolute right-2.5 p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {errors.customerId && (
                  <p className="text-xs text-danger mt-1">{errors.customerId}</p>
                )}

                {/* Dropdown search suggestions */}
                {isCustomerDropdownOpen && customerSearch.trim() && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-border/50">
                    {isSearchingCustomers ? (
                      <div className="p-3 text-xs text-text-muted flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                        <span>Searching registered customers...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-xs text-text-muted text-center">
                        No customers found matching &quot;{customerSearch}&quot;
                      </div>
                    ) : (
                      searchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(cust.id);
                            setSelectedCustomer(cust);
                            setCustomerSearch("");
                            setIsCustomerDropdownOpen(false);
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.customerId;
                              return copy;
                            });
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {cust.name?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">
                                {cust.name}
                              </p>
                              <p className="text-[11px] text-text-muted truncate">
                                {cust.email}
                              </p>
                            </div>
                          </div>
                          {cust.customerTier && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-surface border border-border text-text-secondary shrink-0">
                              {cust.customerTier}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expected Value ($)"
              type="number"
              min="0"
              step="0.01"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              placeholder="0.00"
            />

            <Input
              label="Probability (%)"
              type="number"
              min="0"
              max="100"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              placeholder="50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expected Close Date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />

            <Input
              label="Lead Source / Channel"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Inbound Website, Referral"
            />
          </div>

          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <Select
                label="Pipeline Stage"
                value={stage}
                onChange={(val) => setStage(val as DealStage)}
                options={STAGE_OPTIONS}
              />

              <Select
                label="Deal Status"
                value={status}
                onChange={(val) => setStatus(val as DealStatus)}
                options={STATUS_OPTIONS}
              />
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
            {isEditing ? "Update Deal" : "Create Deal"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default DealModal;
