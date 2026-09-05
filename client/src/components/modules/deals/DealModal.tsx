"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DealResponseType, DealStage, DealStatus } from "@/types/deal";
import {
  useCreateDealMutation,
  useUpdateDealMutation,
} from "@/store/features/deal/dealApi";
import { useGetCompanyMembersQuery } from "@/store/features/company/companyApi";

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

  const { data: membersData } = useGetCompanyMembersQuery(companyId, {
    skip: !isOpen || !companyId,
  });
  const members = membersData?.data?.members || [];

  const [name, setName] = useState(deal?.name || "");
  const [customerId, setCustomerId] = useState(deal?.customerId || "");
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

  React.useEffect(() => {
    if (deal) {
      setName(deal.name || "");
      setCustomerId(deal.customerId || "");
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
      setSalesRepId("");
      setStage("NEW");
      setStatus("OPEN");
      setExpectedValue("");
      setProbability(50);
      setExpectedCloseDate("");
      setSource("");
    }
    setErrors({});
  }, [deal, isOpen]);

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
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save deal";
      setErrors({ form: errorMsg });
    }
  };

  const customerOptions = members
    .filter((m) => Boolean(m.user || m.userId))
    .map((m) => ({
      key: m.user?.id || m.userId,
      value: m.user
        ? `${m.user.userName} (${m.user.email})`
        : `User ${m.userId.slice(0, 8)}`,
    }));


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
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0">
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

            <Select
              label="Customer"
              required
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              options={customerOptions}
              placeholder="Select target customer"
              errorMessage={errors.customerId}
            />
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
