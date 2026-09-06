"use client";

import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WarehouseResponseType } from "@/types/warehouse";
import {
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
} from "@/store/features/warehouse/warehouseApi";
import toast from "react-hot-toast";

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  warehouse?: WarehouseResponseType | null;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  companyId,
  warehouse,
}) => {
  const isEditing = Boolean(warehouse);
  const [createWarehouse, { isLoading: isCreating }] =
    useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] =
    useUpdateWarehouseMutation();

  const [name, setName] = useState(warehouse?.name || "");
  const [country, setCountry] = useState(warehouse?.country || "United States");
  const [postalCode, setPostalCode] = useState(warehouse?.postalCode || "");
  const [addressLine, setAddressLine] = useState(
    warehouse?.addressLine || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || "");
      setCountry(warehouse.country || "United States");
      setPostalCode(warehouse.postalCode || "");
      setAddressLine(warehouse.addressLine || "");
    } else {
      setName("");
      setCountry("United States");
      setPostalCode("");
      setAddressLine("");
    }
    setErrors({});
  }, [warehouse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Warehouse name is required";
    if (!country.trim()) newErrors.country = "Country is required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!addressLine.trim()) newErrors.addressLine = "Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditing && warehouse) {
        await updateWarehouse({
          companyId,
          warehouseId: warehouse.id,
          data: {
            name: name.trim(),
            country: country.trim(),
            postalCode: postalCode.trim(),
            addressLine: addressLine.trim(),
          },
        }).unwrap();
        toast.success(`Warehouse "${name.trim()}" updated.`);
      } else {
        await createWarehouse({
          companyId,
          data: {
            name: name.trim(),
            country: country.trim(),
            postalCode: postalCode.trim(),
            addressLine: addressLine.trim(),
          },
        }).unwrap();
        toast.success(`Warehouse "${name.trim()}" created.`);
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save warehouse";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Warehouse" : "Add New Warehouse"}
      description={
        isEditing
          ? "Update warehouse location and facility details."
          : "Add a new fulfillment warehouse or distribution facility."
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalBody className="space-y-4 pt-0">
          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg">
              {errors.form}
            </div>
          )}

          <Input
            label="Warehouse Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Central Distribution Hub"
            error={errors.name}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States"
              error={errors.country}
            />

            <Input
              label="Postal Code"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 94105"
              error={errors.postalCode}
            />
          </div>

          <Input
            label="Address Line"
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="e.g. 500 Industrial Way, Suite 100"
            error={errors.addressLine}
          />
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
            {isEditing ? "Update Warehouse" : "Create Warehouse"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default WarehouseModal;
