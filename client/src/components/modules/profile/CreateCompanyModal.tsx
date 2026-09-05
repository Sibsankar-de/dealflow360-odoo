import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { Building2, Globe, MapPin, MailCheck } from "lucide-react";

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
  onCreate: (data: CreateCompanyData) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!country.trim()) {
      setError("Country is required.");
      return;
    }
    if (!postalCode.trim()) {
      setError("Postal code is required.");
      return;
    }
    if (!addressLine.trim()) {
      setError("Address line is required.");
      return;
    }

    setError(null);
    onCreate({
      name: name.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      addressLine: addressLine.trim(),
      currency,
    });

    setName("");
    setCountry("");
    setPostalCode("");
    setAddressLine("");
    setCurrency("USD");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Company"
      description="Set up your company workspace details. You will automatically become the Company Admin."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-border rounded-lg text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <Input
          label="Company Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          onChange={(e) => setAddressLine(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
          placeholder="e.g. 100 Market Street, Suite 400"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Postal Code"
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            leftIcon={<MailCheck className="w-4 h-4" />}
            placeholder="e.g. 94103"
          />
          <Input
            label="Country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            leftIcon={<Globe className="w-4 h-4" />}
            placeholder="e.g. United States"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-border mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Company Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCompanyModal;
