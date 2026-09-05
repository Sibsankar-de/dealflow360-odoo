"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { Mail, ChevronDown, AlertCircle } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  INVITABLE_COMPANY_ROLE_DEFINITIONS,
  BackendCompanyRole,
} from "@/types/accesscontrol";
import { useAddCompanyMemberMutation } from "@/store/features/company/companyApi";

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function InviteTeamMemberModal({
  isOpen,
  onClose,
  companyId,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BackendCompanyRole | "">("");
  const [emailError, setEmailError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [serverError, setServerError] = useState("");

  const [addCompanyMember, { isLoading }] = useAddCompanyMemberMutation();

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const emailErr = validateEmail(email);
    const roleErr = role ? "" : "Please select a role for the member.";

    setEmailError(emailErr);
    setRoleError(roleErr);
    setServerError("");

    if (emailErr || roleErr) return;

    try {
      await addCompanyMember({
        companyId,
        data: {
          userEmail: email.trim().toLowerCase(),
          role: role as BackendCompanyRole,
        },
      }).unwrap();

      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to add team member to company.";
      setServerError(errorMsg);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("");
    setEmailError("");
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
      title="Add Team Member"
      description="Grant platform users access to this company workspace by specifying their registered email and role."
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

            <Input
              label="User Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
                if (serverError) setServerError("");
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={emailError}
              required
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1 select-none">
                Assigned Role <span className="text-danger font-semibold">*</span>
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as BackendCompanyRole | "");
                    if (roleError) setRoleError("");
                    if (serverError) setServerError("");
                  }}
                  className={clsx(
                    "w-full appearance-none rounded-lg border bg-card px-3 py-2 pr-10 text-sm text-text-primary transition-colors duration-150 shadow-xs",
                    "focus:outline-none focus:ring-2 focus:ring-offset-0",
                    roleError
                      ? "border-danger focus:border-danger focus:ring-danger/20"
                      : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
                    !role && "text-text-muted"
                  )}
                >
                  <option value="" disabled>
                    Select an operational role
                  </option>
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
            isLoading={isLoading}
            loadingText="Adding..."
          >
            Add Member
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default InviteTeamMemberModal;

