"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, AlertCircle, ShieldAlert } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  INVITABLE_COMPANY_ROLE_DEFINITIONS,
  BackendCompanyRole,
  CompanyMemberType,
} from "@/types/accesscontrol";
import { useUpdateCompanyMemberRoleMutation } from "@/store/features/company/companyApi";

interface EditTeamMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  member: CompanyMemberType | null;
  isOwner?: boolean;
}

export function EditTeamMemberRoleModal({
  isOpen,
  onClose,
  companyId,
  member,
  isOwner = false,
}: EditTeamMemberRoleModalProps) {
  const [role, setRole] = useState<BackendCompanyRole | "">(member?.role || "");
  const [prevMemberId, setPrevMemberId] = useState<string | null>(member?.id || null);
  const [roleError, setRoleError] = useState("");
  const [serverError, setServerError] = useState("");

  const [updateMemberRole, { isLoading }] =
    useUpdateCompanyMemberRoleMutation();

  if (member && member.id !== prevMemberId) {
    setPrevMemberId(member.id);
    setRole(member.role);
    setRoleError("");
    setServerError("");
  }

  if (!isOpen || !member) return null;

  const targetEmail = member.user?.email || "";
  const targetName = member.user?.userName || targetEmail || "Team Member";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isOwner) {
      setServerError("Cannot change the role of the company owner.");
      return;
    }

    if (!role) {
      setRoleError("Please select a role.");
      return;
    }

    if (role === member.role) {
      onClose();
      return;
    }

    setRoleError("");
    setServerError("");

    try {
      await updateMemberRole({
        companyId,
        data: {
          userEmail: targetEmail,
          role: role as BackendCompanyRole,
        },
      }).unwrap();

      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to update team member role.";
      setServerError(errorMsg);
    }
  };

  const handleClose = () => {
    setRoleError("");
    setServerError("");
    onClose();
  };

  const selectedRoleDef = INVITABLE_COMPANY_ROLE_DEFINITIONS.find(
    (r) => r.role === role
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Member Role"
      description={`Update access level and responsibilities for ${targetName}.`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {isOwner && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-warning text-sm rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Company Owner</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    This member owns the company organization. Their role must remain Company Admin.
                  </p>
                </div>
              </div>
            )}

            <div className="p-3.5 bg-surface border border-border rounded-lg space-y-1">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Member Information
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {targetName}
              </p>
              <p className="text-xs text-text-secondary">{targetEmail}</p>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1 select-none">
                Assigned Role <span className="text-danger font-semibold">*</span>
              </label>
              <div className="relative">
                <select
                  disabled={isOwner || isLoading}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as BackendCompanyRole);
                    if (roleError) setRoleError("");
                    if (serverError) setServerError("");
                  }}
                  className={clsx(
                    "w-full appearance-none rounded-lg border bg-card px-3 py-2 pr-10 text-sm text-text-primary transition-colors duration-150 shadow-xs",
                    "focus:outline-none focus:ring-2 focus:ring-offset-0",
                    "disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed",
                    roleError
                      ? "border-danger focus:border-danger focus:ring-danger/20"
                      : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20"
                  )}
                >
                  {INVITABLE_COMPANY_ROLE_DEFINITIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {roleError && (
                <p className="text-xs font-medium text-danger">{roleError}</p>
              )}
              {selectedRoleDef && (
                <p className="text-xs text-text-secondary mt-1">
                  {selectedRoleDef.description}
                </p>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isOwner}
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Update Role
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default EditTeamMemberRoleModal;
