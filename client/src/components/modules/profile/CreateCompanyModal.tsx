import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { Building2, Globe, MapPin, MailCheck } from "lucide-react";

import { createCompanySchema } from "@/schemas/company.schema";

export interface CreateCompanyData {
  name: string;
  country: string;
  postalCode: string;
  addressLine: string;
  currency: string;
}

export interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: CreateCompanyData) => Promise<void> | void;
  onSave?: (data: CreateCompanyData) => Promise<void> | void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateCompanyData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setCountry("");
      setPostalCode("");
      setAddressLine("");
      setCurrency("USD");
      setFieldErrors({});
      setGeneralError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const data: CreateCompanyData = {
      name: name.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      addressLine: addressLine.trim(),
      currency: currency.trim().toUpperCase(),
    };

    const parsed = createCompanySchema.safeParse(data);
    if (!parsed.success) {
      const errors: Partial<Record<keyof CreateCompanyData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof CreateCompanyData;
        if (key && !errors[key]) {
          errors[key] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await (onSave || onCreate)?.(parsed.data);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      setGeneralError(
        errorObj.data?.message ||
          errorObj.message ||
          "Failed to create company. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Company"
      description="Set up your company workspace details. You will automatically become the Company Admin."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden" noValidate>
        <ModalBody className="space-y-4">
          {generalError && (
            <div className="p-3 bg-red-50 border border-border rounded-lg text-xs font-medium text-danger">
              {generalError}
            </div>
          )}

          <Input
            label="Company Name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name)
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={fieldErrors.name}
            leftIcon={<Building2 className="w-4 h-4" />}
            placeholder="e.g. Acme Industrial Supplies"
          />

          <div>
            <CurrencySelector
              label="Default Currency"
              required
              value={currency}
              onChange={(val) => setCurrency(val)}
            />
          </div>

          <Input
            label="Address Line"
            required
            value={addressLine}
            onChange={(e) => {
              setAddressLine(e.target.value);
              if (fieldErrors.addressLine)
                setFieldErrors((prev) => ({ ...prev, addressLine: undefined }));
            }}
            error={fieldErrors.addressLine}
            leftIcon={<MapPin className="w-4 h-4" />}
            placeholder="e.g. 100 Market Street, Suite 400"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              required
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                if (fieldErrors.postalCode)
                  setFieldErrors((prev) => ({ ...prev, postalCode: undefined }));
              }}
              error={fieldErrors.postalCode}
              leftIcon={<MailCheck className="w-4 h-4" />}
              placeholder="e.g. 94103"
            />
            <Input
              label="Country"
              required
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (fieldErrors.country)
                  setFieldErrors((prev) => ({ ...prev, country: undefined }));
              }}
              error={fieldErrors.country}
              leftIcon={<Globe className="w-4 h-4" />}
              placeholder="e.g. United States"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Create Company Workspace
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateCompanyModal;
