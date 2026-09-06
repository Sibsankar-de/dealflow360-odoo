import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User } from "lucide-react";

export interface EditProfileModalProps {
  isOpen: boolean;
  initialFullName: string;
  onClose: () => void;
  onSave: (data: { fullName: string }) => Promise<void> | void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  initialFullName,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFullName(initialFullName);
      setError(null);
    }
  }, [isOpen, initialFullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await onSave({ fullName: fullName.trim() });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      setError(
        errorObj.data?.message ||
          errorObj.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your personal details"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="space-y-4">
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
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
