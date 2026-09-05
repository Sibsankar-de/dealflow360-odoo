"use client";

import React, { useState } from "react";
import { AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CompanyMemberType, ROLE_LABELS } from "@/types/accesscontrol";
import { useRemoveCompanyMemberMutation } from "@/store/features/company/companyApi";

interface DeleteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  member: CompanyMemberType | null;
  isOwner?: boolean;
}

export function DeleteTeamMemberModal({
  isOpen,
  onClose,
  companyId,
  member,
  isOwner = false,
}: DeleteTeamMemberModalProps) {
  const [serverError, setServerError] = useState("");
  const [removeMember, { isLoading }] = useRemoveCompanyMemberMutation();

  if (!member) return null;

  const targetEmail = member.user?.email || "";
  const targetName = member.user?.userName || targetEmail || "Team Member";
  const roleLabel = ROLE_LABELS[member.role] || member.role;

  const handleConfirmDelete = async () => {
    if (isOwner) {
      setServerError("Cannot remove the company owner from the company.");
      return;
    }

    setServerError("");

    try {
      await removeMember({
        companyId,
        userId: member.userId,
      }).unwrap();

      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to remove member from company.";
      setServerError(errorMsg);
    }
  };

  const handleClose = () => {
    setServerError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Remove Team Member"
      description="Revoke company access and permissions for this user."
      size="md"
    >
      <ModalBody>
        <div className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {isOwner ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-warning text-sm rounded-lg flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Action Not Permitted</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  You cannot remove the company owner ({targetName}) from the company.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0 text-danger">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  Are you sure you want to remove this member?
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-medium text-text-primary">{targetName}</span> ({targetEmail}) with role <span className="font-medium text-text-primary">{roleLabel}</span> will immediately lose access to all company data, quotations, and active workflows.
                </p>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="outline" size="md" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isOwner}
          isLoading={isLoading}
          loadingText="Removing..."
          className="bg-danger hover:bg-red-700 text-white border-transparent shadow-xs"
          onClick={handleConfirmDelete}
        >
          Remove Member
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default DeleteTeamMemberModal;
