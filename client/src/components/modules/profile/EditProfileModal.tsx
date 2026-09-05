import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Phone } from "lucide-react";

export interface EditProfileModalProps {
  isOpen: boolean;
  initialFullName: string;
  initialPhone?: string;
  onClose: () => void;
  onSave: (data: { fullName: string; phone: string }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  initialFullName,
  initialPhone = "",
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    onSave({ fullName: fullName.trim(), phone: phone.trim() });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your personal details and contact information"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-border rounded-lg text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="e.g. John Doe"
        />

        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
          placeholder="+1 (555) 000-0000"
        />

        <div className="pt-3 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
