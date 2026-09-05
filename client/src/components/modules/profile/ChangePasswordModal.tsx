import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSave({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      setError(
        errorObj.data?.message ||
          errorObj.message ||
          "Failed to update password. Please check your current password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      description="Enter your current password and choose a secure new one"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-border rounded-lg text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <Input
          label="Current Password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="Enter current password"
        />

        <Input
          label="New Password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="Minimum 8 characters"
          helperText="Must be at least 8 characters"
        />

        <Input
          label="Confirm New Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          placeholder="Repeat new password"
        />

        <div className="pt-3 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
