import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Building2, Hash, Layers } from "lucide-react";

export interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; code: string; industry?: string }) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Company code is required.");
      return;
    }

    setError(null);
    onCreate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      industry: industry.trim() || undefined,
    });
    setName("");
    setCode("");
    setIndustry("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Company"
      description="Set up your company workspace. You will automatically become the Company Admin."
      size="sm"
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
          onChange={(e) => {
            setName(e.target.value);
            if (!code && e.target.value.trim().length >= 3) {
              setCode(
                e.target.value
                  .trim()
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .substring(0, 6)
                  .toUpperCase()
              );
            }
          }}
          leftIcon={<Building2 className="w-4 h-4" />}
          placeholder="e.g. Acme Industrial Supplies"
        />

        <Input
          label="Company Identifier / Code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          leftIcon={<Hash className="w-4 h-4" />}
          placeholder="e.g. ACME-IND"
          helperText="Unique short code used in quotation prefixes"
        />

        <Input
          label="Industry / Domain"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          leftIcon={<Layers className="w-4 h-4" />}
          placeholder="e.g. Manufacturing & Distribution"
        />

        <div className="pt-3 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCompanyModal;
